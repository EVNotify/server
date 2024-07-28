import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LOG_DATA_SYNCED_EVENT } from '../entities/log.entity';
import { LastSync } from '../schemas/last-sync.schema';
import { Log } from '../schemas/log.schema';
import { Sync } from '../schemas/sync.schema';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LastSyncHandler {
  constructor(
    @InjectModel(LastSync.name) private lastSyncModel: Model<LastSync>,
    emitter: EventEmitter2,
  ) {
    emitter.on(LOG_DATA_SYNCED_EVENT, (payload: { log: Log; sync: Sync }) =>
      this.handleSyncEvent(payload),
    );
  }

  private async getOrCreateLastSync(akey: string): Promise<LastSync> {
    const log = await this.lastSyncModel.findOne({
      akey,
    });

    if (log) {
      return log;
    }

    return await this.lastSyncModel.create({
      akey,
    });
  }

  private async updateLastSync(lastSync: LastSync, data: Sync) {
    Object.keys(data).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        lastSync[key] = data[key];
      }
    });

    await this.lastSyncModel.updateOne(
      {
        akey: lastSync.akey,
      },
      lastSync,
    );
  }

  async handleSyncEvent(payload: { log: Log; sync: Sync }) {
    const lastSync = await this.getOrCreateLastSync(payload.log.akey);

    await this.updateLastSync(lastSync, payload.sync);
  }
}
