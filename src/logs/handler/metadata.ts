import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { TYPE } from '../entities/type.entity';

@Injectable()
export class MetadataHandler {
  constructor(
    @InjectModel(Log.name) private logModel: Model<Log>,
    emitter: EventEmitter2,
  ) {
    emitter.on(LOG_DATA_SYNCED_EVENT, (payload: { log: Log; sync: Sync }) =>
      this.handleSyncEvent(payload),
    );
    emitter.on(LOG_FINISHED_EVENT, (log: Log) => this.handleFinishedEvent(log));
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
      type: 'charging',
      startODO: 'odo',
      startCEC: 'cec',
      startCED: 'ced',
    };

    for (const logField in mapping) {
      if (Object.prototype.hasOwnProperty.call(mapping, logField)) {
        const syncField = mapping[logField];
        const syncValue = sync[syncField];

        if (syncField === 'charging' && log[logField] === TYPE.UNKNOWN && syncValue != null) {
          log[logField] = syncValue ? TYPE.CHARGE : TYPE.DRIVE;
        } else if (log[logField] == null && syncValue != null) {
          log[logField] = syncValue;
        }

        if ((syncField === 'charging' ? log[logField] == TYPE.UNKNOWN : log[logField] == null) && syncValue != null) {
          log[logField] = syncValue;
        }
      }
    }
  }

  private setCurrentMetadata(log: Log, sync: Sync) {
    if (!sync.socDisplay && !sync.socBMS) {
      return;
    }

    log.currentSOC = sync.socDisplay || sync.socBMS;
  }

  private setSummarizedMetadata(log: Log, sync: Sync) {
    const summarizableFields = [
      'dcBatteryPower',
      'speed',
      'latitude',
      'longitude',
      'cec',
      'ced',
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

    if (sync.cec != null && log.startCEC) {
      log.rechargedKWh = parseFloat((sync.cec - log.startCEC).toFixed(1));
    }

    if (sync.ced != null && log.startCED) {
      log.dischargedKWh = parseFloat((sync.ced - log.startCED).toFixed(1));
    }
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
    this.setCurrentMetadata(payload.log, payload.sync);
    this.setSummarizedMetadata(payload.log, payload.sync);
    this.saveMetadata(payload.log);
  }

  async handleFinishedEvent(log: Log) {
    this.setEndMetadata(log);
    this.saveMetadata(log);
  }
}
