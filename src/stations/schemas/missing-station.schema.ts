import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MissingStationDocument = MissingStation & Document;

@Schema({ timestamps: true })
export class MissingStation {
  _id: Types.ObjectId;

  @Prop({ required: true })
  akey: string;

  @Prop({ type: Types.ObjectId, ref: 'Log', required: true })
  logRef: Types.ObjectId;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop()
  note: string;
}

export const MissingStationSchema = SchemaFactory.createForClass(MissingStation);
