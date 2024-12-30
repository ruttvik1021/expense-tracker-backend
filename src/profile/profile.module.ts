import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { User, USER_MODEL } from 'src/schemas/profile-schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
  imports: [MongooseModule.forFeature([{ name: USER_MODEL, schema: User }])],
})
export class ProfileModule {}
