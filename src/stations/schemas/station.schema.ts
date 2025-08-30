import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { AddressInfo } from "./address-info.schema";

export type StationDocument = Station & Document;

@Schema({ strict: false })
export class Station {
  constructor(partial?: Partial<Station>) {
    if (!partial) {
      return;
    }

    Object.assign(this, partial);

    if (partial.AddressInfo) {
      this.AddressInfo = new AddressInfo(partial.AddressInfo);
      this.location = {
        type: 'Point',
        coordinates: [partial.AddressInfo.Longitude, partial.AddressInfo.Latitude],
      };
    }

    const connections = this.data?.Connections || [];

    this.maxKW = Math.max(...connections.map((connection) => connection.PowerKW || 0)) || 0;
  }

  @Prop({ required: true, unique: true })
  ID: string;

  @Prop({ required: true, unique: true })
  UUID: string;

  @Prop({ required: true, type: AddressInfo })
  AddressInfo: AddressInfo;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({required: true })
  maxKW: number;

  @Prop({ type: Object })
  data: any;
}

export const StationSchema = SchemaFactory.createForClass(Station);

StationSchema.index({ location: '2dsphere' });