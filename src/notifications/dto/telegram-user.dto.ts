import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';
import { AKEY_LENGTH } from 'src/account/dto/account.dto';

export class TelegramUserDto {
  constructor(id: number, akey: string, language: string) {
    this.id = id;
    this.akey = akey;
    this.language = language;
  }

  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  @Length(AKEY_LENGTH, AKEY_LENGTH)
  akey: string;

  @IsString()
  @IsNotEmpty()
  language: string;
}
