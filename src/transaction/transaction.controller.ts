import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UsePipes,
} from '@nestjs/common';
import { JoiValidationPipe } from 'src/pipes/joi-validation.pipe';
import {
  CreateTransaction,
  CreateTransactionValidation,
  GetTransactionsValidation,
  ITransactionFilter,
} from 'src/schemas/transaction-schema';
import { TransactionService } from './transaction.service';
import { Request } from 'express';
import { ObjectIdValidationPipe } from 'src/pipes/objectIdValidationPipe';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}
  @Post('add')
  @UsePipes(new JoiValidationPipe(CreateTransactionValidation))
  async createTransaction(
    @Req() req: Request,
    @Body() body: CreateTransaction,
  ) {
    return this.transactionService.addTransaction(req, body);
  }

  @Post('get')
  @UsePipes(new JoiValidationPipe(GetTransactionsValidation))
  async getTransactions(@Req() req: Request, @Body() body: ITransactionFilter) {
    return this.transactionService.getTransactions(req, body);
  }

  @Get(':id')
  async getTransactionById(
    @Req() req: Request,
    @Param('id', ObjectIdValidationPipe) id: string,
  ) {
    return this.transactionService.getTransactionById(req, id);
  }

  @Delete(':id')
  async deleteTransaction(
    @Req() req: Request,
    @Param('id', ObjectIdValidationPipe) id: string,
  ) {
    return this.transactionService.deleteTransaction(req, id);
  }

  @Put(':id')
  @UsePipes(new JoiValidationPipe(CreateTransactionValidation))
  async updateTransaction(
    @Req() req: Request,
    @Body() body: CreateTransaction,
    @Param('id', ObjectIdValidationPipe) id: string,
  ) {
    return this.transactionService.updateTransaction(req, id, body);
  }

  @Post('lastMonthTransactionsAmount')
  async getLastMonthTransactionsAmount(
    @Req() req: Request,
    @Body() body: { date: string },
  ) {
    return this.transactionService.getLastMonthTransactionsAmount(req, body);
  }
}
