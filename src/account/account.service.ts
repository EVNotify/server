import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAccountDto } from './dto/create-account.dto';
import { Account } from './schemas/account.schema';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AccountDto, AKEY_LENGTH, TOKEN_LENGTH } from './dto/account.dto';
import { AccountAlreadyExistsException } from './exceptions/account-already-exists.exception';
import { ChangeTokenDto } from './dto/change-token.dto';
import { ChangePasswordDto } from './dto/change-password-dto';
import { AccountNotExistsException } from './exceptions/account-not-exists.exception';
import { AuthenticationException } from './exceptions/authentication.exception';
import { LoginPasswordDto } from './dto/login-password.dto';
import { LoginTokenDto } from './dto/login-token.dto';
import { PasswordNotDifferentException } from './exceptions/password-not-different.exception';

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
    account.passwordHash = await this.hash(createAccountDto.password);
    account.token = this.token();

    await new this.accountModel(account).save();

    return new AccountDto(account);
  }

  async findOne(akey: string): Promise<Account | null> {
    return await this.accountModel.findOne({ akey });
  }

  async loginWithPassword(
    akey: string,
    loginDto: LoginPasswordDto,
  ): Promise<Account> {
    const account = await this.findOne(akey);

    if (!account) {
      throw new AccountNotExistsException();
    }

    const passwordCorrect = await bcrypt.compare(
      loginDto.password,
      account.passwordHash,
    );

    if (!passwordCorrect) {
      throw new AuthenticationException();
    }

    return account;
  }

  async loginWithToken(
    akey: string,
    loginDto: LoginTokenDto,
  ): Promise<Account> {
    const account = await this.findOne(akey);

    if (!account) {
      throw new AccountNotExistsException();
    }

    const tokenCorrect = loginDto.token === account.token;

    if (!tokenCorrect) {
      throw new AuthenticationException();
    }

    return account;
  }

  async changeToken(
    akey: string,
    changeTokenDto: ChangeTokenDto,
  ): Promise<Account> {
    const loginDto = new LoginPasswordDto();

    loginDto.password = changeTokenDto.password;

    const account = await this.loginWithPassword(akey, loginDto);

    account.token = this.token();

    await this.accountModel.updateOne(
      {
        akey: account.akey,
      },
      {
        $set: {
          token: account.token,
        },
      },
    );

    return account;
  }

  async changePassword(
    akey: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<Account> {
    const loginDto = new LoginPasswordDto();

    loginDto.password = changePasswordDto.password;

    const account = await this.loginWithPassword(akey, loginDto);
    const isIdentical = await bcrypt.compare(
      changePasswordDto.newPassword,
      account.passwordHash,
    );

    if (isIdentical) {
      throw new PasswordNotDifferentException();
    }

    account.passwordHash = await this.hash(changePasswordDto.newPassword);

    await this.accountModel.updateOne(
      {
        akey: account.akey,
      },
      {
        $set: {
          passwordHash: account.passwordHash,
        },
      },
    );

    return account;
  }

  public akey(): string {
    return randomBytes(AKEY_LENGTH / 2).toString('hex');
  }

  private token(): string {
    return randomBytes(TOKEN_LENGTH / 2).toString('hex');
  }

  private async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}
