import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CATEGORY_MODEL, CategorySchema } from 'src/schemas/category-schema';
import {
  TRANSACTION_MODEL,
  TransactionSchema,
} from 'src/schemas/transaction-schema';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  providers: [CategoryService],
  controllers: [CategoryController],
  imports: [
    MongooseModule.forFeature([
      { name: CATEGORY_MODEL, schema: CategorySchema },
      { name: TRANSACTION_MODEL, schema: TransactionSchema },
    ]),
  ],
})
export class CategoryModule {}
