import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as Joi from 'joi';

@Schema({
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.createdAt;
      delete ret.updatedAt;
      delete ret.__v;
    },
  },
})
export class Users {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  name: string;

  @Prop({ default: 0 })
  budget: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: String, default: null })
  verificationToken: string | null;

  @Prop({ type: Date, default: null })
  tokenExpiration: Date | null;
}

export type UserDocument = Users & Document;
export const User = SchemaFactory.createForClass(Users);
export const USER_MODEL = Users.name;

export type ChangePasswordDTO = {
  currentPassword: string;
  newPassword: string;
};

export type ProfileUpdateDTO = {
  name: string;
  budget: number;
};

export const UpdateProfileValidation = Joi.object({
  name: Joi.string().required(),
  budget: Joi.number().required(),
});

export const ChangePasswordValidation = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().required(),
});
