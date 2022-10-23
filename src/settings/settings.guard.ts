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
import { FIELDS, SettingDto } from './dto/setting.dto';

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

    const req = context.switchToHttp().getRequest();
    let params = [];

    if (req.params.field) {
      params[req.params.field] = null;
    } else {
      params = req.body;
    }

    const hasSettingsField = Object.keys(params).some((field) => {
      return FIELDS.some((dtoField) => dtoField === field);
    });

    if (!hasSettingsField) {
      throw new BadRequestException(
        'One or more setting fields must be specified within request params or body',
      );
    }

    const dto = plainToInstance(SettingDto, params);
    const errors = await validate(dto, { skipMissingProperties: true });

    if (errors.length) {
      throw new BadRequestException(errors);
    }

    return Promise.resolve(true);
  }
}
