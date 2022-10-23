import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  LOG_FINISHED_EVENT,
  LOG_OUTDATED_SECONDS_TIMEOUT,
} from '../entities/log.entity';
import { STATUS } from '../entities/status.entity';
import { Log } from '../schemas/log.schema';

@Injectable()
export class CronHandler {
  constructor(
    @InjectModel(Log.name) private logModel: Model<Log>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron() {
    const oldLogs = await this.logModel.find({
      status: STATUS.RUNNING,
      updatedAt: {
        $lte: new Date(
          new Date().getTime() - LOG_OUTDATED_SECONDS_TIMEOUT * 1000,
        ),
      },
    });

    for (const log in oldLogs) {
      if (Object.prototype.hasOwnProperty.call(oldLogs, log)) {
        const oldLog = oldLogs[log];

        oldLog.status = STATUS.FINISHED;
        await oldLog.save();
        this.eventEmitter.emit(LOG_FINISHED_EVENT, oldLog);
      }
    }
  }
}
