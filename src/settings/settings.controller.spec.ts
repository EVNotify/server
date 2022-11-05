import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { AccountService } from '../account/account.service';
import { AccountDto } from '../account/dto/account.dto';
import { CreateAccountDto } from '../account/dto/create-account.dto';
import { SettingDto } from './dto/setting.dto';
import { SOC_THRESHOLD_DEFAULT } from './entities/setting.entity';
import { SettingsController } from './settings.controller';
import { SettingsModule } from './settings.module';

describe('SettingsController', () => {
  let controller: SettingsController;
  let accountService: AccountService;
  let testAccount: AccountDto;
  let settings: SettingDto;

  // FIXME maybe outsource this for tests?
  async function createAccount() {
    const dto = new CreateAccountDto();

    dto.akey = accountService.akey();
    dto.password = 'password';

    testAccount = await accountService.create(dto);
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SettingsModule,
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.DATABASE_URI),
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    accountService = module.get<AccountService>(AccountService);

    if (!testAccount) {
      await createAccount();
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should be able to retrieve settings on first time', async () => {
    const response = await controller.findOne(testAccount.akey);

    expect(response).toBeInstanceOf(SettingDto);
    expect(response).toHaveProperty('socThreshold', SOC_THRESHOLD_DEFAULT);
    settings = response;
  });

  it('should be able to retrieve settings again', async () => {
    const response = await controller.findOne(testAccount.akey);

    expect(response).toStrictEqual(settings);
  });

  it('should be able to retrieve specific setting', async () => {
    const response = await controller.findOneSetting(
      testAccount.akey,
      'socThreshold',
    );

    expect(response).toHaveProperty('socThreshold', SOC_THRESHOLD_DEFAULT);
  });

  it('should be able to set new setting', async () => {
    settings.capacity = 12;

    const response = await controller.update(testAccount.akey, settings);

    expect(response).toBeInstanceOf(SettingDto);
    expect(response).toHaveProperty('capacity', 12);
  });

  it('should contain new settings', async () => {
    const response = await controller.findOne(testAccount.akey);

    expect(response).toHaveProperty('capacity', 12);
  });

  it('should be able to update existing setting', async () => {
    settings.socThreshold = 80;

    const response = await controller.update(testAccount.akey, settings);

    expect(response).toBeInstanceOf(SettingDto);
    expect(response).toHaveProperty('socThreshold', 80);
  });

  it('should be able to retrieve updated setting', async () => {
    const response = await controller.findOneSetting(
      testAccount.akey,
      'socThreshold',
    );

    expect(response).toHaveProperty('socThreshold', 80);
  });
});
