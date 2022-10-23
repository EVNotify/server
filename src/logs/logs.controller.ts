import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { UpdateLogDto } from './dto/update-log.dto';
import { AuthGuard } from 'src/account/account.guard';
import { LogsGuard } from './logs.guard';
import { OwnsLog } from './decorators/owns-log.decorator';
import { SyncDto } from './dto/sync.dto';

@Controller('logs')
@UseGuards(AuthGuard)
@UseGuards(LogsGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get(':akey')
  async findAll(@Param('akey') akey: string) {
    return this.logsService.findAll(akey);
  }

  @Get(':akey/last-sync')
  async lastSync(@Param('akey') akey: string) {
    return this.logsService.lastSync(akey);
  }

  @Get(':akey/:id')
  @OwnsLog()
  async findOne(@Param('akey') akey: string, @Param('id') id: string) {
    return this.logsService.findOne(akey, id);
  }

  @Post(':akey')
  async syncData(@Param('akey') akey: string, @Body() syncDto: SyncDto) {
    return this.logsService.syncData(akey, syncDto);
  }

  @Patch(':akey/:id')
  @OwnsLog()
  async update(
    @Param('akey') akey: string,
    @Param('id') id: string,
    @Body() updateLogDto: UpdateLogDto,
  ) {
    return this.logsService.update(akey, id, updateLogDto);
  }

  @Delete(':akey/:id')
  @OwnsLog()
  @HttpCode(204)
  async remove(@Param('akey') akey: string, @Param('id') id: string) {
    await this.logsService.remove(akey, id);
  }
}
