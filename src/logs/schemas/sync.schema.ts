import { Prop } from '@nestjs/mongoose';
import { SyncDto } from '../dto/sync.dto';

export class Sync {
  constructor(syncDto?: SyncDto) {
    this.timestamp = syncDto?.timestamp;
    this.latitude = syncDto?.latitude;
    this.longitude = syncDto?.longitude;
    this.altitude = syncDto?.altitude;
    this.accuracy = syncDto?.accuracy;
    this.speed = syncDto?.speed;
  }

  timestamp: Date;

  @Prop()
  latitude: number;

  @Prop()
  longitude: number;

  @Prop()
  altitude: number;

  @Prop()
  accuracy: number;

  @Prop()
  speed: number;
}
