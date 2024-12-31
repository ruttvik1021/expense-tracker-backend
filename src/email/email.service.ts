import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import { USER_MODEL, UserDocument } from 'src/schemas/profile-schema';
import { emailMessages, userMessages } from 'src/utils/constants';
import {
  isVerificationCodeExpired,
  sendVerificationEmail,
} from 'src/utils/mailService';

@Injectable()
export class EmailService {
  constructor(
    @InjectModel(USER_MODEL) private readonly userModel: Model<UserDocument>,
  ) {}

  async resendEmail(req: decodedRequest) {
    const { user: decodedToken } = req;
    const user = await this.userModel.findById(decodedToken?.userId);
    if (!user) {
      throw new BadRequestException(userMessages.errors.userNotFound);
    }
    const { email } = user;
    const { tokenExpiration, verificationToken } = await sendVerificationEmail({
      to: email,
    });
    await this.userModel.findByIdAndUpdate(decodedToken?.userId, {
      verificationToken,
      tokenExpiration,
    });
    return { message: emailMessages.messages.verificationEmailSent };
  }

  async verifyEmail(req: decodedRequest, token: string) {
    const { user: decodedToken } = req;
    const user = await this.userModel.findOne({
      verificationToken: token,
    });

    if (!user?.tokenExpiration) {
      throw new BadRequestException(emailMessages.errors.invalidToken);
    }

    const isExpired = isVerificationCodeExpired(user.tokenExpiration);

    if (isExpired) {
      if (decodedToken?.userId) {
        this.resendEmail(req);
      }
      throw new BadRequestException(
        `Verification code expired, ${
          decodedToken?.userId
            ? 'We have sent a new one'
            : 'Login and resend code again'
        }.`,
      );
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.tokenExpiration = null;
    await user.save();
    return { message: emailMessages.messages.emailVerified };
  }
}
