import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
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
export class Transaction {
  @Prop({ required: true })
  amount: number;

  @Prop({ default: '' })
  spentOn: string;

  @Prop()
  date: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Source', required: false })
  source?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ default: null })
  deletedAt: Date;
}

export type TransactionDocument = Transaction & Document;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);
export const TRANSACTION_MODEL = Transaction.name;

export interface CreateTransaction {
  amount: number;
  category: string;
  date: string;
  spentOn: string;
  source: string;
}

export const CreateTransactionValidation = Joi.object({
  amount: Joi.number().required(),
  category: Joi.string().required(),
  date: Joi.string().required(),
  spentOn: Joi.string().required(),
  source: Joi.string().required(),
});

export enum TransactionSortBy {
  AMOUNT = 'amount',
}

export interface ITransactionFilter {
  month: string;
  categoryId: string;
  minAmount: number;
  maxAmount: number;
  sortBy?: TransactionSortBy;
  limit?: number;
}

export const GetTransactionsValidation = Joi.object({
  month: Joi.string().optional(),
  categoryId: Joi.string().optional(),
  minAmount: Joi.number().optional(),
  maxAmount: Joi.number().optional(),
  sortBy: Joi.string().optional(),
  limit: Joi.number().optional(),
});
