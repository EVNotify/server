import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AKEY_LENGTH } from '../../account/dto/account.dto';
import { STATUS } from '../entities/status.entity';
import { Sync } from './sync.schema';
import { TYPE } from '../entities/type.entity';

export type LogDocument = Log & Document;

@Schema({
  timestamps: {
    createdAt: 'startDate',
  },
})
export class Log {
  _id: Types.ObjectId;

  updatedAt: Date;

  @Prop({
    required: true,
    minlength: AKEY_LENGTH,
    maxlength: AKEY_LENGTH,
    ref: 'Account',
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

  @Prop({
    required: true,
    default: TYPE.UNKNOWN,
    enum: TYPE,
  })
  type: TYPE;

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
  currentSOC: number;

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

  @Prop({
    min: 0,
  })
  rechargedKWh: number;

  @Prop({
    min: 0,
  })
  dischargedKWh: number;

  @Prop({ type: [Sync] })
  history: Sync[];

  @Prop()
  thresholdReached: Date;
}

export const LogSchema = SchemaFactory.createForClass(Log);
