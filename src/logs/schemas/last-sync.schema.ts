import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AKEY_LENGTH } from 'src/account/dto/account.dto';
import { Sync } from './sync.schema';

export type LastSyncDocument = LastSync & Document;

@Schema({
  timestamps: true,
})
export class LastSync extends Sync {
  @Prop({
    required: true,
    minlength: AKEY_LENGTH,
    maxlength: AKEY_LENGTH,
    ref: 'Account',
    unique: true,
  })
  akey: string;

  @Prop()
  updatedAt: Date;
}

export const LastSyncSchema = SchemaFactory.createForClass(LastSync);
