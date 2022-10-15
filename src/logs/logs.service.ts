import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogDto } from './dto/log.dto';
import { SyncDto } from './dto/sync.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { LOG_OUTDATED_SECONDS_TIMEOUT } from './entities/log.entity';
import { STATUS } from './entities/status.entity';
import { LogNotExistsException } from './exceptions/log-not-exists.exception';
import { Log } from './schemas/log.schema';
import { Sync } from './schemas/sync.schema';

@Injectable()
export class LogsService {
  constructor(@InjectModel(Log.name) private logModel: Model<Log>) {}

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
      if (syncDto.charging != null && syncDto.charging !== log.isCharge) {
        log.status = STATUS.FINISHED;
        await log.save();
        return await this.logModel.create({ akey });
      }
    }

    return log;
  }

  async findAll(akey: string): Promise<LogDto[]> {
    const logs = await this.logModel.find({ akey });

    return Promise.resolve(logs.map((log) => new LogDto(log)));
  }

  async findOne(akey: string, id: string): Promise<LogDto> {
    const log = await this.logModel.findOne({ akey, _id: id });

    if (!log) {
      throw new LogNotExistsException();
    }

    return Promise.resolve(new LogDto(log));
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

  async syncData(akey: string, syncDto: SyncDto) {
    let sync = new Sync(syncDto);

    sync = this.removeUnsetSyncFields(sync);

    const log = await this.currentLog(akey, syncDto);

    // update metadata

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
  }

  async remove(akey: string, id: string): Promise<void> {
    await this.logModel.deleteOne({
      akey,
      _id: id,
    });

    return Promise.resolve();
  }
}
