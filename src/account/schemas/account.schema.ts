import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema()
export class Account {
  @Prop({ required: true, unique: true })
  akey: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, minlength: 20, maxlength: 20 })
  token: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
