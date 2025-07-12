import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class AddressInfo {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}
