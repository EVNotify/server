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

  @Prop()
  note: string;
}

export const MissingStationSchema = SchemaFactory.createForClass(MissingStation);

MissingStationSchema.index({ location: '2dsphere' });
