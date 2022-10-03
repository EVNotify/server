import { IsNotEmpty, IsString, Length } from 'class-validator';
import { AKEY_LENGTH } from './account.dto';

export class AvailableAKeyDto {
  constructor(akey: string) {
    this.akey = akey;
  }

  @IsString()
  @IsNotEmpty()
  @Length(AKEY_LENGTH, AKEY_LENGTH)
  akey: string;
}
