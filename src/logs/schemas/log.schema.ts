import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AKEY_LENGTH } from 'src/account/dto/account.dto';
import { STATUS } from '../entities/status.entity';

export type LogDocument = Log & Document;

@Schema({
  timestamps: {
    createdAt: 'startDate',
  },
})
export class Log {
  @Prop({
    required: true,
    unique: true,
    minlength: AKEY_LENGTH,
    maxlength: AKEY_LENGTH,
  })
  akey: string;

  @Prop()
  title: string;

  @Prop({
    required: true,
    default: STATUS.RUNNING,
    enum: STATUS,
  })
  status: STATUS;

  @Prop({ default: false })
  isCharge: boolean;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({
    min: 0,
    max: 100,
  })
  startSOC: number;

  @Prop({
    min: 0,
    max: 100,
  })
  endSOC: number;

  @Prop({
    min: 0,
  })
  startODO: number;

  @Prop({
    min: 0,
  })
  endODO: number;

  @Prop({
    min: 0,
  })
  startCEC: number;

  @Prop({
    min: 0,
  })
  endCEC: number;

  @Prop({
    min: 0,
  })
  startCED: number;

  @Prop({
    min: 0,
  })
  endCED: number;

  @Prop()
  averageKW: number;

  @Prop({
    min: 0,
  })
  distance: number;

  @Prop({
    min: 0,
  })
  averageSpeed: number;
}

export const LogSchema = SchemaFactory.createForClass(Log);
