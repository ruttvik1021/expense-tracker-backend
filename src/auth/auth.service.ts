import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { ILogin } from 'src/schemas/auth-schema';
import { USER_MODEL, UserDocument } from 'src/schemas/profile-schema';
import { authenticationConstants } from 'src/utils/constants';
import { sendVerificationEmail } from 'src/utils/mailService';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(USER_MODEL) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(body: ILogin) {
    const jwtSecret = this.configService.get('JWT_SECRET')!;
    const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN')!;
    const { email, password } = body;
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException(
        authenticationConstants.errors.invalidCredentials,
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new BadRequestException(
        authenticationConstants.errors.invalidCredentials,
      );
    }

    if (!user.isVerified) {
      const { tokenExpiration, verificationToken } =
        await sendVerificationEmail({
          to: email,
        });

      user.verificationToken = verificationToken;
      user.tokenExpiration = tokenExpiration;
      await user.save();
    }

    const token = await this.jwtService.signAsync(
      { userId: user._id },
      { secret: jwtSecret, expiresIn: jwtExpiresIn },
    );

    return {
      message: 'Login successful',
      token,
      isEmailVerified: user.isVerified,
    };
  }

  async register(body: ILogin) {
    const { email, password } = body;
    const isUserAlreadyRegistered = await this.userModel.findOne({ email });

    if (isUserAlreadyRegistered) {
      throw new BadRequestException(authenticationConstants.errors.userExists);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { tokenExpiration, verificationToken } = await sendVerificationEmail({
      to: email,
    });

    const newUser = new this.userModel({
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      tokenExpiration,
    });

    await newUser.save();
  }
}
