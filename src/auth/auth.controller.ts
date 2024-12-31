import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ILogin } from 'src/schemas/auth-schema';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: ILogin) {
    return this.authService.login(body);
  }

  @Post('register')
  async register(@Body() body: ILogin) {
    return this.authService.register(body);
  }
}
