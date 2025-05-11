import { Log } from "src/logs/schemas/log.schema";
import { Sync } from "src/logs/schemas/sync.schema";
import { SettingDto } from "src/settings/dto/setting.dto";
import { NOTIFICATION_EVENT } from "../entities/notification-event.entity";
import { EventHandlerInterface } from "./event-handler.interface";
import { TYPE } from "src/logs/entities/type.entity";

export class ThresholdReachedHandler implements EventHandlerInterface {
  shouldProceed(settings: SettingDto, log: Log, sync: Sync, event: NOTIFICATION_EVENT.THRESHOLD_REACHED): Promise<boolean> {
    // TODO handle range threshold too
    const thresholdDefined = settings.socThreshold;
    const thresholdReached = thresholdDefined && log.type == TYPE.CHARGE && log.startSOC < thresholdDefined && (sync.socDisplay || sync.socBMS) >= thresholdDefined;

    return Promise.resolve(!log.thresholdReached && thresholdReached);
  }
}