import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import moment from 'moment';
import mongoose, { Model, PipelineStage } from 'mongoose';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import {
  CATEGORY_MODEL,
  CategoryCreationDuration,
  CategoryDocument,
  CategorySortBy,
  CreateCategoryDTO,
  GetCategoriesDTO,
  ImportFromLastMonthDTO,
  PeriodType,
} from 'src/schemas/category-schema';
import {
  TRANSACTION_MODEL,
  TransactionDocument,
} from 'src/schemas/transaction-schema';
import { categoryMessages } from 'src/utils/constants';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(CATEGORY_MODEL)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(TRANSACTION_MODEL)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async createCategory(req: decodedRequest, body: CreateCategoryDTO) {
    const { user: decodedToken } = req;
    const { category, icon, budget, periodType, startMonth, creationDuration } =
      body;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const isCategoryAlreadyCreated = await this.categoryModel.findOne({
      category,
      userId: decodedToken?.userId,
      deletedAt: null,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    if (periodType === PeriodType.ONCE) {
      if (isCategoryAlreadyCreated) {
        return { error: 'Category already exists' };
      }

      const newCategory = new this.categoryModel({
        category,
        icon,
        budget,
        userId: decodedToken?.userId,
        periodType: periodType,
      });

      await newCategory.save();

      return {
        message: categoryMessages.messages.categoryCreated,
      };
    } else {
      const categoriesToCreate = [];
      const periodStart = moment()
        .month(startMonth - 1)
        .date(1);
      const endPeriod =
        creationDuration === CategoryCreationDuration.NEXT_12_MONTHS
          ? moment().add(12, 'months')
          : moment().endOf('year');

      while (periodStart.isBefore(endPeriod)) {
        categoriesToCreate.push(
          new this.categoryModel({
            category,
            icon,
            budget,
            userId: decodedToken?.userId,
            createdAt: periodStart.toDate(),
            periodType: periodType,
          }),
        );

        switch (periodType) {
          case PeriodType.MONTHLY:
            periodStart.add(1, 'months');
            break;
          case PeriodType.QUARTERLY:
            periodStart.add(3, 'months');
            break;
          case PeriodType.HALF_YEARLY:
            periodStart.add(6, 'months');
            break;
          case PeriodType.ANNUALLY:
            periodStart.add(1, 'years');
            break;
          default:
            break;
        }
      }

      await this.categoryModel.insertMany(categoriesToCreate);

      return {
        message: `${categoriesToCreate.length} ${categoryMessages.messages.categoriesCreated}`,
      };
    }
  }

  async getCategories(req: decodedRequest, body: GetCategoriesDTO) {
    const { user: decodedToken } = req;

    const { categoryDate, sortBy, limit } = body;
    const startOfMonth = categoryDate ? new Date(categoryDate) : new Date();
    startOfMonth.setDate(1); // Set to the 1st day of the month
    startOfMonth.setHours(0, 0, 0, 0); // Start of the day

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1); // Move to the next month
    endOfMonth.setDate(0); // Go back to the last day of the current month
    endOfMonth.setHours(23, 59, 59, 999); // End of the day

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1); // Move to last month
    startOfLastMonth.setDate(1); // Set to the first day of the previous month
    startOfLastMonth.setHours(0, 0, 0, 0); // Start of the day

    const endOfLastMonth = new Date(startOfLastMonth);
    endOfLastMonth.setMonth(startOfLastMonth.getMonth() + 1); // Move to next month
    endOfLastMonth.setDate(0); // Last day of the previous month
    endOfLastMonth.setHours(23, 59, 59, 999); // End of the day

    let sortStage: any[] = [];

    switch (sortBy) {
      case CategorySortBy.BUDGET:
        sortStage = [{ $sort: { budget: -1 } }];
        break;
      case CategorySortBy.CATEGORY:
        sortStage = [{ $sort: { category: 1 } }];
        break;
      case CategorySortBy.RECENT_TRANSACTIONS:
        sortStage = [
          {
            $sort: { 'transactions.createdAt': -1 },
          },
        ];
        break;
      case CategorySortBy.AMOUNT_SPENT:
        sortStage = []; // Sorting will be handled after $group for amountSpent
        break;
      default:
        sortStage.push({ $sort: { budget: -1 } });
        break;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          userId: decodedToken?.userId,
          deletedAt: null,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $lookup: {
          from: 'transactions',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$category', '$$categoryId'] },
                    {
                      $gte: [
                        {
                          $dateFromString: {
                            dateString: '$date', // Convert the string date to Date
                          },
                        },
                        startOfMonth, // Compare to the target date
                      ],
                    },
                    {
                      $lte: [
                        {
                          $dateFromString: {
                            dateString: '$date', // Convert the string date to Date
                          },
                        },
                        endOfMonth, // Compare to the target date
                      ],
                    },
                  ],
                },
                deletedAt: null,
              },
            },
            {
              $project: {
                amount: 1, // Ensure this field exists in the transactions collection
                createdAt: 1,
              },
            },
          ],
          as: 'transactions',
        },
      },
      {
        $unwind: {
          path: '$transactions',
          preserveNullAndEmptyArrays: true, // Keep categories with no transactions
        },
      },
      {
        $group: {
          _id: '$_id',
          category: { $first: '$category' },
          icon: { $first: '$icon' },
          budget: { $first: '$budget' },
          totalAmountSpent: { $sum: '$transactions.amount' },
          periodType: { $first: '$periodType' },
        },
      },
      ...sortStage, // Apply sorting after $group
    ];

    if (sortBy === CategorySortBy.AMOUNT_SPENT) {
      pipeline.push({
        $sort: { totalAmountSpent: -1 }, // Sort by totalAmountSpent after grouping
      });
    }

    if (limit) {
      pipeline.push({ $limit: limit });
    }

    const categories = await this.categoryModel.aggregate(pipeline);

    return {
      categories: categories,
    };
  }

  async getCategoryById(req: decodedRequest, categoryId: string) {
    const { user: decodedToken } = req;
    const category = await this.categoryModel.findById({
      _id: categoryId,
      userId: decodedToken?.userId,
      deletedAt: null,
    });
    if (!category) {
      throw new BadRequestException(categoryMessages.errors.categoryNotFound);
    }
    return { data: category };
  }

  async deleteCategory(req: decodedRequest, categoryId: string) {
    const { user: decodedToken } = req;
    try {
      await this.categoryModel.findOneAndUpdate(
        {
          _id: categoryId,
          userId: decodedToken?.userId,
          deletedAt: null,
        },
        {
          deletedAt: new Date(),
        },
      );

      await this.transactionModel.updateMany(
        { category: categoryId, userId: decodedToken?.userId },
        {
          $set: {
            deletedAt: new Date(),
          },
        },
      );

      return {
        message: categoryMessages.messages.categoryDeleted,
      };
    } catch (error) {
      throw new BadRequestException(categoryMessages.errors.categoryNotFound);
    }
  }

  async updateCategory(
    req: decodedRequest,
    categoryId: string,
    body: CreateCategoryDTO,
  ) {
    const { user: decodedToken } = req;
    const updatedCategory = await this.categoryModel.findOneAndUpdate(
      { _id: categoryId, userId: decodedToken?.userId, deletedAt: null },
      body,
      {
        new: true,
      },
    );

    if (!updatedCategory) {
      throw new BadRequestException(categoryMessages.errors.categoryNotFound);
    }

    return {
      message: categoryMessages.messages.categoryUpdated,
    };
  }

  async getPreviousMonthCategories(req: decodedRequest) {
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    return await this.getCategories(req, {
      categoryDate: previousMonth,
      sortBy: CategorySortBy.CATEGORY,
    });
  }

  async importFromLastMonth(req: decodedRequest, body: ImportFromLastMonthDTO) {
    const { user: decodedToken } = req;
    const list = body;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    // Fetch all categories in the list to import
    const categoriesToImport = await this.categoryModel.find({
      _id: { $in: list },
    });

    // Fetch existing categories for the user in the current month
    const existingCategories = await this.categoryModel.find({
      userId: decodedToken?.userId,
      deletedAt: null,
      category: { $in: categoriesToImport.map((cat) => cat.category) },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const existingCategoryNames = new Set(
      existingCategories.map((cat) => cat.category),
    );

    // Separate already-created and new categories
    const alreadyCreatedCategories: string[] = [];
    const categoriesToCreate: CategoryDocument[] = [];

    for (const category of categoriesToImport) {
      if (existingCategoryNames.has(category.category)) {
        alreadyCreatedCategories.push(category.category);
      } else {
        categoriesToCreate.push(
          new this.categoryModel({
            category: category.category,
            icon: category.icon,
            budget: category.budget,
            userId: decodedToken?.userId,
            periodType: PeriodType.ONCE,
          }),
        );
      }
    }

    // Insert new categories if any
    if (categoriesToCreate.length > 0) {
      await this.categoryModel.insertMany(categoriesToCreate);
    }

    // Return response message
    return {
      message:
        alreadyCreatedCategories.length > 0
          ? `Categories already created this month: ${alreadyCreatedCategories.join(
              ', ',
            )}`
          : 'Categories imported successfully',
      error: alreadyCreatedCategories.length > 0 ? true : false,
    };
  }
}
