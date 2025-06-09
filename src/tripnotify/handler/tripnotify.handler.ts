import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { LOG_DATA_SYNCED_EVENT } from "src/logs/entities/log.entity";
import { Log } from "src/logs/schemas/log.schema";
import { Sync } from "src/logs/schemas/sync.schema";
import { TripNotifyService } from "../tripnotify.service";
import { TripNotifyGateway } from "../tripnotify.gateway";

@Injectable()
export class TripNotifyHandler {
  constructor(
    private readonly tripNotifyGateway: TripNotifyGateway,
    private readonly tripNotifyService: TripNotifyService,
  ) {}

  @OnEvent(LOG_DATA_SYNCED_EVENT)
  async handleSyncEvent(payload: { log: Log; sync: Sync }) {
    try {
      const activeTrips = await this.tripNotifyService.findActives(payload.log.akey);

      activeTrips.forEach((trip) => {
        this.tripNotifyGateway.handleSyncUpdate(trip.code, payload.log._id, payload.sync);
      });
    } catch (_) {}
  }
}