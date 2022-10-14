import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogDto } from './dto/log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { LogNotExistsException } from './exceptions/log-not-exists.exception';
import { Log } from './schemas/log.schema';

@Injectable()
export class LogsService {
  constructor(@InjectModel(Log.name) private logModel: Model<Log>) {}

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

  syncData() {}

  async remove(akey: string, id: string): Promise<void> {
    await this.logModel.deleteOne({
      akey,
      _id: id,
    });

    return Promise.resolve();
  }
}
