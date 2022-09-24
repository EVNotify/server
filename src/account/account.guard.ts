import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountService } from './account.service';
import { GUEST_ROLE_NAME } from './decorators/guest.decorator';
import { AccountDto, AKEY_LENGTH, TOKEN_LENGTH } from './dto/account.dto';
import { LoginTokenDto } from './dto/login-token.dto';
import { AuthenticationException } from './exceptions/authentication.exception';
import { AuthorizationException } from './exceptions/authorization.exception';
import { Account } from './schemas/account.schema';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly accountService: AccountService,
  ) {}

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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const role = this.reflector.get<string>('role', context.getHandler());

    if (role === GUEST_ROLE_NAME) {
      return Promise.resolve(true);
    }

    const request = context.switchToHttp().getRequest();
    const account = this.extractAuth(request);
    const dto = new LoginTokenDto();

    dto.token = account.token;

    try {
      await this.accountService.loginWithToken(account.akey, dto);

      return Promise.resolve(true);
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof AuthenticationException ? error.message : null,
      );
    }
  }
}
