import { Log } from "src/logs/schemas/log.schema";
import { Sync } from "src/logs/schemas/sync.schema";
import { SettingDto } from "src/settings/dto/setting.dto";
import { NOTIFICATION_EVENT } from "../entities/notification-event.entity";

export interface EventHandlerInterface {
  shouldProceed(
    settings: SettingDto,
    log: Log,
    sync: Sync,
    event: NOTIFICATION_EVENT,
  ): Promise<boolean>;
}