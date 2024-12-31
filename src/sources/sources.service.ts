import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { decodedRequest } from 'src/middlewares/token-validator-middleware';
import { SOURCES_MODEL, SourcesDocument } from 'src/schemas/sources-schema';
import { sourceMessages } from 'src/utils/constants';

@Injectable()
export class SourcesService {
  constructor(
    @InjectModel(SOURCES_MODEL)
    private readonly sourcesModel: Model<SourcesDocument>,
  ) {}

  async getSources(req: decodedRequest) {
    const { user: decodedToken } = req;
    const sources = await this.sourcesModel.find({
      userId: decodedToken?.userId,
      deletedAt: null,
    });
    return sources;
  }

  async getSourceById(req: decodedRequest, sourceId: string) {
    const { user: decodedToken } = req;
    const source = await this.sourcesModel.findOne({
      _id: sourceId,
      userId: decodedToken?.userId,
      deletedAt: null,
    });
    if (!source) {
      throw new BadRequestException(sourceMessages.errors.sourceNotFound);
    }
    return { data: source };
  }

  async createSource(req: decodedRequest, body: { source: string }) {
    const { source } = body;
    const { user: decodedToken } = req;
    const findSource = await this.sourcesModel.findOne({
      source,
      userId: decodedToken?.userId,
    });
    if (findSource) {
      throw new BadRequestException(sourceMessages.errors.sourceAlreadyExists);
    }

    const newSource = new this.sourcesModel({
      userId: decodedToken?.userId,
      source,
    });

    await newSource.save();
    return {
      message: sourceMessages.messages.sourceCreated,
      source: newSource,
    };
  }

  async updateSource(
    req: decodedRequest,
    sourceId: string,
    body: { source: string },
  ) {
    const { source } = body;
    const { user: decodedToken } = req;

    const findSource = await this.sourcesModel.findOne({
      _id: sourceId,
      userId: decodedToken?.userId,
      deletedAt: null,
    });

    if (!findSource) {
      throw new BadRequestException(sourceMessages.errors.sourceNotFound);
    }

    findSource.source = source;
    await findSource.save();
    return { message: sourceMessages.messages.sourceUpdated };
  }

  async removeSource(req: decodedRequest, sourceId: string) {
    const { user: decodedToken } = req;
    const findSource = await this.sourcesModel.findOne({
      _id: sourceId,
      userId: decodedToken?.userId,
      deletedAt: null,
    });

    if (!findSource) {
      throw new BadRequestException(sourceMessages.errors.sourceNotFound);
    }

    findSource.deletedAt = new Date();
    await findSource.save();
    return { message: sourceMessages.messages.sourceDeleted };
  }
}
