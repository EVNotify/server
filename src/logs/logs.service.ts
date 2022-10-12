import { Injectable } from '@nestjs/common';
import { UpdateLogDto } from './dto/update-log.dto';

@Injectable()
export class LogsService {
  findAll() {
    return `This action returns all logs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} log`;
  }

  update(id: number, updateLogDto: UpdateLogDto) {
    return `This action updates a #${id} log`;
  }

  syncData() {}

  remove(id: number) {
    return `This action removes a #${id} log`;
  }
}
