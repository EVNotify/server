import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { UpdateLogDto } from './dto/update-log.dto';
import { AuthGuard } from 'src/account/account.guard';
import { LogNotExistsException } from './exceptions/log-not-exists.exception';
import { Exception } from 'src/utils/exception';

@Controller('logs')
// Guard for log field?
// Guard to check if log id belongs to user?
@UseGuards(AuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get(':akey')
  findAll(@Param('akey') akey: string) {
    return this.logsService.findAll(akey);
  }

  @Get(':akey/:id')
  async findOne(@Param('akey') akey: string, @Param('id') id: string) {
    try {
      return await this.logsService.findOne(akey, id);
    } catch (error) {
      if (error instanceof LogNotExistsException) {
        return new NotFoundException(error.message);
      }

      return new InternalServerErrorException(
        error instanceof Exception ? error.message : null,
      );
    }
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
    return this.logsService.update(akey, id, updateLogDto);
  }

  @Delete(':akey/:id')
  // delete specified log
  remove(@Param('akey') akey: string, @Param('id') id: string) {
    return this.logsService.remove(+id);
  }
}
