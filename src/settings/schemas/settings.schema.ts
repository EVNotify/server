import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { LANGUAGES } from '../entities/language.entity';

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
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
