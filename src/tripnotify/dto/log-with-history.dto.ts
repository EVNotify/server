import { LogDto } from "src/logs/dto/log.dto";
import { Log } from "src/logs/schemas/log.schema";
import { Sync } from "src/logs/schemas/sync.schema";

export class LogWithHistoryDto extends LogDto {
  constructor(log: Log) {
    super(log);
    this.history = log.history;
  }

  history: Sync[];
}