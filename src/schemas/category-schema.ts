import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Types } from 'mongoose';

export enum PeriodType {
  ONCE = 'once',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  HALF_YEARLY = 'half-yearly',
  ANNUALLY = 'annually',
}

export enum CategoryCreationDuration {
  NEXT_12_MONTHS = 'next12Months',
  YEAR_END = 'yearEnd',
}

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
export class Category {
  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  budget: number;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Users' })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: PeriodType, required: true })
  periodType: PeriodType;

  @Prop()
  deletedAt: Date;
}

export type CategoryDocument = Category & Document;
export const CategorySchema = SchemaFactory.createForClass(Category);
export const CATEGORY_MODEL = Category.name;

export type CreateCategoryDTO = {
  category: string;
  icon: string;
  budget: number;
  periodType: PeriodType;
  startMonth: number;
  creationDuration: CategoryCreationDuration;
};

export enum CategorySortBy {
  CATEGORY = 'category',
  BUDGET = 'budget',
  RECENT_TRANSACTIONS = 'recentTransactions',
  AMOUNT_SPENT = 'amountSpent',
}

export type GetCategoriesDTO = {
  categoryDate: Date;
  sortBy: CategorySortBy;
  limit?: number;
};

export type ImportFromLastMonthDTO = string[];
