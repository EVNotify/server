import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class AddressInfo {
  constructor(partial?: Partial<AddressInfo>) {
    if (!partial) {
      return;
    }

    Object.assign(this, partial);
  }

  @Prop({ required: true })
  Latitude: number;

  @Prop({ required: true })
  Longitude: number;

  @Prop()
  Title?: string;
  @Prop()
  Postcode?: string;

  @Prop()
  Town?: string;

  @Prop()
  AddressLine1?: string;
}
