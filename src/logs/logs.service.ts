import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogDto } from './dto/log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { Log } from './schemas/log.schema';

@Injectable()
export class LogsService {
  constructor(@InjectModel(Log.name) private logModel: Model<Log>) {}

  async findAll(akey: string): Promise<LogDto[]> {
    await this.logModel.create({ akey });
    const logs = await this.logModel.find({ akey });

    return Promise.resolve(logs.map((log) => new LogDto(log)));
  }

  async findOne(akey: string, id: string) {
    const log = await this.logModel.findOne({ akey, _id: id });

    // TODO check if exists?
    return Promise.resolve(new LogDto(log));
  }

  update(id: number, updateLogDto: UpdateLogDto) {
    return `This action updates a #${id} log`;
  }

  syncData() {}

  remove(id: number) {
    return `This action removes a #${id} log`;
  }
}
