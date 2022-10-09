import { Controller, Get, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/account/account.guard';
import { SettingsField } from './decorators/settings-field.decorator';
import { SettingDto } from './dto/setting.dto';
import { SettingsGuard } from './settings.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(AuthGuard)
@UseGuards(SettingsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':akey')
  findOne(@Param('akey') akey: string) {
    return 'find one akey';
  }

  @Get(':akey/:field')
  findOneSetting(@Param('akey') akey: string) {
    return 'find one akey setting';
  }

  @Patch(':akey')
  @SettingsField()
  update(@Param('akey') akey: string, @Body() settingDto: SettingDto) {
    console.log(settingDto);
    return 'update one akey';
  }

  @Patch(':akey/:field')
  @SettingsField()
  updateSetting(@Param('akey') akey: string, @Body() settingDto: SettingDto) {
    return 'update one akey setting';
  }
}
