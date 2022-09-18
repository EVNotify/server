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
} from '@nestjs/common';
import { AuthGuard } from './account.guard';
import { AccountService } from './account.service';
import { Guest } from './decorators/guest.decorator';
import { ChangePasswordDto } from './dto/change-password';
import { ChangeTokenDto } from './dto/change-token.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountAlreadyExistsException } from './exceptions/account-already-exists.exception';

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

    return account;
  }

  @Patch(':akey/token')
  changeToken(
    @Param('akey') akey: string,
    @Body() changeTokenDto: ChangeTokenDto,
  ) {
    return this.accountService.changeToken(akey, changeTokenDto);
  }

  @Patch(':akey/password')
  changePassword(
    @Param('akey') akey: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.accountService.changePassword(akey, changePasswordDto);
  }
}
