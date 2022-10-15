import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogDto } from './dto/log.dto';
import { SyncDto } from './dto/sync.dto';
import { UpdateLogDto } from './dto/update-log.dto';
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

  async findAll(akey: string): Promise<LogDto[]> {
    await this.logModel.create({ akey });
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

    // find current open log
    await this.logModel.updateOne(
      {
        akey,
        _id: '634a9a02b769eaa7eb5d8bf5',
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
