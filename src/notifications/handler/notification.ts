import { OnEvent } from '@nestjs/event-emitter';
import { LOG_DATA_SYNCED_EVENT } from '../../logs/entities/log.entity';
import { Log } from '../../logs/schemas/log.schema';
import { Sync } from '../../logs/schemas/sync.schema';
import { NOTIFICATION_EVENT } from '../entities/notification-event.entity';

export class NotificationHandler {
  private sendNotificationIfApplicable(
    payload: { log: Log; sync: Sync },
    event: NOTIFICATION_EVENT,
  ) {
    // check when last notification was send and if condition fulfilled based on event
    throw new Error('Method not implemented.');
  }

  @OnEvent(LOG_DATA_SYNCED_EVENT)
  async handleSyncEvent(payload: { log: Log; sync: Sync }) {
    this.sendNotificationIfApplicable(
      payload,
      NOTIFICATION_EVENT.SOC_THRESHOLD_REACHED,
    );
  }
}
