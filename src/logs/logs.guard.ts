import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LOG_ROLE_NAME } from './decorators/owns-log.decorator';
import { LogNotExistsException } from './exceptions/log-not-exists.exception';
import { LogsService } from './logs.service';

@Injectable()
export class LogsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly logsService: LogsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const role = this.reflector.get<string>('role', context.getHandler());

    if (role !== LOG_ROLE_NAME) {
      return Promise.resolve(true);
    }

    const request = context.switchToHttp().getRequest();

    try {
      await this.logsService.findOne(request.params.akey, request.params.id);
    } catch (error) {
      if (error instanceof LogNotExistsException) {
        throw new NotFoundException(error.message);
      }

      return Promise.reject();
    }

    return Promise.resolve(true);
  }
}
