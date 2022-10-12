import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { UpdateLogDto } from './dto/update-log.dto';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  // find all logs
  findAll() {
    return this.logsService.findAll();
  }

  @Get(':id')
  // find one specific log
  findOne(@Param('id') id: string) {
    return this.logsService.findOne(+id);
  }

  @Post()
  // add new data to current log
  syncData() {
    return this.logsService.syncData();
  }

  @Patch(':id')
  // update specific metadata for specified log
  update(@Param('id') id: string, @Body() updateLogDto: UpdateLogDto) {
    return this.logsService.update(+id, updateLogDto);
  }

  @Delete(':id')
  // delete specified log
  remove(@Param('id') id: string) {
    return this.logsService.remove(+id);
  }
}
