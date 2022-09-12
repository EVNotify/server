import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Account } from '../schemas/account.schema';

export class AccountDto {
  constructor(account: Account) {
    this.akey = account.akey;
    this.token = account.token;
  }

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  akey: string;

  @IsString()
  @IsNotEmpty()
  @Length(20, 20)
  token: string;
}
