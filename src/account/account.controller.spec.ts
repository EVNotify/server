import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { AccountController } from './account.controller';
import { AccountModule } from './account.module';
import { AccountDto, AKEY_LENGTH, TOKEN_LENGTH } from './dto/account.dto';
import { AvailableAKeyDto } from './dto/available-akey.dto';
import { ChangePasswordDto } from './dto/change-password-dto';
import { ChangeTokenDto } from './dto/change-token.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { LoginPasswordDto } from './dto/login-password.dto';

describe('AccountController', () => {
  let controller: AccountController;
  let randomAkey;
  let token;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AccountModule,
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.DATABASE_URI),
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should generate a random available akey', async () => {
    const response = await controller.availableAKey();

    expect(response).toBeInstanceOf(AvailableAKeyDto);
    expect(response.akey).toHaveLength(AKEY_LENGTH);
    randomAkey = response.akey;
  });

  it('should not be the same on new call', async () => {
    const response = await controller.availableAKey();

    expect(response.akey).not.toEqual(randomAkey);
  });

  it('should not be already taken', async () => {
    await expect(async () => {
      await controller.findOne(randomAkey);
    }).rejects.toThrow(NotFoundException);
  });

  it('non existent user should not be able to login', async () => {
    const dto = new LoginPasswordDto();

    dto.password = 'password';

    await expect(async () => {
      await controller.login(randomAkey, dto);
    }).rejects.toThrow(NotFoundException);
  });

  it('non existent user should not be able to change password', async () => {
    const dto = new ChangePasswordDto();

    dto.password = 'password';
    dto.newPassword = 'newPassword';

    await expect(async () => {
      await controller.changePassword(randomAkey, dto);
    }).rejects.toThrow(NotFoundException);
  });

  it('non existent user should not be able to change token', async () => {
    const dto = new ChangeTokenDto();

    dto.password = 'password';

    await expect(async () => {
      await controller.changeToken(randomAkey, dto);
    }).rejects.toThrow(NotFoundException);
  });

  it('should not create account with missing data', async () => {
    await expect(async () => {
      await controller.create(new CreateAccountDto());
    }).rejects.toThrow(InternalServerErrorException);
  });

  it('should create account and return token', async () => {
    const dto = new CreateAccountDto();

    dto.akey = randomAkey;
    dto.password = 'password';

    const response = await controller.create(dto);

    expect(response).toBeInstanceOf(AccountDto);
    expect(response.akey).toStrictEqual(randomAkey);
    expect(response).not.toHaveProperty('password');
    expect(response.token).toHaveLength(TOKEN_LENGTH);

    token = response.token;
  });

  it('should not be able to create same account again', async () => {
    const dto = new CreateAccountDto();

    dto.akey = randomAkey;
    dto.password = 'password';

    await expect(async () => {
      await controller.create(dto);
    }).rejects.toThrow(ConflictException);
  });

  it('should not be able to login with wrong credentials', async () => {
    const dto = new LoginPasswordDto();

    dto.password = 'wrongPassword';

    await expect(async () => {
      await controller.login(randomAkey, dto);
    }).rejects.toThrow(UnauthorizedException);
  });

  it('should be able to login', async () => {
    const dto = new LoginPasswordDto();

    dto.password = 'password';

    const response = await controller.login(randomAkey, dto);

    expect(response).toBeInstanceOf(AccountDto);
  });

  it('should be able to retrieve account info', async () => {
    const response = await controller.findOne(randomAkey);

    expect(response).toBeInstanceOf(AccountDto);
    expect(response.akey).toStrictEqual(randomAkey);
    expect(response).not.toHaveProperty('password');
    expect(response.token).toHaveLength(TOKEN_LENGTH);
    expect(response.token).toStrictEqual(token);
  });

  it('should not be able to change password when not applying new password', async () => {
    const dto = new ChangePasswordDto();

    dto.password = 'password';
    dto.newPassword = 'password';

    await expect(async () => {
      await controller.changePassword(randomAkey, dto);
    }).rejects.toThrow(BadRequestException);
  });

  it('should be able to change password', async () => {
    const dto = new ChangePasswordDto();

    dto.password = 'password';
    dto.newPassword = 'newPassword';

    const response = await controller.changePassword(randomAkey, dto);

    expect(response).toBeInstanceOf(AccountDto);
  });

  it('should not be able to login with old password', async () => {
    const dto = new LoginPasswordDto();

    dto.password = 'password';

    await expect(async () => {
      await controller.login(randomAkey, dto);
    }).rejects.toThrow(UnauthorizedException);
  });

  it('should be able to login with new password', async () => {
    const dto = new LoginPasswordDto();

    dto.password = 'newPassword';

    const response = await controller.login(randomAkey, dto);

    expect(response).toBeInstanceOf(AccountDto);
  });

  it('should not be able to change token with wrong password', async () => {
    const dto = new ChangeTokenDto();

    dto.password = 'wrongPassword';

    await expect(async () => {
      await controller.changeToken(randomAkey, dto);
    }).rejects.toThrow(UnauthorizedException);
  });

  it('should be able to change token', async () => {
    const dto = new ChangeTokenDto();

    dto.password = 'newPassword';

    const response = await controller.changeToken(randomAkey, dto);

    expect(response).toBeInstanceOf(AccountDto);
    expect(response.token).not.toEqual(token);

    token = response.token;
  });

  it('should contain changed token', async () => {
    const response = await controller.findOne(randomAkey);

    expect(response).toBeInstanceOf(AccountDto);
    expect(response.token).toStrictEqual(token);
  });
});
