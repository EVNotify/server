import { Prop } from '@nestjs/mongoose';

export class Sync {
  createdAt: Date;

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
