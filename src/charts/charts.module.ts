import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryService } from 'src/category/category.service';
import { CATEGORY_MODEL, CategorySchema } from 'src/schemas/category-schema';
import {
  TRANSACTION_MODEL,
  TransactionSchema,
} from 'src/schemas/transaction-schema';
import { ChartsController } from './charts.controller';
import { ChartsService } from './charts.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Module({
  providers: [ChartsService, CategoryService, TransactionService],
  controllers: [ChartsController],
  imports: [
    MongooseModule.forFeature([
      { name: CATEGORY_MODEL, schema: CategorySchema },
      { name: TRANSACTION_MODEL, schema: TransactionSchema },
    ]),
  ],
})
export class ChartsModule {}
