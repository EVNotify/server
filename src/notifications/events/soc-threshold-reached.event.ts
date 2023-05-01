import { Log } from 'src/logs/schemas/log.schema';
import { Sync } from 'src/logs/schemas/sync.schema';
import { SettingDto } from 'src/settings/dto/setting.dto';
import { NotificationEventInterface } from './notification-event.interface';

export class SocThresholdReachedEvent implements NotificationEventInterface {
  shouldSend(settings: SettingDto, log: Log, sync: Sync): Promise<boolean> {
    const threshold = settings.socThreshold;
    const startSOC = log.startSOC;
    const currentSOC = sync.socDisplay || sync.socBMS;
    const hasNoValues = !threshold || !startSOC || !currentSOC;
    const startedAboveThreshold = startSOC > threshold;
    const limitNotReached = currentSOC < threshold;

    if (hasNoValues || startedAboveThreshold || limitNotReached) {
      return Promise.resolve(false);
    }

    return Promise.resolve(true);
  }
}
