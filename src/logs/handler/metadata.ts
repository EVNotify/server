import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogDto } from '../dto/log.dto';
import { LOG_DATA_SYNCED_EVENT } from '../entities/log.entity';
import { STATUS } from '../entities/status.entity';
import { Log } from '../schemas/log.schema';
import { Sync } from '../schemas/sync.schema';

export class MetadataHandler {
  constructor(@InjectModel(Log.name) private logModel: Model<Log>) {}

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

  private setSummarizedMetadata(log: Log, sync: Sync) {}

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

  @OnEvent(LOG_DATA_SYNCED_EVENT)
  async handleSyncEvent(payload: { log: Log; sync: Sync }) {
    this.setOneTimeMetadata(payload.log, payload.sync);
    this.setSummarizedMetadata(payload.log, payload.sync);
    this.saveMetadata(payload.log);
  }
}
