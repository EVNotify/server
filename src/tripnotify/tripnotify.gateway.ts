import { Injectable, Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: { origin: '*' },
})
@Injectable()
export class TripNotifyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(TripNotifyGateway.name);

  private route = [
    [51.505, -0.09],
    [51.506, -0.091],
    [51.507, -0.092],
    [51.508, -0.095],
    [51.509, -0.097],
  ];

  private clientIntervals = new Map<string, NodeJS.Timeout>();

  afterInit() {
    this.logger.log('Initialized TripNotify');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);

    let i = 0;

    const interval = setInterval(() => {
      const payload = {
        coords: this.route[i % this.route.length],
        info: {
          start: "London",
          end: "Cambridge",
          consumption: "18.4 kWh / 100km",
          avgSpeed: 72,
          chargingStops: [
            { time: "10:15", location: "Tankstelle A" },
            { time: "11:30", location: "Rastplatz B" }
          ]
        }
      };

      client.emit('route-update', payload);
      i++;
    }, 2000);

    this.clientIntervals.set(client.id, interval);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
    const interval = this.clientIntervals.get(client.id);
    if (interval) {
      clearInterval(interval);
      this.clientIntervals.delete(client.id);
    }
  }
}