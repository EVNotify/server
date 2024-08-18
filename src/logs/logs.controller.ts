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
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { UpdateLogDto } from './dto/update-log.dto';
import { AuthGuard } from '../account/account.guard';
import { LogsGuard } from './logs.guard';
import { OwnsLog } from './decorators/owns-log.decorator';
import { SyncDto } from './dto/sync.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LogNotExistsException } from './exceptions/log-not-exists.exception';
import { LogMissingSyncDataException } from './exceptions/log-missing-sync-data.exception';
import { TYPE } from './entities/type.entity';

@Controller('logs')
@UseGuards(AuthGuard)
@UseGuards(LogsGuard)
@ApiTags('Logs & Sync')
@ApiBearerAuth()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get(':akey')
  async findAll(@Param('akey') akey: string, @Query('type') type?: TYPE) {
    return this.logsService.findAll(akey, type);
  }

  @Get(':akey/last-sync')
  async lastSync(@Param('akey') akey: string) {
    return this.logsService.lastSync(akey);
  }

  @Get(':akey/:id')
  @OwnsLog()
  async findOne(@Param('akey') akey: string, @Param('id') id: string) {
    try {
      return await this.logsService.findOne(akey, id);
    } catch (error) {
      if (error instanceof LogNotExistsException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }

  @Get(':akey/:id/history')
  @OwnsLog()
  async findOneWithHistory(
    @Param('akey') akey: string,
    @Param('id') id: string,
  ) {
    try {
      return await this.logsService.findOneWithHistory(akey, id);
    } catch (error) {
      if (error instanceof LogNotExistsException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }

  @Post(':akey')
  @HttpCode(204)
  async syncData(@Param('akey') akey: string, @Body() syncDto: SyncDto) {
    try {
      return await this.logsService.syncData(akey, syncDto);
    } catch (error) {
      if (error instanceof LogMissingSyncDataException) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException();
    }
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
