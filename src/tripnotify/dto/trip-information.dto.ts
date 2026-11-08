import { LogWithHistoryDto } from './log-with-history.dto';
import { Expose } from 'class-transformer';
import { TripMetadataDto } from './trip-metadata.dto';
import { TYPE } from 'src/logs/entities/type.entity';

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function aggregate(
  logs: LogWithHistoryDto[],
  field: 'dischargedKWh' | 'rechargedKWh' | 'averageSpeed' | 'averageKW',
  average = false,
): number | undefined {
  // Missing measurements are unknown, not zero. Do not label partial sums as totals.
  if (!logs.length || logs.some((log) => !finite(log[field]))) {
    return undefined;
  }
  const sum = logs.reduce(
    (total, log) =>
      total + (field === 'averageKW' ? Math.abs(log[field]) : log[field]),
    0,
  );
  return Number((average ? sum / logs.length : sum).toFixed(2));
}

export class TripInformationDto {
  constructor(logs: LogWithHistoryDto[]) {
    this.logs = logs;
  }

  logs: LogWithHistoryDto[];

  @Expose()
  get metadata(): TripMetadataDto {
    const unclassified = (log: LogWithHistoryDto) =>
      log.type === TYPE.UNKNOWN &&
      !finite(log.averageKW) &&
      !finite(log.averageSpeed);
    // Zero power must not override speed evidence for an unclassified drive.
    const inferredDrive = (log: LogWithHistoryDto) =>
      log.type === TYPE.UNKNOWN &&
      (!finite(log.averageKW) || log.averageKW === 0) &&
      finite(log.averageSpeed);
    const chargeLogs = this.logs.filter(
      (log) =>
        log.type === TYPE.CHARGE ||
        (log.type === TYPE.UNKNOWN &&
          finite(log.averageKW) &&
          !inferredDrive(log)) ||
        unclassified(log),
    );
    const driveLogs = this.logs.filter(
      (log) =>
        log.type === TYPE.DRIVE || inferredDrive(log) || unclassified(log),
    );

    return new TripMetadataDto(
      aggregate(this.logs, 'dischargedKWh'),
      aggregate(this.logs, 'rechargedKWh'),
      aggregate(driveLogs, 'averageSpeed', true),
      aggregate(chargeLogs, 'averageKW', true),
    );
  }
}
