import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, USER_MODEL } from 'src/schemas/profile-schema';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService],
  imports: [MongooseModule.forFeature([{ name: USER_MODEL, schema: User }])],
})
export class AuthModule {}
