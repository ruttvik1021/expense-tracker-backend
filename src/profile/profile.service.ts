import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import {
  ChangePasswordDTO,
  ProfileUpdateDTO,
  USER_MODEL,
  UserDocument,
} from 'src/schemas/profile-schema';
import { userMessages } from 'src/utils/constants';
import bcrypt from 'bcryptjs';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(USER_MODEL) private readonly userModel: Model<UserDocument>,
  ) {}
  async updateProfile(req: decodedRequest, body: ProfileUpdateDTO) {
    const { user } = req;
    const { name, budget } = body;

    const updatedUser = await this.userModel.findOneAndUpdate(
      { _id: user?.userId },
      { name, budget },
      { new: true, projection: { name: 1, budget: 1 } },
    );

    if (!updatedUser) {
      throw new BadRequestException(userMessages.errors.userNotFound);
    }

    return { data: updatedUser };
  }

  async getProfile(req: decodedRequest) {
    const { user } = req;
    console.log('user', user?.userId);

    const userDetails = await this.userModel.findById(user?.userId, {
      name: 1,
      budget: 1,
      createdAt: 1,
      isVerified: 1,
      _id: 0,
    });

    if (!user) {
      throw new BadRequestException(userMessages.errors.userNotFound);
    }

    return { data: userDetails };
  }

  async updatePassword(req: decodedRequest, body: ChangePasswordDTO) {
    const { user } = req;
    const userDetails = await this.userModel.findById(user?.userId);

    if (!userDetails) {
      throw new BadRequestException(userMessages.errors.userNotFound);
    }

    const { currentPassword, newPassword } = body;
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException(userMessages.errors.invalidPassword);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    await user.save();
    return { message: userMessages.messages.passwordUpdated };
  }
}
