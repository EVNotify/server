import { Controller, Get, HttpCode, HttpStatus, Logger, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { debugPort } from "process";
import { AccountService } from "src/account/account.service";
import { LoginTokenDto } from "src/account/dto/login-token.dto";
import { SettingsService } from "src/settings/settings.service";

@Controller('notifications')
@ApiTags('Notifications')
export class NotificationController {
  constructor(
    private readonly accountService: AccountService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get(':akey/email/unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribeFromEmail(@Param('akey') akey: string, @Query('token') token: string) {
    try {
      const dto = new LoginTokenDto();

      dto.token = token;

      this.accountService.loginWithToken(akey, dto);

      await this.settingsService.update(akey, {
        email: null,
      });  
    } catch (error) {
      Logger.warn(`Unsubscribing from mail not possible ${error}`, NotificationController.name);
    }
  }
}