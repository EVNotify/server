import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FIELD_TYPE_SETTINGS } from './decorators/settings-field.decorator';
import { SettingDto } from './dto/setting.dto';

@Injectable()
export class SettingsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const fieldType = this.reflector.get<string>(
      'fieldType',
      context.getHandler(),
    );

    if (fieldType !== FIELD_TYPE_SETTINGS) {
      return Promise.resolve(true);
    }

    const params = context.switchToHttp().getRequest().body;
    const dto = plainToInstance(SettingDto, params);

    if (!Object.keys(dto).length) {
      throw new BadRequestException(
        'One or more setting fields must be specified within request body',
      );
    }

    const errors = await validate(dto, { skipMissingProperties: true });

    if (errors.length) {
      throw new BadRequestException(errors);
    }

    return Promise.resolve(true);
  }
}
