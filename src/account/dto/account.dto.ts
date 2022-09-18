import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Account } from '../schemas/account.schema';

export const AKEY_LENGTH = 6;
export const TOKEN_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 72;

export class AccountDto {
  constructor(account: Account) {
    this.akey = account.akey;
    this.token = account.token;
  }

  @IsString()
  @IsNotEmpty()
  @Length(AKEY_LENGTH, AKEY_LENGTH)
  akey: string;

  @IsString()
  @IsNotEmpty()
  @Length(TOKEN_LENGTH, TOKEN_LENGTH)
  token: string;
}
