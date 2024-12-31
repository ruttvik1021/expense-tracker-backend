import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SOURCES_MODEL, SourcesSchema } from 'src/schemas/sources-schema';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';

@Module({
  controllers: [SourcesController],
  providers: [SourcesService],
  imports: [
    MongooseModule.forFeature([{ name: SOURCES_MODEL, schema: SourcesSchema }]),
  ],
})
export class SourcesModule {}
