import { SettingDto } from 'src/settings/dto/setting.dto';
import { Log } from '../../logs/schemas/log.schema';
import { Sync } from '../../logs/schemas/sync.schema';
import { NOTIFICATION_EVENT } from '../entities/notification-event.entity';

export interface NotificationEventInterface {
  shouldSend(
    settings: SettingDto,
    log: Log,
    sync: Sync,
    event: NOTIFICATION_EVENT
  ): Promise<boolean>;
}
