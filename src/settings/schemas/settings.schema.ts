import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CARS } from '../entities/car.entity';
import { CONSUMPTION_UNITS } from '../entities/consumption.entity';
import { LANGUAGES } from '../entities/language.entity';
import { RANGE_UNITS } from '../entities/range.entity';
import { SOC_THRESHOLD_DEFAULT } from '../entities/setting.entity';

export type SettingsDocument = Settings & Document;

@Schema()
export class Settings {
  _id: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
  })
  akey: string;

  @Prop({ default: true })
  logSummary: boolean;

  @Prop({ default: SOC_THRESHOLD_DEFAULT })
  socThreshold: number;

  @Prop({ enum: LANGUAGES })
  language: LANGUAGES;

  @Prop({ enum: CARS })
  car: CARS;

  @Prop()
  capacity: number;

  @Prop()
  consumption: number;

  @Prop({ enum: CONSUMPTION_UNITS })
  consumptionUnit: CONSUMPTION_UNITS;

  @Prop({ enum: RANGE_UNITS })
  rangeUnit: RANGE_UNITS;

  @Prop()
  device: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
