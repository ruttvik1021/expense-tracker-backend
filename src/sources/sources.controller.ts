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
import { SourcesService } from './sources.service';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  async getSources(@Req() req: Request) {
    return this.sourcesService.getSources(req);
  }

  @Get(':sourceId')
  async getSourceById(
    @Req() req: Request,
    @Param('sourceId') sourceId: string,
  ) {
    return this.sourcesService.getSourceById(req, sourceId);
  }

  @Post('create')
  async createSource(@Req() req: Request, @Body() body: { source: string }) {
    return this.sourcesService.createSource(req, body);
  }

  @Put(':sourceId')
  async updateSource(
    @Req() req: Request,
    @Param('sourceId') sourceId: string,
    @Body() body: { source: string },
  ) {
    return this.sourcesService.updateSource(req, sourceId, body);
  }

  @Delete(':sourceId')
  async deleteSource(@Req() req: Request, @Param('sourceId') sourceId: string) {
    return this.sourcesService.removeSource(req, sourceId);
  }
}
