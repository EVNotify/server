import { IsNotEmpty, IsString, Length } from 'class-validator';
import {
  AKEY_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './account.dto';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @Length(AKEY_LENGTH, AKEY_LENGTH)
  akey: string;

  @IsString()
  @IsNotEmpty()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  password: string;
}
