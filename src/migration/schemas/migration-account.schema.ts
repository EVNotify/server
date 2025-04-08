import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { AKEY_LENGTH, TOKEN_LENGTH } from "src/account/dto/account.dto";

@Schema()
export class MigrationAccount {
    @Prop({
        required: true,
        minlength: AKEY_LENGTH,
        maxlength: AKEY_LENGTH,
        ref: 'Account',
    })
    v3Akey: string;

    @Prop({
        required: true,
        minlength: AKEY_LENGTH,
        maxlength: AKEY_LENGTH,
    })
    v2Akey: string;

    @Prop({
        required: true,
        minlength: TOKEN_LENGTH,
        maxlength: TOKEN_LENGTH,
    })
    v2Token: string;
}

export const MigrationAccountSchema = SchemaFactory.createForClass(MigrationAccount);
