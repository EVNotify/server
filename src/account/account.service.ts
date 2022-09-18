import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAccountDto } from './dto/create-account.dto';
import { Account } from './schemas/account.schema';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AccountDto } from './dto/account.dto';
import { AccountAlreadyExistsException } from './exceptions/account-already-exists.exception';
import { ChangeTokenDto } from './dto/change-token.dto';
import { ChangePasswordDto } from './dto/change-password';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<AccountDto> {
    if (await this.findOne(createAccountDto.akey)) {
      throw new AccountAlreadyExistsException();
    }

    const account = new Account();

    account.akey = createAccountDto.akey;
    account.passwordHash = await bcrypt.hash(createAccountDto.password, 10);
    account.token = randomBytes(10).toString('hex');

    await new this.accountModel(account).save();

    return new AccountDto(account);
  }

  async findOne(akey: string): Promise<Account> {
    return this.accountModel.findOne({ akey });
  }

  async changeToken(akey: string, changeTokenDto: ChangeTokenDto) {
    console.log(changeTokenDto);
    return `This action updates a #${akey} account`;
  }

  async changePassword(akey: string, changePasswordDto: ChangePasswordDto) {
    console.log(changePasswordDto);
    return '';
  }
}
