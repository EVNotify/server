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

@Controller('logs')
@UseGuards(AuthGuard)
@UseGuards(LogsGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get(':akey')
  async findAll(@Param('akey') akey: string) {
    return this.logsService.findAll(akey);
  }

  @Get(':akey/:id')
  @OwnsLog()
  async findOne(@Param('akey') akey: string, @Param('id') id: string) {
    return await this.logsService.findOne(akey, id);
  }

  @Post(':akey')
  // add new data to current log
  async syncData(@Param('akey') akey: string) {
    return this.logsService.syncData();
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
