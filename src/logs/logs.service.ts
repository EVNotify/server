import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LastSyncDto } from './dto/last-sync.dto';
import { LogDto } from './dto/log.dto';
import { SyncDto } from './dto/sync.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import {
  LOG_DATA_SYNCED_EVENT,
  LOG_FINISHED_EVENT,
  LOG_OUTDATED_SECONDS_TIMEOUT,
} from './entities/log.entity';
import { STATUS } from './entities/status.entity';
import { LogMissingSyncDataException } from './exceptions/log-missing-sync-data.exception';
import { LogNotExistsException } from './exceptions/log-not-exists.exception';
import { LastSync } from './schemas/last-sync.schema';
import { Log } from './schemas/log.schema';
import { Sync } from './schemas/sync.schema';
import { TYPE } from './entities/type.entity';
import { LogNotRunningException } from './exceptions/log-not-running.exception';
import { HISTORY_TYPE } from './entities/history-type.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(Log.name) private logModel: Model<Log>,
    @InjectModel(LastSync.name) private lastSyncModel: Model<LastSync>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private removeUnsetSyncFields(sync: Sync): Sync {
    for (const field in sync) {
      if (sync[field] == null) {
        delete sync[field];
      }
    }

    return sync;
  }

  private async currentLog(akey: string, syncDto: SyncDto): Promise<Log> {
    const log = await this.logModel.findOne(
      {
        akey,
        status: STATUS.RUNNING,
        updatedAt: {
          $gt: new Date(
            new Date().getTime() - LOG_OUTDATED_SECONDS_TIMEOUT * 1000,
          ),
        },
      },
      null,
      { sort: { startDate: 'desc' } },
    );

    if (!log) {
      return await this.logModel.create({ akey });
    } else {
      if (syncDto.charging != null && log.type == TYPE.UNKNOWN) {
        log.type = syncDto.charging ? TYPE.CHARGE : TYPE.DRIVE;
        await log.save();
      } else if (syncDto.charging && log.type != TYPE.CHARGE || syncDto.charging == false && log.type != TYPE.DRIVE) {
        log.status = STATUS.FINISHED;
        await log.save();
        this.eventEmitter.emit(LOG_FINISHED_EVENT, log);

        return await this.logModel.create({ akey });
      }
    }

    return log;
  }

  async lastSync(akey: string): Promise<LastSyncDto> {
    const lastSync = await this.lastSyncModel.findOne({ akey });

    return new LastSyncDto(lastSync);
  }

  async findRunning(akey: string): Promise<LogDto> {
    const log = await this.logModel
      .findOne({ akey, status: STATUS.RUNNING })
      .select('-history');

    if (!log) {
      throw new LogNotRunningException();
    }

    return Promise.resolve(new LogDto(log));
  }

  async findLogsWithinDateRange(akey: string, start: Date, end: Date): Promise<Log[]> {
    const query = {
      akey,
      startDate: { $gte: start },
      $and: [
        {
          $or: [
            { endDate: { $lte: end } },
            { endDate: null, status: STATUS.RUNNING },
          ]
        }
      ]
    };

    return this.logModel.find(query).select('-history').sort({startDate: 'desc'});
  }

  async findAll(akey: string, type?: TYPE): Promise<LogDto[]> {
    const logs = this.logModel
      .find({ akey })
      .select('-history')
      .sort({startDate: 'desc'});

    if (type != null) {
      logs.where({ type });
    }

    return Promise.resolve((await logs).map((log) => new LogDto(log)));
  }

  async findOne(akey: string, id: string): Promise<LogDto> {
    const log = await this.logModel
      .findOne({ akey, _id: id })
      .select('-history');

    if (!log) {
      throw new LogNotExistsException();
    }

    return Promise.resolve(new LogDto(log));
  }

  async findOneWithHistory(akey: string, id: string, type: HISTORY_TYPE = HISTORY_TYPE.ALL): Promise<Sync[]> {
    let history = [];

    switch (type) {
      case HISTORY_TYPE.ALL:
        const logWithAllHistory = await this.logModel
          .findOne({ akey, _id: id })
          .select('history');

        if (!logWithAllHistory) {
          throw new LogNotExistsException();
        }

        history = logWithAllHistory.history;
        break;
      case HISTORY_TYPE.LOCATION_DATA:
        const logWithLocationHistory = await this.logModel.aggregate([
          {
            $match: { akey, _id: new Types.ObjectId(id) }
          },
          {
            $project: {
              _id: 0,
              history: {
                $filter: {
                  input: '$history',
                  as: 'entry',
                  cond: {
                    $and: [
                      { $in: [{ $type: '$$entry.latitude' }, ['double', 'int', 'long']] },
                      { $in: [{ $type: '$$entry.longitude' }, ['double', 'int', 'long']] },
                    ],
                  },
                },
              },
            }
          }
        ]);

        history = logWithLocationHistory.map((entry) => entry.history)[0];
        break;
      case HISTORY_TYPE.BATTERY_DATA:
        const logWithBatteryHistory = await this.logModel.aggregate([
          {
            $match: { akey, _id: new Types.ObjectId(id) }
          },
          {
            $project: {
              _id: 0,
              history: {
                $filter: {
                  input: '$history',
                  as: 'entry',
                  cond: {
                    $or: [
                      { $in: [{ $type: '$$entry.socDisplay' }, ['double', 'int', 'long']] },
                      { $in: [{ $type: '$$entry.socBMS' }, ['double', 'int', 'long']] },
                      { $in: [{ $type: '$$entry.dcBatteryPower' }, ['double', 'int', 'long']] },
                    ],
                  },
                },
              },
            }
          }
        ]);

        history = logWithBatteryHistory.map((entry) => entry.history)[0];
        break;
      default:
        break;
    }

    return history;
  }

  async update(
    akey: string,
    id: string,
    updateLogDto: UpdateLogDto,
  ): Promise<LogDto> {
    const log = await this.logModel.findOneAndUpdate(
      {
        akey,
        _id: id,
      },
      updateLogDto,
      {
        new: true,
      },
    );

    return Promise.resolve(new LogDto(log));
  }

  async syncData(akey: string, syncDto: SyncDto): Promise<void> {
    let sync = new Sync(syncDto);

    sync = this.removeUnsetSyncFields(sync);

    if (!Object.keys(sync).length) {
      throw new LogMissingSyncDataException();
    }

    sync.timestamp = syncDto.timestamp || new Date().toISOString();

    const log = await this.currentLog(akey, syncDto);

    await this.logModel.updateOne(
      {
        akey,
        _id: log._id,
      },
      {
        $push: {
          history: sync,
        },
      },
    );

    this.eventEmitter.emit(LOG_DATA_SYNCED_EVENT, { log, sync });

    return Promise.resolve();
  }

  async remove(akey: string, id: string): Promise<void> {
    await this.logModel.deleteOne({
      akey,
      _id: id,
    });

    return Promise.resolve();
  }
}
