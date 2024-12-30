import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { CategoryService } from 'src/category/category.service';
import {
  GetCategoriesSortedByAmountBodyType,
  GetTop5TransactionsOfMonthBodyType,
} from 'src/dtos/charts';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import {
  CATEGORY_MODEL,
  CategoryDocument,
  CategorySortBy,
} from 'src/schemas/category-schema';
import {
  TRANSACTION_MODEL,
  TransactionDocument,
  TransactionSortBy,
} from 'src/schemas/transaction-schema';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class ChartsService {
  constructor(
    @InjectModel(CATEGORY_MODEL)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(TRANSACTION_MODEL)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly categoryService: CategoryService,
    private readonly transactionService: TransactionService,
  ) {}

  async getCategoriesSortedByAmount(
    req: decodedRequest,
    body: GetCategoriesSortedByAmountBodyType,
  ) {
    const { categoryDate, limit } = body;
    const { categories } = await this.categoryService.getCategories(req, {
      categoryDate,
      sortBy: CategorySortBy.AMOUNT_SPENT,
      limit,
    });
    return { categories };
  }

  async getTop5TransactionsOfMonth(
    req: decodedRequest,
    body: GetTop5TransactionsOfMonthBodyType,
  ) {
    const { month, limit } = body;
    const { transactions } = await this.transactionService.getTransactions(
      req,
      {
        month,
        sortBy: TransactionSortBy.AMOUNT,
        limit,
      },
    );
    return (
      transactions
        ?.map((item) => {
          return {
            category: item.category.category,
            amount: item.amount,
            icon: item.category.icon,
            spentOn: item.spentOn,
          };
        })
        .filter((tran) => tran.amount > 0) || []
    );
  }

  async getCurrentAndLastWeekTransactionSum(req: decodedRequest) {
    const { user: decodedToken } = req;
    // Calculate start and end of current week (Monday to Sunday)
    const startOfWeek = new Date();
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0); // Set start of the current week

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // End of current week
    endOfWeek.setHours(23, 59, 59, 999);

    // Calculate start and end of the previous week (Monday to Sunday)
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7); // Start of last week
    startOfLastWeek.setHours(0, 0, 0, 0);

    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6); // End of last week
    endOfLastWeek.setHours(23, 59, 59, 999);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          userId: decodedToken?.userId,
          deletedAt: null,
        },
      },
      {
        $facet: {
          currentWeekTransactions: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $gte: [
                        {
                          $dateFromString: {
                            dateString: '$date',
                          },
                        },
                        startOfWeek,
                      ],
                    },
                    {
                      $lte: [
                        {
                          $dateFromString: {
                            dateString: '$date',
                          },
                        },
                        endOfWeek,
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' }, // Sum for current week
              },
            },
          ],
          lastWeekTransactions: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $gte: [
                        {
                          $dateFromString: {
                            dateString: '$date',
                          },
                        },
                        startOfLastWeek,
                      ],
                    },
                    {
                      $lte: [
                        {
                          $dateFromString: {
                            dateString: '$date',
                          },
                        },
                        endOfLastWeek,
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' }, // Sum for last week
              },
            },
          ],
        },
      },
    ];

    const result = await this.transactionModel.aggregate(pipeline);

    const currentWeekSum = result[0].currentWeekTransactions.length
      ? result[0].currentWeekTransactions[0].totalAmount
      : 0;
    const lastWeekSum = result[0].lastWeekTransactions.length
      ? result[0].lastWeekTransactions[0].totalAmount
      : 0;

    return {
      current: currentWeekSum,
      prev: lastWeekSum,
    };
  }

  async getDailyAndYesterdayTransactionSum(req: decodedRequest) {
    const { user: decodedToken } = req;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const endOfDayToday = new Date(today);
    endOfDayToday.setHours(23, 59, 59, 999); // End of today

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // Move date to yesterday
    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0); // Start of yesterday
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999); // End of yesterday

    const pipeline: PipelineStage[] = [
      {
        $match: {
          userId: decodedToken?.userId,
          deletedAt: null,
        },
      },
      {
        $facet: {
          todayTransactions: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $gte: [
                        {
                          $dateFromString: {
                            dateString: '$date',
                          },
                        },
                        today,
                      ],
                    },
                    {
                      $lte: [
                        {
                          $dateFromString: {
                            dateString: '$date',
                          },
                        },
                        endOfDayToday,
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
              },
            },
          ],
          yesterdayTransactions: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $gte: [
                        {
                          $dateFromString: {
                            dateString: '$date',
                          },
                        },
                        startOfYesterday,
                      ],
                    },
                    {
                      $lte: [
                        {
                          $dateFromString: {
                            dateString: '$date',
                          },
                        },
                        endOfYesterday,
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
              },
            },
          ],
        },
      },
    ];

    const result = await this.transactionModel.aggregate(pipeline);

    const todaySum = result[0].todayTransactions.length
      ? result[0].todayTransactions[0].totalAmount
      : 0;
    const yesterdaySum = result[0].yesterdayTransactions.length
      ? result[0].yesterdayTransactions[0].totalAmount
      : 0;

    return {
      prev: yesterdaySum,
      current: todaySum,
    };
  }

  async getCurrentAndLastMonthTransactionSum(req: decodedRequest) {
    const { user: decodedToken } = req;
    const startOfMonth = new Date();
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

    const pipeline: PipelineStage[] = [
      {
        $match: {
          userId: decodedToken?.userId,
          deletedAt: null,
        },
      },
      {
        $facet: {
          currentMonthTransactions: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $gte: [
                        {
                          $dateFromString: {
                            dateString: '$date',
                          },
                        },
                        startOfMonth,
                      ],
                    },
                    {
                      $lte: [
                        {
                          $dateFromString: {
                            dateString: '$date',
                          },
                        },
                        endOfMonth,
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' }, // Sum for current month
              },
            },
          ],
          lastMonthTransactions: [
            {
              $match: {
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
          ],
        },
      },
    ];

    const result = await this.transactionModel.aggregate(pipeline);

    const currentMonthSum = result[0].currentMonthTransactions.length
      ? result[0].currentMonthTransactions[0].totalAmount
      : 0;
    const lastMonthSum = result[0].lastMonthTransactions.length
      ? result[0].lastMonthTransactions[0].totalAmount
      : 0;

    return {
      current: currentMonthSum,
      prev: lastMonthSum,
    };
  }

  async getLastMonthSummaryData(req: decodedRequest) {
    const { user: decodedToken } = req;

    const startOfMonth = new Date();
    startOfMonth.setDate(1); // Set to the first day of the current month
    startOfMonth.setHours(0, 0, 0, 0); // Start of the day

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1); // Move to last month
    startOfLastMonth.setDate(1); // Set to the first day of the previous month
    startOfLastMonth.setHours(0, 0, 0, 0); // Start of the day

    const endOfLastMonth = new Date(startOfLastMonth);
    endOfLastMonth.setMonth(startOfLastMonth.getMonth() + 1); // Move to next month
    endOfLastMonth.setDate(0); // Last day of the previous month
    endOfLastMonth.setHours(23, 59, 59, 999); // End of the day

    const pipeline: PipelineStage[] = [
      {
        $addFields: {
          dateAsDate: {
            $cond: {
              if: {
                $regexMatch: {
                  input: '$date',
                  regex: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
                },
              },
              then: { $toDate: '$date' }, // Convert valid date strings to Date objects
              else: null, // Invalid dates are set to null
            },
          },
        },
      },
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
                      dateString: '$date', // Convert the string date to Date
                    },
                  },
                  startOfLastMonth, // Compare to the target date
                ],
              },
              {
                $lte: [
                  {
                    $dateFromString: {
                      dateString: '$date', // Convert the string date to Date
                    },
                  },
                  endOfLastMonth, // Compare to the target date
                ],
              },
            ],
          },
        },
      },
      {
        $facet: {
          totalAmount: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' }, // Total amount spent last month
              },
            },
          ],
          weeklyAvg: [
            {
              $group: {
                _id: { week: { $week: '$dateAsDate' } }, // Group by week number
                weeklyTotal: { $sum: '$amount' }, // Total amount for each week
              },
            },
            {
              $group: {
                _id: null,
                weeklyAvg: { $avg: '$weeklyTotal' }, // Average per week
              },
            },
          ],
          dailyAvg: [
            {
              $group: {
                _id: { day: { $dayOfMonth: '$dateAsDate' } }, // Group by day
                dailyTotal: { $sum: '$amount' }, // Total amount for each day
              },
            },
            {
              $group: {
                _id: null,
                dailyAvg: { $avg: '$dailyTotal' }, // Average per day
              },
            },
          ],
          daysWithTransactionsCount: [
            {
              $group: {
                _id: { day: { $dayOfYear: '$dateAsDate' } }, // Group by unique days
              },
            },
            {
              $count: 'daysWithTransactions', // Count the unique days with transactions
            },
          ],
        },
      },
      {
        $project: {
          totalAmount: { $arrayElemAt: ['$totalAmount.totalAmount', 0] },
          weeklyAvg: { $arrayElemAt: ['$weeklyAvg.weeklyAvg', 0] },
          dailyAvg: { $arrayElemAt: ['$dailyAvg.dailyAvg', 0] },
          daysWithTransactions: {
            $arrayElemAt: [
              '$daysWithTransactionsCount.daysWithTransactions',
              0,
            ],
          },
        },
      },
    ];

    const result = await this.transactionModel.aggregate(pipeline);

    return {
      totalAmount: result[0].totalAmount || 0,
      weeklyAvg: result[0].weeklyAvg || 0,
      dailyAvg: result[0].dailyAvg || 0,
      daysWithTransactions: result[0]?.daysWithTransactions || 0,
    };
  }
}
