import { Injectable, Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway } from "@nestjs/websockets";
import { Types } from "mongoose";
import { Server, Socket } from "socket.io";
import { Sync } from "src/logs/schemas/sync.schema";

@WebSocketGateway({
  cors: { origin: '*' },
})
@Injectable()
export class TripNotifyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private server: Server;
  private logger = new Logger(TripNotifyGateway.name);

  afterInit(server: Server) {
    this.logger.log('Initialized TripNotify');
    this.server = server;
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  handleSyncUpdate(code: string, logId: Types.ObjectId, data: Sync) {
    this.server.emit(`route-update:${code}`, { logId, data });
  }
}