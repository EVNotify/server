import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CARS } from '../entities/car.entity';
import { CONSUMPTION_UNITS } from '../entities/consumption.entity';
import { LANGUAGES } from '../entities/language.entity';
import { RANGE_UNITS } from '../entities/range.entity';

export type SettingsDocument = Settings & Document;

@Schema()
export class Settings {
  @Prop({
    required: true,
    unique: true,
  })
  akey: string;

  @Prop({ default: true })
  logSummary: boolean;

  @Prop({ default: 70 })
  socThreshold: number;

  @Prop({ enum: LANGUAGES })
  language: string;

  @Prop({ enum: CARS })
  car: string;

  @Prop()
  capacity: number;

  @Prop({ enum: CONSUMPTION_UNITS })
  consumptionUnit: string;

  @Prop({ enum: RANGE_UNITS })
  rangeUnit: string;

  @Prop()
  device: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
