import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema()
export class Account {
  @Prop({ required: true })
  akey: string;

  @Prop({ required: true })
  passwordHash: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
