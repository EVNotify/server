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
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SyncDto } from './dto/sync.dto';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UpdateLogDto } from './dto/update-log.dto';

describe('LogsController', () => {
  let accountService: AccountService;
  let controller: LogsController;
  let testAccount: AccountDto;
  let logId: string;

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
        EventEmitterModule.forRoot(),
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

  it('should not be able to sync data without any valid key', async () => {
    const dto = new SyncDto();

    await expect(async () => {
      await controller.syncData(testAccount.akey, dto);
    }).rejects.toThrow(BadRequestException);
  });

  it('should be able to sync data', async () => {
    const dto = new SyncDto();

    dto.socDisplay = 80;

    const response = await controller.syncData(testAccount.akey, dto);

    expect(response).toBeUndefined();
  });

  jest.setTimeout(30000);
  it('shoud be able to retrieve log in list', async () => {
    await new Promise((r) => setTimeout(r, 5000));
    const response = await controller.findAll(testAccount.akey);

    expect(response).toHaveLength(1);
    expect(response[0]).toBeInstanceOf(LogDto);
    // FIXME event emitter handling not working in tests?
    // expect(response[0]).toHaveProperty('startSOC', 80);
    logId = response[0].id;
  });

  it('should be able to retrieve it', async () => {
    const response = await controller.findOne(testAccount.akey, logId);

    expect(response).toBeInstanceOf(LogDto);
    expect(response).not.toHaveProperty('history');
  });

  it('should be able to retrieve log history', async () => {
    const response = await controller.findOneWithHistory(
      testAccount.akey,
      logId,
    );

    expect(response).toHaveLength(1);
    expect(response[0]).toHaveProperty('socDisplay', 80);
  });

  it('should be able to update log', async () => {
    const dto = new UpdateLogDto();

    dto.title = 'My title';

    const response = await controller.update(testAccount.akey, logId, dto);

    expect(response).toBeInstanceOf(LogDto);
    expect(response).toHaveProperty('title', 'My title');
  });

  it('should contain new title', async () => {
    const response = await controller.findOne(testAccount.akey, logId);

    expect(response).toHaveProperty('title', 'My title');
  });

  it('should be able to delete log', async () => {
    const response = await controller.remove(testAccount.akey, logId);

    expect(response).toBeUndefined();
  });

  it('should no longer be available', async () => {
    await expect(async () => {
      await controller.findOne(testAccount.akey, logId);
    }).rejects.toThrow(NotFoundException);
  });

  test.todo('should sync and create a new log');

  test.todo('should sync data again');

  test.todo('should contain two history records');

  test.todo('should create a new log once charging started');

  test.todo('should contain two logs');

  test.todo('should contain metadata');

  test.todo('should update metadata when adding new data');
});
