import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './schemas/account.schema';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    return new this.accountModel(createAccountDto).save();
  }

  async findOne(akey: string): Promise<Account> {
    return this.accountModel.findOne({ akey });
  }

  update(akey: string, updateAccountDto: UpdateAccountDto) {
    return `This action updates a #${akey} account`;
  }
}
