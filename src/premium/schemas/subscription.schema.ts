import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AKEY_LENGTH } from '../../account/dto/account.dto';

export type SubscriptionDocument = Subscription & Document;

@Schema()
export class Subscription {
  @Prop({
    required: true,
    minlength: AKEY_LENGTH,
    maxlength: AKEY_LENGTH,
    ref: 'Account',
    unique: true,
  })
  akey: string;

  @Prop({
    required: true,
    unique: true,
  })
  purchaseToken: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
