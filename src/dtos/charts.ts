import * as Joi from 'joi';

export type GetCategoriesSortedByAmountBodyType = {
  categoryDate: Date;
  limit?: number;
};

export type GetTop5TransactionsOfMonthBodyType = {
  month: string;
  limit?: number;
};

export const GetCategoriesSortedByAmountBodyValidation = Joi.object({
  categoryDate: Joi.date().required(),
  limit: Joi.number().optional(),
});

export const GetTop5TransactionsOfMonthBodyValidation = Joi.object({
  month: Joi.string().required(),
  limit: Joi.number().optional(),
});
