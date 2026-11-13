import { Injectable, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { Sync } from 'src/logs/schemas/sync.schema';
import { TRIP_LENGTH } from './schemas/trip.schema';
import { TripNotifyService } from './tripnotify.service';
import { sharedSync } from './utils/shared-sync';

@WebSocketGateway({
  cors: { origin: '*' },
})
@Injectable()
export class TripNotifyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private server: Server;
  private readonly logger = new Logger(TripNotifyGateway.name);

  constructor(private readonly tripNotifyService: TripNotifyService) {}

  afterInit(server: Server) {
    this.server = server;
    server.use(async (client, next) => {
      const code: unknown = client.handshake.auth?.code;

      try {
        if (
          typeof code !== 'string' ||
          !new RegExp(`^[A-Za-z0-9]{${TRIP_LENGTH}}$`).test(code)
        ) {
          throw new Error('Unauthorized');
        }

        await this.tripNotifyService.findAccessibleByCode(code);
        client.data.tripCode = code;
        next();
      } catch {
        this.logger.warn('TripNotify socket authorization failed');
        next(new Error('Unauthorized'));
      }
    });
    this.logger.log('Initialized TripNotify');
  }

  async handleConnection(client: Socket) {
    try {
      await client.join(this.room(client.data.tripCode));
    } catch {
      this.logger.warn('TripNotify socket room assignment failed');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  async handleSyncUpdate(code: string, logId: Types.ObjectId, data: Sync) {
    try {
      // Recheck mutable permissions; a connection does not grant permanent access.
      const trip = await this.tripNotifyService.findAccessibleByCode(code);
      const now = new Date();

      // Historical access after expiry never extends the live sharing window.
      if (trip.startDate > now || trip.endDate <= now) {
        return;
      }

      // Upload time does not authorize telemetry recorded outside the share.
      const timestamp =
        data.timestamp == null ? NaN : new Date(data.timestamp).getTime();
      if (
        !Number.isFinite(timestamp) ||
        timestamp < trip.startDate.getTime() ||
        timestamp >= trip.endDate.getTime()
      ) {
        return;
      }

      this.server.to(this.room(code)).emit(`route-update:${code}`, {
        logId,
        data: sharedSync(data, trip.locationEnabled),
      });
    } catch {
      this.logger.warn('TripNotify update authorization failed');
    }
  }

  private room(code: string): string {
    return `tripnotify:${code}`;
  }
}
