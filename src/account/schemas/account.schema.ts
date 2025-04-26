import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AKEY_LENGTH, TOKEN_LENGTH } from '../dto/account.dto';

export type AccountDocument = Account & Document;

@Schema()
export class Account {
  @Prop({
    required: true,
    unique: true,
    minlength: AKEY_LENGTH,
    maxlength: AKEY_LENGTH,
  })
  akey: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, minlength: TOKEN_LENGTH, maxlength: TOKEN_LENGTH })
  token: string;

  @Prop({ type: Date, default: null })
  premiumUntil?: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
