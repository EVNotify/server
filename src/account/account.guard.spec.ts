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
import { AuthGuard } from './account.guard';
import { AccountModule } from './account.module';
import { AccountService } from './account.service';
import { AccountDto } from './dto/account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountNotExistsException } from './exceptions/account-not-exists.exception';
import { AuthenticationException } from './exceptions/authentication.exception';
import { AuthorizationException } from './exceptions/authorization.exception';

describe('AccountGuard', () => {
  let module: TestingModule;
  let accountGuard: AuthGuard;
  let accountService: AccountService;
  let testAccount: AccountDto;

  async function createAccount() {
    const dto = new CreateAccountDto();

    dto.akey = accountService.akey();
    dto.password = 'password';

    testAccount = await accountService.create(dto);
  }

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        AccountModule,
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.DATABASE_URI),
      ],
    }).compile();

    accountGuard = module.get<AuthGuard>(AuthGuard);
    accountService = module.get<AccountService>(AccountService);

    await createAccount();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await module?.close();
  });

  it('should be defined', () => {
    expect(accountGuard).toBeDefined();
  });

  it('should not be able to proceed without authorization header', async () => {
    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    });

    await expect(accountGuard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
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

    const result = accountGuard.canActivate(mockContext);

    await expect(result).rejects.toThrow(BadRequestException);
    await expect(result).rejects.toThrow(new AuthorizationException().message);
  });

  it('should not be able to proceed with missing akey param', async () => {
    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          params: {},
          headers: {
            authorization: testAccount.akey + ' ' + testAccount.token,
          },
        }),
      }),
    });

    await expect(accountGuard.canActivate(mockContext)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should not be able to proceed with wrong token', async () => {
    const wrongToken =
      (testAccount.token[0] === '0' ? '1' : '0') + testAccount.token.slice(1);
    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          params: {
            akey: testAccount.akey,
          },
          headers: {
            authorization: testAccount.akey + ' ' + wrongToken,
          },
        }),
      }),
    });

    const result = accountGuard.canActivate(mockContext);

    await expect(result).rejects.toThrow(UnauthorizedException);
    await expect(result).rejects.toMatchObject({
      status: 401,
      message: new AuthenticationException().message,
    });
  });

  it('should not be able to proceed with non-existing user', async () => {
    let nonExistingAKey = accountService.akey();

    while (await accountService.findOne(nonExistingAKey)) {
      nonExistingAKey = accountService.akey();
    }

    const mockContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({
          params: {
            akey: nonExistingAKey,
          },
          headers: {
            authorization: nonExistingAKey + ' ' + testAccount.token,
          },
        }),
      }),
    });

    const result = accountGuard.canActivate(mockContext);

    await expect(result).rejects.toThrow(UnauthorizedException);
    await expect(result).rejects.toMatchObject({
      status: 401,
      message: new AccountNotExistsException().message,
    });
  });

  it('should return generic Unauthorized for unexpected service errors', async () => {
    jest
      .spyOn(accountService, 'loginWithToken')
      .mockRejectedValueOnce(new Error('Database connection failed'));

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

    const result = accountGuard.canActivate(mockContext);

    await expect(result).rejects.toThrow(UnauthorizedException);
    await expect(result).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized',
    });
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
