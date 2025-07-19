import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class AddressInfo {
  constructor(latitude?: number, longitude?: number) {
    this.Latitude = latitude;
    this.Longitude = longitude;
  }

  @Prop({ required: true })
  Latitude: number;

  @Prop({ required: true })
  Longitude: number;
}
