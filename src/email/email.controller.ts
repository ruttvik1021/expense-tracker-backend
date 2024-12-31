import { Controller, Get, Param, Req } from '@nestjs/common';
import { EmailService } from './email.service';
import { Request } from 'express';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('resend')
  async resendEmail(@Req() req: Request) {
    return this.emailService.resendEmail(req);
  }

  @Get('verify/:token')
  async verifyEmail(@Req() req: Request, @Param('token') token: string) {
    return this.emailService.verifyEmail(req, token);
  }
}
