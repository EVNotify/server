import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TripType } from '../entitites/trip-type.entity';
import { AKEY_LENGTH } from 'src/account/dto/account.dto';

export const TRIP_LENGTH = 6;

export type TripDocument = Trip & Document;

@Schema({ timestamps: true })
export class Trip {
  @Prop()
   name?: string;

  @Prop({
    required: true,
    unique: true,
    length: TRIP_LENGTH,
    match: new RegExp(`^[A-Za-z0-9]{${TRIP_LENGTH}}$`),
  })
  code: string;

  @Prop({
    ref: 'Account',
    required: true,
    minlength: AKEY_LENGTH,
    maxlength: AKEY_LENGTH,
  })
  akey: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  locationEnabled: boolean;

  @Prop({ required: true })
  accessibleAfterEnd: boolean;

  @Prop({
    required: true,
    enum: TripType,
  })
  type: TripType;
}

export const TripSchema = SchemaFactory.createForClass(Trip);
