import { createMock } from '@golevelup/ts-jest';
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { AuthGuard } from './account.guard';
import { AccountModule } from './account.module';
import { AccountService } from './account.service';
import { AccountDto } from './dto/account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountNotExistsException } from './exceptions/account-not-exists.exception';
import { AuthenticationException } from './exceptions/authentication.exception';
import { AuthorizationException } from './exceptions/authorization.exception';

describe('AccountGuard', () => {
  let accountGuard: AuthGuard;
  let accountService: AccountService;
  let testAccount: AccountDto;

  async function createAccount() {
    const dto = new CreateAccountDto();

    dto.akey = accountService.akey();
    dto.password = 'password';

    testAccount = await accountService.create(dto);
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AccountModule,
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.DATABASE_URI),
      ],
    }).compile();

    accountGuard = module.get<AuthGuard>(AuthGuard);
    accountService = module.get<AccountService>(AccountService);

    if (!testAccount) {
      await createAccount();
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should be defined', () => {
    expect(accountGuard).toBeDefined();
  });

  it('should not be able to proceed without authorization header', async () => {
    const mockContext = createMock<ExecutionContext>();

    await expect(async () => {
      await accountGuard.canActivate(mockContext);
    }).rejects.toThrow(UnauthorizedException);
  });

  it('should not be able to proceed with invalid authorization header', async () => {
    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'invalid header',
          },
        }),
      }),
    });

    const result = await expect(async () => {
      await accountGuard.canActivate(mockContext);
    }).rejects;

    result.toThrow(BadRequestException);
    result.toThrowError(new AuthorizationException().message);
  });

  it('should not be able to proceed with missing akey param', async () => {
    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: testAccount.akey + ' ' + testAccount.token,
          },
        }),
      }),
    });

    const result = await expect(async () => {
      await accountGuard.canActivate(mockContext);
    }).rejects;

    result.toThrow(ForbiddenException);
  });

  it('should not be able to proceed with wrong token', async () => {
    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          params: {
            akey: testAccount.akey,
          },
          headers: {
            authorization:
              testAccount.akey +
              ' ' +
              testAccount.token.split('').reverse().join(''),
          },
        }),
      }),
    });

    const result = await expect(async () => {
      await accountGuard.canActivate(mockContext);
    }).rejects;

    result.toThrow(UnauthorizedException);
    result.toThrowError(new AuthenticationException().message);
  });

  it('should not be able to proceed with non-existing user', async () => {
    const nonExistingAKey = accountService.akey();

    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          params: {
            akey: nonExistingAKey,
          },
          headers: {
            authorization:
              nonExistingAKey +
              ' ' +
              testAccount.token.split('').reverse().join(''),
          },
        }),
      }),
    });

    const result = await expect(async () => {
      await accountGuard.canActivate(mockContext);
    }).rejects;

    result.toThrow(UnauthorizedException);
    result.toThrowError(new AccountNotExistsException().message);
  });

  it('should be able to proceed with correct authorization header', async () => {
    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          params: {
            akey: testAccount.akey,
          },
          headers: {
            authorization: testAccount.akey + ' ' + testAccount.token,
          },
        }),
      }),
    });

    expect(await accountGuard.canActivate(mockContext)).toBeTruthy();
  });
});
