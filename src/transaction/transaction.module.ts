import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TRANSACTION_MODEL,
  TransactionSchema,
} from 'src/schemas/transaction-schema';

@Module({
  providers: [TransactionService],
  controllers: [TransactionController],
  imports: [
    MongooseModule.forFeature([
      { name: TRANSACTION_MODEL, schema: TransactionSchema },
    ]),
  ],
})
export class TransactionModule {}
