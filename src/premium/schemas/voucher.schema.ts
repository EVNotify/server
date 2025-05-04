import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsNotEmpty, Max, Min } from "class-validator";
import { PREMIUM_DURATION } from "../entities/premium-duration.entity";
import { AKEY_LENGTH } from "../../account/dto/account.dto";

export const VOUCHER_LENGTH = 10;

export type VoucherDocument = Voucher & Document;

@Schema()
export class Voucher {
  @Prop({
    required: true,
    unique: true,
    minlength: VOUCHER_LENGTH,
    maxlength: VOUCHER_LENGTH,
  })
  code: string;

  @Prop()
  @Min(PREMIUM_DURATION.FIVE_MINUTES)
  @Max(PREMIUM_DURATION.ONE_YEAR)
  @IsNotEmpty()
  durationInMinutes: number;

  @Prop({
    required: false,
    minlength: AKEY_LENGTH,
    maxlength: AKEY_LENGTH,
    default: null,
    ref: 'Account',
  })
  redeemedBy?: string;

  @Prop()
  redeemedAt?: Date;
}

export const VoucherSchema = SchemaFactory.createForClass(Voucher);