import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, USER_MODEL } from 'src/schemas/profile-schema';

@Module({
  providers: [EmailService],
  controllers: [EmailController],
  imports: [MongooseModule.forFeature([{ name: USER_MODEL, schema: User }])],
})
export class EmailModule {}
