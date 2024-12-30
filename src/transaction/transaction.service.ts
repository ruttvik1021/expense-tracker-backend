import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import {
  CreateTransaction,
  TRANSACTION_MODEL,
  TransactionDocument,
} from 'src/schemas/transaction-schema';
import { transactionMessages } from 'src/utils/constants';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(TRANSACTION_MODEL)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async addTransaction(req: decodedRequest, body: CreateTransaction) {
    const { user: decodedToken } = req;
    const { amount, spentOn, date, category, source } = body;

    const newTransaction = new this.transactionModel({
      amount,
      spentOn,
      date,
      category,
      userId: decodedToken?.userId,
      source: source || null,
    });

    await newTransaction.save();

    return {
      message: transactionMessages.messages.transactionCreated,
      transaction: newTransaction,
    };
  }

  async getTransactions(req: decodedRequest, body: any) {
    const { user: decodedToken } = req;
    const { categoryId, month, sortBy, limit } = body;

    const startOfMonth = month ? new Date(month) : new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          userId: decodedToken?.userId,
          deletedAt: null,
          ...(categoryId ? { category: categoryId } : {}),
          $expr: {
            $and: [
              {
                $gte: [
                  { $dateFromString: { dateString: '$date' } },
                  startOfMonth,
                ],
              },
              {
                $lte: [
                  { $dateFromString: { dateString: '$date' } },
                  endOfMonth,
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          dateAsDate: { $dateFromString: { dateString: '$date' } },
        },
      },
      { $sort: { dateAsDate: -1 } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $lookup: {
          from: 'sources',
          localField: 'source',
          foreignField: '_id',
          as: 'source',
        },
      },
      { $unwind: { path: '$source', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          amount: 1,
          spentOn: 1,
          date: 1,
          source: { source: 1, _id: 1 },
          category: { category: 1, icon: 1, _id: 1 },
        },
      },
    ];

    if (sortBy) {
      pipeline.push({ $sort: { [sortBy]: -1 } });
    }

    if (limit) {
      pipeline.push({ $limit: limit });
    }

    const transactions = await this.transactionModel.aggregate(pipeline);

    return { transactions };
  }

  async getTransactionById(req: decodedRequest, transactionId: string) {
    const { user: decodedToken } = req;
    const transaction = await this.transactionModel.findOne({
      _id: transactionId,
      userId: decodedToken?.userId,
      deletedAt: null,
    });

    if (!transaction) {
      throw new BadRequestException(
        transactionMessages.errors.transactionNotFound,
      );
    }

    return { data: transaction };
  }

  async deleteTransaction(req: decodedRequest, transactionId: string) {
    const { user: decodedToken } = req;
    const transaction = await this.transactionModel.findOneAndUpdate(
      { _id: transactionId, userId: decodedToken?.userId, deletedAt: null },
      { deletedAt: new Date() },
    );

    if (!transaction) {
      throw new BadRequestException(
        transactionMessages.errors.transactionNotFound,
      );
    }

    return {
      message: transactionMessages.messages.transactionDeleted,
      id: transactionId,
    };
  }

  async updateTransaction(
    req: decodedRequest,
    transactionId: string,
    body: any,
  ) {
    const { user: decodedToken } = req;

    const updatedTransaction = await this.transactionModel.findOneAndUpdate(
      { _id: transactionId, userId: decodedToken?.userId, deletedAt: null },
      body,
      { new: true },
    );

    if (!updatedTransaction) {
      throw new BadRequestException(
        transactionMessages.errors.transactionNotFound,
      );
    }

    return {
      message: transactionMessages.messages.transactionUpdated,
      transaction: updatedTransaction,
    };
  }

  async getLastMonthTransactionsAmount(
    req: decodedRequest,
    body: { date: string },
  ) {
    const { user: decodedToken } = req;
    const { date } = body;
    const startOfMonth = new Date(date);
    startOfMonth.setDate(1); // Set to the first day of the current month
    startOfMonth.setHours(0, 0, 0, 0); // Start of the day

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Move to next month
    endOfMonth.setDate(0); // Go back to the last day of the current month
    endOfMonth.setHours(23, 59, 59, 999); // End of the day

    // Calculate start and end of the previous month
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1); // Move to last month
    startOfLastMonth.setDate(1); // Set to the first day of the previous month
    startOfLastMonth.setHours(0, 0, 0, 0); // Start of the day

    const endOfLastMonth = new Date(startOfLastMonth);
    endOfLastMonth.setMonth(startOfLastMonth.getMonth() + 1); // Move to next month
    endOfLastMonth.setDate(0); // Last day of the previous month
    endOfLastMonth.setHours(23, 59, 59, 999); // End of the day
    const lastMonthpipeline: PipelineStage[] = [
      {
        $match: {
          userId: decodedToken?.userId,
          deletedAt: null,
          $expr: {
            $and: [
              {
                $gte: [
                  {
                    $dateFromString: {
                      dateString: '$date',
                    },
                  },
                  startOfLastMonth,
                ],
              },
              {
                $lte: [
                  {
                    $dateFromString: {
                      dateString: '$date',
                    },
                  },
                  endOfLastMonth,
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }, // Sum for last month
        },
      },
    ];

    const lastMonthAmount =
      await this.transactionModel.aggregate(lastMonthpipeline);

    return {
      lastMonthAmount: lastMonthAmount[0]?.totalAmount || 0,
    };
  }
}
