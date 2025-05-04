import { Type } from "class-transformer";
import { IsNotEmptyObject, IsNumber, IsOptional, Length, Max, Min, ValidateNested } from "class-validator";
import { AKEY_LENGTH, TOKEN_LENGTH } from "../../account/dto/account.dto";

class SocData {
    @IsOptional()
    @Min(0)
    @Max(100)
    @IsNumber()
    display: number;

    @IsOptional()
    @Min(0)
    @Max(100)
    @IsNumber()
    bms: number;
}

export class MigrateSocDto {
    @Length(AKEY_LENGTH, AKEY_LENGTH)
    akey: string;
    @Length(TOKEN_LENGTH, TOKEN_LENGTH)
    token: string;
    @ValidateNested()
    @IsNotEmptyObject()
    @Type(() => SocData)
    response: SocData;
}