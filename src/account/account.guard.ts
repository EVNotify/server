import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GUEST_ROLE_NAME } from './decorators/guest.decorator';
import { AccountDto, AKEY_LENGTH, TOKEN_LENGTH } from './dto/account.dto';
import { AuthorizationException } from './exceptions/authorization.exception';
import { Account } from './schemas/account.schema';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  extractAuth(request): AccountDto | null {
    try {
      const authParts = request.headers.authorization.split(' ');
      const account = new Account();

      account.akey = authParts[0];
      account.token = authParts[1];

      if (
        account.akey.length !== AKEY_LENGTH ||
        account.token.length !== TOKEN_LENGTH
      ) {
        throw new AuthorizationException();
      }

      return new AccountDto(account);
    } catch (error) {
      if (error instanceof AuthorizationException) {
        throw new BadRequestException(error.message);
      }

      throw new UnauthorizedException();
    }
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const role = this.reflector.get<string>('role', context.getHandler());

    if (role === GUEST_ROLE_NAME) {
      return Promise.resolve(true);
    }

    const request = context.switchToHttp().getRequest();
    const account = this.extractAuth(request);

    // TODO validate
    console.log(account);
    return;
  }
}
