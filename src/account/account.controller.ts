import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Exception } from 'src/utils/exception';
import { AuthGuard } from './account.guard';
import { AccountService } from './account.service';
import { Guest } from './decorators/guest.decorator';
import { AccountDto } from './dto/account.dto';
import { AvailableAKeyDto } from './dto/available-akey.dto';
import { ChangePasswordDto } from './dto/change-password-dto';
import { ChangeTokenDto } from './dto/change-token.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { LoginPasswordDto } from './dto/login-password.dto';
import { AccountAlreadyExistsException } from './exceptions/account-already-exists.exception';
import { AccountNotExistsException } from './exceptions/account-not-exists.exception';
import { PasswordNotDifferentException } from './exceptions/password-not-different.exception';

@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @Guest()
  async create(@Body() createAccountDto: CreateAccountDto) {
    try {
      return await this.accountService.create(createAccountDto);
    } catch (error) {
      if (error instanceof AccountAlreadyExistsException) {
        throw new ConflictException(error.message);
      }

      throw new InternalServerErrorException('Account creation failed');
    }
  }

  @Get(':akey')
  async findOne(@Param('akey') akey: string) {
    const account = await this.accountService.findOne(akey);

    if (!account) {
      throw new NotFoundException('Account does not exist');
    }

    return new AccountDto(account);
  }

  @Post(':akey/login')
  @Guest()
  async login(@Param('akey') akey: string, @Body() loginDto: LoginPasswordDto) {
    try {
      const account = await this.accountService.loginWithPassword(
        akey,
        loginDto,
      );

      return new AccountDto(account);
    } catch (error) {
      if (error instanceof AccountNotExistsException) {
        throw new NotFoundException(error.message);
      }

      throw new UnauthorizedException(
        error instanceof Exception ? error.message : null,
      );
    }
  }

  @Patch(':akey/token')
  async changeToken(
    @Param('akey') akey: string,
    @Body() changeTokenDto: ChangeTokenDto,
  ) {
    try {
      const account = await this.accountService.changeToken(
        akey,
        changeTokenDto,
      );

      return new AccountDto(account);
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Exception ? error.message : null,
      );
    }
  }

  @Patch(':akey/password')
  async changePassword(
    @Param('akey') akey: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      const account = await this.accountService.changePassword(
        akey,
        changePasswordDto,
      );

      return new AccountDto(account);
    } catch (error) {
      if (error instanceof PasswordNotDifferentException) {
        throw new BadRequestException(error.message);
      }

      throw new UnauthorizedException(
        error instanceof Exception ? error.message : null,
      );
    }
  }
}
