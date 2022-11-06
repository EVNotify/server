import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { AccountService } from '../account/account.service';
import { CreateAccountDto } from '../account/dto/create-account.dto';
import { AccountDto } from '../account/dto/account.dto';
import { LogsController } from './logs.controller';
import { LogsModule } from './logs.module';
import { LogDto } from './dto/log.dto';
import { NotFoundException } from '@nestjs/common';

describe('LogsController', () => {
  let accountService: AccountService;
  let controller: LogsController;
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
        LogsModule,
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.DATABASE_URI),
      ],
    }).compile();

    accountService = module.get<AccountService>(AccountService);
    controller = module.get<LogsController>(LogsController);

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

  it('should not be able to retrieve logs when there are none', async () => {
    const response = await controller.findAll(testAccount.akey);

    expect(response.every((log) => log instanceof LogDto)).toBeTruthy();
    expect(response).toHaveLength(0);
  });

  it('should not have last sync data', async () => {
    const response = await controller.lastSync(testAccount.akey);

    expect(
      Object.values(response).filter((value) => value != null),
    ).toHaveLength(0);
  });

  it('should not be able to retrieve non-existing log', async () => {
    await expect(async () => {
      await controller.findOne(
        testAccount.akey,
        new mongoose.Types.ObjectId().toString(),
      );
    }).rejects.toThrow(NotFoundException);
  });

  it('should not be able to retrieve history of non-existing log', async () => {
    await expect(async () => {
      await controller.findOneWithHistory(
        testAccount.akey,
        new mongoose.Types.ObjectId().toString(),
      );
    }).rejects.toThrow(NotFoundException);
  });

  test.todo('should not be able to sync data without any valid key');

  test.todo('should be able to sync data');

  test.todo('should create a new log and be able to retrieve it');

  test.todo('shoud be able to retrieve log in list');

  test.todo('should be able to retrieve log history');

  test.todo('should be able to update log');

  test.todo('should be able to delete log');

  test.todo('should no longer be available');

  test.todo('should sync and create a new log');

  test.todo('should sync data again');

  test.todo('should contain two history records');

  test.todo('should create a new log once charging started');

  test.todo('should contain two logs');

  test.todo('should contain metadata');

  test.todo('should update metadata when adding new data');
});
