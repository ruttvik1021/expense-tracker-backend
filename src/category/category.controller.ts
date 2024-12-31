import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  CreateCategoryDTO,
  GetCategoriesDTO,
} from 'src/schemas/category-schema';
import { CategoryService } from './category.service';
import { ObjectIdValidationPipe } from 'src/pipes/objectIdValidationPipe';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async getCategories(@Req() req: Request, @Body() body: GetCategoriesDTO) {
    return this.categoryService.getCategories(req, body);
  }

  @Post('create')
  async createCategory(@Req() req: Request, @Body() body: CreateCategoryDTO) {
    return this.categoryService.createCategory(req, body);
  }

  @Get(':id')
  async getCategoryById(
    @Req() req: Request,
    @Param('id', ObjectIdValidationPipe) id: string,
  ) {
    return this.categoryService.getCategoryById(req, id);
  }

  @Delete(':id')
  async deleteCategory(
    @Req() req: Request,
    @Param('id', ObjectIdValidationPipe) id: string,
  ) {
    return this.categoryService.deleteCategory(req, id);
  }

  @Put(':id')
  async updateCategory(
    @Req() req: Request,
    @Body() body: CreateCategoryDTO,
    @Param('id', ObjectIdValidationPipe) id: string,
  ) {
    return this.categoryService.updateCategory(req, id, body);
  }

  @Get('previous-month-list')
  async getPreviousMonthCategories(@Req() req: Request) {
    return this.categoryService.getPreviousMonthCategories(req);
  }

  @Post('import-from-last-month')
  async importFromLastMonth(@Req() req: Request, @Body() body: any) {
    return this.categoryService.importFromLastMonth(req, body);
  }
}
