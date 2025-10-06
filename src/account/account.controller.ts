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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Exception } from '../utils/exception';
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
@ApiTags('Account')
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

  @Guest()
  @Get('/akey')
  async availableAKey() {
    let retries = 0;
    let akey = this.accountService.akey();

    while (await this.accountService.findOne(akey)) {
      if (retries++ === 10) {
        throw new InternalServerErrorException('AKey generation error');
      }

      akey = this.accountService.akey();
    }

    return new AvailableAKeyDto(akey);
  }

  @Get(':akey')
  @ApiSecurity('custom-auth')
  async findOne(@Param('akey') akey: string) {
    const account = await this.accountService.findOne(akey);

    if (!account) {
      throw new NotFoundException('Account does not exist');
    }

    return new AccountDto(account);
  }

  @Post(':akey/login')
  @Guest()
  @HttpCode(HttpStatus.OK)
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
  @ApiSecurity('custom-auth')
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
      if (error instanceof AccountNotExistsException) {
        throw new NotFoundException(error.message);
      }

      throw new UnauthorizedException(
        error instanceof Exception ? error.message : null,
      );
    }
  }

  @Patch(':akey/password')
  @ApiSecurity('custom-auth')
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
      if (error instanceof AccountNotExistsException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof PasswordNotDifferentException) {
        throw new BadRequestException(error.message);
      }

      throw new UnauthorizedException(
        error instanceof Exception ? error.message : null,
      );
    }
  }
}
