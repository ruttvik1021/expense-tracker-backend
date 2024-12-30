import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { commonMessages } from 'src/utils/constants';

@Injectable()
export class ObjectIdValidationPipe implements PipeTransform<string> {
  transform(value: string): string {
    const isObjectId = Types.ObjectId.isValid(value);

    if (!isObjectId) {
      throw new BadRequestException(commonMessages.errors.notValidId);
    }

    return value;
  }
}
