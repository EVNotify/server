import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { UpdateLogDto } from './dto/update-log.dto';
import { AuthGuard } from 'src/account/account.guard';

@Controller('logs')
@UseGuards(AuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get(':akey')
  findAll(@Param('akey') akey: string) {
    return this.logsService.findAll(akey);
  }

  @Get(':akey/:id')
  // find one specific log
  findOne(@Param('akey') akey: string, @Param('id') id: string) {
    return this.logsService.findOne(akey, id);
  }

  @Post(':akey')
  // add new data to current log
  syncData(@Param('akey') akey: string) {
    return this.logsService.syncData();
  }

  @Patch(':akey/:id')
  // update specific metadata for specified log
  update(
    @Param('akey') akey: string,
    @Param('id') id: string,
    @Body() updateLogDto: UpdateLogDto,
  ) {
    return this.logsService.update(+id, updateLogDto);
  }

  @Delete(':akey/:id')
  // delete specified log
  remove(@Param('akey') akey: string, @Param('id') id: string) {
    return this.logsService.remove(+id);
  }
}
