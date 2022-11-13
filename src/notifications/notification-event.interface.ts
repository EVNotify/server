import { SettingDto } from 'src/settings/dto/setting.dto';
import { Log } from '../logs/schemas/log.schema';
import { Sync } from '../logs/schemas/sync.schema';

export interface NotificationEventInterface {
  shouldSend(settings: SettingDto, log: Log, sync: Sync): Promise<boolean>;
}
