import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

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
export class Sources {
  @Prop({ required: true })
  source: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: null })
  deletedAt: Date;
}

export type SourcesDocument = Sources & Document;
export const SourcesSchema = SchemaFactory.createForClass(Sources);
export const SOURCES_MODEL = Sources.name;
