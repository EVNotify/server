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
      this.AddressInfo = new AddressInfo(partial.AddressInfo.Latitude, partial.AddressInfo.Longitude);
    }
  }

  @Prop({ required: true, unique: true })
  ID: string;

  @Prop({ required: true, unique: true})
  UUID: string;

  @Prop({ required: true, type: AddressInfo })
  AddressInfo: AddressInfo;

  @Prop({ type: Object })
  data: any;
}

export const StationSchema = SchemaFactory.createForClass(Station);