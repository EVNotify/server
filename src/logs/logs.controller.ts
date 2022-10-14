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
  HttpCode,
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
  async findAll(@Param('akey') akey: string) {
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
  async syncData(@Param('akey') akey: string) {
    return this.logsService.syncData();
  }

  @Patch(':akey/:id')
  async update(
    @Param('akey') akey: string,
    @Param('id') id: string,
    @Body() updateLogDto: UpdateLogDto,
  ) {
    return this.logsService.update(akey, id, updateLogDto);
  }

  @Delete(':akey/:id')
  @HttpCode(204)
  async remove(@Param('akey') akey: string, @Param('id') id: string) {
    await this.logsService.remove(akey, id);
  }
}
