import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogDto } from '../dto/log.dto';
import {
  LOG_DATA_SYNCED_EVENT,
  LOG_FINISHED_EVENT,
} from '../entities/log.entity';
import { STATUS } from '../entities/status.entity';
import { Log } from '../schemas/log.schema';
import { Sync } from '../schemas/sync.schema';

@Injectable()
export class MetadataHandler {
  constructor(@InjectModel(Log.name) private logModel: Model<Log>, private emitter: EventEmitter2) {
    emitter.on(LOG_DATA_SYNCED_EVENT, (payload) => this.handleSyncEvent(payload));
  }

  private setOneTimeMetadata(log: Log, sync: Sync) {
    if (log.status != STATUS.RUNNING) {
      return;
    }

    if (
      log.startSOC == null &&
      (sync.socDisplay != null || sync.socBMS != null)
    ) {
      // FIXME determine later switch to display, if bms was first?
      log.startSOC = sync.socDisplay || sync.socBMS;
    }

    const mapping = {
      isCharge: 'charging',
      startODO: 'odo',
      startCEC: 'cec',
      startCED: 'ced',
    };

    for (const logField in mapping) {
      if (Object.prototype.hasOwnProperty.call(mapping, logField)) {
        const syncField = mapping[logField];

        if (log[logField] == null && sync[syncField] != null) {
          log[logField] = sync[syncField];
        }
      }
    }
  }

  private setSummarizedMetadata(log: Log, sync: Sync) {
    const summarizableFields = [
      'dcBatteryPower',
      'speed',
      'latitude',
      'longitude',
    ];

    if (
      !Object.keys(sync).some((field) => summarizableFields.includes(field))
    ) {
      return;
    }

    const averageKWs = [];
    const averageSpeeds = [];
    const distances = []; // also support ODO?

    log.history.forEach((entry) => {
      if (entry.dcBatteryPower != null) {
        averageKWs.push(entry.dcBatteryPower);
      } else if (entry.speed != null) {
        averageSpeeds.push(entry.speed);
      } else if (entry.latitude != null && entry.longitude != null) {
        distances.push({
          latitude: entry.latitude,
          longitude: entry.longitude,
        });
      }
    });

    if (sync.dcBatteryPower != null) {
      log.averageKW =
        averageKWs.reduce((a, b) => a + b, sync.dcBatteryPower) /
        (averageKWs.length + 1);
    }

    if (sync.speed != null) {
      log.averageSpeed =
        averageSpeeds.reduce((a, b) => a + b, sync.speed) /
        (averageSpeeds.length + 1);
    }
    // TODO calculate distance
  }

  private async setEndMetadata(log: Log) {
    log.endDate = new Date();

    let endSOC;
    let endODO;
    let endCEC;
    let endCED;

    log.history.forEach((sync) => {
      if (sync.socDisplay != null || sync.socBMS != null) {
        endSOC = sync.socDisplay || sync.socBMS;
      }

      if (sync.odo != null) {
        endODO = sync.odo;
      }

      if (sync.cec != null) {
        endCEC = sync.cec;
      }

      if (sync.ced != null) {
        endCED = sync.ced;
      }
    });

    log.endSOC = endSOC;
    log.endODO = endODO;
    log.endCEC = endCEC;
    log.endCED = endCED;
  }

  private async saveMetadata(log: Log) {
    const dto = new LogDto(log);

    await this.logModel.updateOne(
      {
        akey: log.akey,
        _id: log._id,
      },
      dto,
    );
  }

  async handleSyncEvent(payload: { log: Log; sync: Sync }) {
    this.setOneTimeMetadata(payload.log, payload.sync);
    this.setSummarizedMetadata(payload.log, payload.sync);
    this.saveMetadata(payload.log);
  }

  @OnEvent(LOG_FINISHED_EVENT)
  async handleFinishedEvent(log: Log) {
    this.setEndMetadata(log);
    this.saveMetadata(log);
  }
}
