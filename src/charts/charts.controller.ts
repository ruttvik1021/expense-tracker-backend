import { Body, Controller, Get, Post, Req, UsePipes } from '@nestjs/common';
import {
  GetCategoriesSortedByAmountBodyType,
  GetCategoriesSortedByAmountBodyValidation,
  GetTop5TransactionsOfMonthBodyValidation,
  GetTop5TransactionsOfMonthBodyType,
} from 'src/dtos/charts';
import { JoiValidationPipe } from 'src/pipes/joi-validation.pipe';
import { ChartsService } from './charts.service';
import { Request } from 'express';

@Controller('charts')
export class ChartsController {
  constructor(private readonly chartsService: ChartsService) {}

  @Post('getCategories')
  @UsePipes(new JoiValidationPipe(GetCategoriesSortedByAmountBodyValidation))
  async getCategories(
    @Req() req: Request,
    @Body() body: GetCategoriesSortedByAmountBodyType,
  ) {
    return this.chartsService.getCategoriesSortedByAmount(req, body);
  }

  @Post('getTransactions')
  @UsePipes(new JoiValidationPipe(GetTop5TransactionsOfMonthBodyValidation))
  async getTransactions(
    @Req() req: Request,
    @Body() body: GetTop5TransactionsOfMonthBodyType,
  ) {
    return this.chartsService.getTop5TransactionsOfMonth(req, body);
  }

  @Get('weekTransactionSum')
  async getWeekTransactionSum(@Req() req: Request) {
    return this.chartsService.getCurrentAndLastWeekTransactionSum(req);
  }
  @Get('DayTransactionSum')
  async getDayTransactionSum(@Req() req: Request) {
    return this.chartsService.getDailyAndYesterdayTransactionSum(req);
  }

  @Get('monthTransactionSum')
  async getMonthTransactionSum(@Req() req: Request) {
    return this.chartsService.getCurrentAndLastMonthTransactionSum(req);
  }

  @Get('lastMonthSummary')
  async getLastMonthSummary(@Req() req: Request) {
    return this.chartsService.getLastMonthSummaryData(req);
  }
}
