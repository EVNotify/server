import { IsEnum, IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';
import { AKEY_LENGTH } from '../../account/dto/account.dto';
import { LANGUAGES } from '../../settings/entities/language.entity';

export class TelegramUserDto {
  constructor(id: number, akey: string, language: LANGUAGES) {
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

  @IsEnum(LANGUAGES)
  @IsNotEmpty()
  language: LANGUAGES;
}