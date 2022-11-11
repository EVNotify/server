import { Log } from '../logs/schemas/log.schema';
import { Sync } from '../logs/schemas/sync.schema';
import { Settings } from '../settings/schemas/settings.schema';

export interface NotificationEventInterface {
  shouldSend(settings: Settings, sync: Sync, log: Log): Promise<boolean>;
}
