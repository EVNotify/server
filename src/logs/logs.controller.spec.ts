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
import { LastSyncDto } from './dto/last-sync.dto';
import { TYPE } from './entities/type.entity';
import { HISTORY_TYPE } from './entities/history-type.entity';

describe('LogsController', () => {
  let accountService: AccountService;
  let controller: LogsController;
  let testAccount: AccountDto;
  let logId: string;
  let chargeLogId: string;
  let syncTimestamp: Date;

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
    const timer = setTimeout(async () => await mongoose.disconnect(), 1000);

    timer.unref();
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
    expect(response[0]).toHaveProperty('currentSOC', 80);
    expect(response[0]).toHaveProperty('updatedAt');
    logId = response[0].id;
    syncTimestamp = response[0].updatedAt;
  });

  it('should be able to filter out log in list', async () => {
    const response = await controller.findAll(testAccount.akey, TYPE.DRIVE);

    expect(response).toHaveLength(0);
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

  it('should be able to retrieve last sync data', async () => {
    const response = await controller.lastSync(testAccount.akey);

    expect(response).toBeInstanceOf(LastSyncDto);
    expect(response).toHaveProperty('updatedAt');
    expect(response).toHaveProperty('socDisplay', 80);
    expect(new Date(response.updatedAt).getTime()).toBeGreaterThan(
      syncTimestamp.getTime(),
    );
  });

  it('should be able to sync data with a timestamp', async () => {
    const dto = new SyncDto();

    dto.latitude = 32.123;
    dto.longitude = 34.111;
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
    expect(response.at(1)).toHaveProperty('latitude', 32.123);
    expect(response.at(1)).toHaveProperty('longitude', 34.111);
    expect(response.at(1)).toHaveProperty(
      'timestamp',
      '2022-11-06T22:15:58.238Z',
    );
  });

  it('should be able to retrieve location log history', async () => {
    const response = await controller.findOneWithHistory(
      testAccount.akey,
      logId,
      HISTORY_TYPE.LOCATION_DATA
    );

    expect(response).toHaveLength(1);
    expect(response.at(0)).toHaveProperty('latitude', 32.123);
    expect(response.at(0)).toHaveProperty('longitude', 34.111);
    expect(response.at(0)).toHaveProperty(
      'timestamp',
      '2022-11-06T22:15:58.238Z',
    );
  });

  it('should be able to retrieve battery log history', async () => {
    const response = await controller.findOneWithHistory(
      testAccount.akey,
      logId,
      HISTORY_TYPE.BATTERY_DATA
    );

    expect(response).toHaveLength(1);
    expect(response.at(0)).toHaveProperty('socDisplay', 80);
  });

  it('should be able to retrieve all log history', async () => {
    const response = await controller.findOneWithHistory(
      testAccount.akey,
      logId,
      HISTORY_TYPE.ALL
    );

    expect(response).toHaveLength(2);
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
    expect(response.at(0)).toHaveProperty('type', TYPE.UNKNOWN);

    logId = response[0].id;
  });

  it('should sync data again', async () => {
    const dto = new SyncDto();

    dto.socDisplay = 81;

    await controller.syncData(testAccount.akey, dto);
    syncTimestamp = new Date();
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

  it('should be able to retrieve updated last sync data', async () => {
    const response = await controller.lastSync(testAccount.akey);

    expect(response).toBeInstanceOf(LastSyncDto);
    expect(response).toHaveProperty('updatedAt');
    expect(response).toHaveProperty('socDisplay', 81);
    expect(new Date(response.updatedAt).getTime()).toBeGreaterThan(
      syncTimestamp.getTime(),
    );
  });

  it('should update log type instead of creating new log if unknown', async () => {
    const dto = new SyncDto();

    dto.charging = false;

    await controller.syncData(testAccount.akey, dto);

    const response = await controller.findAll(testAccount.akey);

    expect(response).toHaveLength(1);
    expect(response.at(0)).toHaveProperty('id', logId);
    expect(response.at(0)).toHaveProperty('type', TYPE.DRIVE);
  });

  it('should create a new log once charging started', async () => {
    const dto = new SyncDto();

    dto.charging = true;
    dto.socDisplay = 75;
    dto.dcBatteryPower = 10;

    await controller.syncData(testAccount.akey, dto);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await controller.findAll(testAccount.akey);

    expect(response).toHaveLength(2);
    expect(response.at(0)).toHaveProperty('type', TYPE.CHARGE);
    chargeLogId = response[0].id;
  });

  it('should mark previous log as finished', async () => {
    const response = await controller.findOne(testAccount.akey, logId);

    expect(response).toBeInstanceOf(LogDto);
    expect(response).toHaveProperty('status', STATUS.FINISHED);
    expect(response).toHaveProperty('endSOC', 81);
  });

  it('should contain metadata', async () => {
    const response = await controller.findOne(testAccount.akey, chargeLogId);

    expect(response).toBeInstanceOf(LogDto);
    expect(response).toHaveProperty('type', TYPE.CHARGE);
    expect(response).toHaveProperty('status', STATUS.RUNNING);
    expect(response).toHaveProperty('startSOC', 75);
    expect(response).toHaveProperty('currentSOC', 75);
    expect(response).toHaveProperty('averageKW', 10);
    expect(response).toHaveProperty('rechargedKWh', undefined);
    expect(response).toHaveProperty('dischargedKWh', undefined);
  });

  it('should update metadata when adding new data', async () => {
    const dto = new SyncDto();

    dto.dcBatteryPower = 2;
    dto.cec = 30069.1;
    dto.socDisplay = 77;

    await controller.syncData(testAccount.akey, dto);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await controller.findOne(testAccount.akey, chargeLogId);

    expect(response).toBeInstanceOf(LogDto);
    expect(response).toHaveProperty('averageKW', 6);
    expect(response).toHaveProperty('rechargedKWh', 0);
    expect(response).toHaveProperty('startSOC', 75);
    expect(response).toHaveProperty('currentSOC', 77);
    expect(response).toHaveProperty('dischargedKWh', undefined);
  });

  it('should update rechargedKWh metadata when adding new cec value', async () => {
    const dto = new SyncDto();

    dto.cec = 30069.3;

    await controller.syncData(testAccount.akey, dto);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const response = await controller.findOne(testAccount.akey, chargeLogId);

    expect(response).toBeInstanceOf(LogDto);
    expect(response).toHaveProperty('rechargedKWh', 0.2);
  });

  it('should find current running log', async () => {
    const response = await controller.findRunning(testAccount.akey);

    expect(response).toBeInstanceOf(LogDto);
    expect(response).toHaveProperty('id', chargeLogId);
  });
});
