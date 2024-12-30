import { Body, Controller, Get, Put, Req, UsePipes } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JoiValidationPipe } from 'src/pipes/joi-validation.pipe';
import { Request } from 'express';
import {
  ChangePasswordDTO,
  ChangePasswordValidation,
  ProfileUpdateDTO,
  UpdateProfileValidation,
} from 'src/schemas/profile-schema';

@Controller('/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Put()
  @UsePipes(new JoiValidationPipe(UpdateProfileValidation))
  async updateProfile(@Req() req: Request, @Body() body: ProfileUpdateDTO) {
    return this.profileService.updateProfile(req, body);
  }

  @Get()
  async getProfile(@Req() req: Request) {
    return this.profileService.getProfile(req);
  }

  @Put('password')
  @UsePipes(new JoiValidationPipe(ChangePasswordValidation))
  async updatePassword(@Req() req: Request, @Body() body: ChangePasswordDTO) {
    return this.profileService.updatePassword(req, body);
  }
}
