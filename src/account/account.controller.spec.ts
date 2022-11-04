import { NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { AccountController } from './account.controller';
import { AccountModule } from './account.module';
import { AKEY_LENGTH } from './dto/account.dto';
import { AvailableAKeyDto } from './dto/available-akey.dto';
import { ChangePasswordDto } from './dto/change-password-dto';
import { ChangeTokenDto } from './dto/change-token.dto';
import { LoginPasswordDto } from './dto/login-password.dto';

describe('AccountController', () => {
  let controller: AccountController;
  let randomAkey;

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
});
