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
import { STATUS } from './entities/status.entity';

describe('LogsController', () => {
  let accountService: AccountService;
  let controller: LogsController;
  let testAccount: AccountDto;
  let logId: string;
  let chargeLogId: string;

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

  it('should be able to retrieve log in list', async () => {
    const response = await controller.findAll(testAccount.akey);

    expect(response).toHaveLength(1);
    expect(response[0]).toBeInstanceOf(LogDto);
    expect(response[0]).toHaveProperty('startSOC', 80);
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
    expect(response[0]).toHaveProperty('timestamp');
  });

  it('should be able to sync data with a timestamp', async () => {
    const dto = new SyncDto();

    dto.socDisplay = 80;
    dto.timestamp = '2022-11-06T22:15:58.238Z';

    const response = await controller.syncData(testAccount.akey, dto);

    expect(response).toBeUndefined();
  });

  it('should be able to retrieve log history with timestamp', async () => {
    const response = await controller.findOneWithHistory(
      testAccount.akey,
      logId,
    );

    expect(response).toHaveLength(2);
    expect(response.at(1)).toHaveProperty('socDisplay', 80);
    expect(response.at(1)).toHaveProperty(
      'timestamp',
      '2022-11-06T22:15:58.238Z',
    );
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

  it('should sync and create a new log', async () => {
    const dto = new SyncDto();

    dto.socDisplay = 80;

    await controller.syncData(testAccount.akey, dto);

    const response = await controller.findAll(testAccount.akey);

    expect(response).toHaveLength(1);

    logId = response[0].id;
  });

  it('should sync data again', async () => {
    const dto = new SyncDto();

    dto.socDisplay = 81;

    await controller.syncData(testAccount.akey, dto);
  });

  it('should contain two history records', async () => {
    const response = await controller.findOneWithHistory(
      testAccount.akey,
      logId,
    );

    expect(response).toHaveLength(2);
    expect(response.at(0)).toHaveProperty('socDisplay', 80);
    expect(response.at(1)).toHaveProperty('socDisplay', 81);
  });

  it('should create a new log once charging started', async () => {
    const dto = new SyncDto();

    dto.charging = true;
    dto.socDisplay = 75;
    dto.dcBatteryPower = 10;

    await controller.syncData(testAccount.akey, dto);

    const response = await controller.findAll(testAccount.akey);

    expect(response).toHaveLength(2);
    chargeLogId = response[1].id;
  });

  it('should mark previous log as finished', async () => {
    const response = await controller.findOne(testAccount.akey, logId);

    expect(response).toBeInstanceOf(LogDto);
    expect(response).toHaveProperty('status', STATUS.FINISHED);
  });

  it('should contain metadata', async () => {
    const response = await controller.findOne(testAccount.akey, chargeLogId);

    expect(response).toBeInstanceOf(LogDto);
    expect(response).toHaveProperty('isCharge', true);
    expect(response).toHaveProperty('startSOC', 75);
    expect(response).toHaveProperty('averageKW', 10);
  });

  it('should update metadata when adding new data', async () => {
    const dto = new SyncDto();

    dto.dcBatteryPower = 2;

    await controller.syncData(testAccount.akey, dto);

    const response = await controller.findOne(testAccount.akey, chargeLogId);

    expect(response).toBeInstanceOf(LogDto);
    expect(response).toHaveProperty('averageKW', 6);
  });
});
