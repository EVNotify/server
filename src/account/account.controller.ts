import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  async create(@Body() createAccountDto: CreateAccountDto) {
    return await this.accountService.create(createAccountDto);
  }

  @Get(':akey')
  async findOne(@Param('akey') akey: string) {
    const account = await this.accountService.findOne(akey);

    if (!account) {
      throw new NotFoundException('Account does not exist');
    }

    return account;
  }

  @Patch(':akey')
  update(
    @Param('akey') akey: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountService.update(akey, updateAccountDto);
  }
}
