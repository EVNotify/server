import { distance } from '@turf/turf';
import { STATUS } from '../../logs/entities/status.entity';
import { Log } from '../../logs/schemas/log.schema';
import { Sync } from '../../logs/schemas/sync.schema';
import { LogWithHistoryDto } from '../dto/log-with-history.dto';
import { Trip } from '../schemas/trip.schema';
import { hasBatteryData, sharedSync } from './shared-sync';

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function readings(history: Sync[], field: keyof Sync): number[] {
  return history.map((entry) => entry[field]).filter(finite);
}

function mean(values: number[]): number | undefined {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : undefined;
}

function counterDelta(
  history: Sync[],
  field: 'cec' | 'ced',
): number | undefined {
  const samples = history.filter((entry) => finite(entry[field]));
  const values = readings(samples, field);
  if (
    values.length < 2 ||
    new Date(samples[0].timestamp).getTime() >=
      new Date(samples[samples.length - 1].timestamp).getTime() ||
    values.some(
      (value, index) => value < 0 || (index > 0 && value < values[index - 1]),
    )
  ) {
    return undefined;
  }
  return Number((values[values.length - 1] - values[0]).toFixed(1));
}

function sharedDistance(history: Sync[]): number | undefined {
  const coordinates = history.filter(
    (entry) =>
      finite(entry.latitude) &&
      finite(entry.longitude) &&
      Math.abs(entry.latitude) <= 90 &&
      Math.abs(entry.longitude) <= 180,
  );
  if (coordinates.length < 2) {
    return undefined;
  }
  let total = 0;
  for (let index = 1; index < coordinates.length; index++) {
    const previous = coordinates[index - 1];
    const current = coordinates[index];
    total += distance(
      [previous.longitude, previous.latitude],
      [current.longitude, current.latitude],
    );
  }
  return Number(total.toFixed(2));
}

function recalculate(view: LogWithHistoryDto, history: Sync[]) {
  const soc = history
    .map((entry) =>
      finite(entry.socDisplay) ? entry.socDisplay : entry.socBMS,
    )
    .filter(finite);
  view.startSOC = soc[0];
  view.currentSOC = soc[soc.length - 1];
  view.endSOC = view.status === STATUS.RUNNING ? undefined : view.currentSOC;

  for (const [field, startField, endField] of [
    ['odo', 'startODO', 'endODO'],
    ['cec', 'startCEC', 'endCEC'],
    ['ced', 'startCED', 'endCED'],
  ] as const) {
    const values = readings(history, field);
    view[startField] = values[0];
    view[endField] = values[values.length - 1];
  }

  view.averageKW = mean(readings(history, 'dcBatteryPower'));
  view.averageSpeed = mean(readings(history, 'speed'));
  view.rechargedKWh = counterDelta(history, 'cec');
  view.dischargedKWh = counterDelta(history, 'ced');
  view.distance = sharedDistance(history);
  view.updatedAt = new Date(history[history.length - 1].timestamp);
}

/** Build a bounded response without changing the source document or history. */
export function sharedLog(
  log: Log,
  history: Sync[],
  trip: Trip,
  now: Date,
): LogWithHistoryDto | null {
  const start = trip.startDate.getTime();
  const end = trip.endDate.getTime();
  const raw = history ?? [];
  const samples = raw
    .filter((entry) => entry != null)
    .map((entry) => ({
      entry,
      time: entry.timestamp == null ? NaN : new Date(entry.timestamp).getTime(),
    }))
    .filter(({ time }) => Number.isFinite(time) && time >= start && time < end)
    .sort((left, right) => left.time - right.time)
    .map(({ entry }) => entry);
  if (!samples.length) {
    return null;
  }

  const view = new LogWithHistoryDto(log);
  const partial =
    log.startDate.getTime() < start ||
    !log.endDate ||
    log.endDate.getTime() >= end ||
    samples.length !== raw.length;
  view.startDate = new Date(Math.max(log.startDate.getTime(), start));
  if (log.endDate) {
    view.endDate = new Date(Math.min(log.endDate.getTime(), end));
  } else if (now.getTime() >= end) {
    view.endDate = new Date(end);
    view.status = STATUS.FINISHED;
  }
  if (log.endDate?.getTime() >= end && now.getTime() >= end) {
    view.status = STATUS.FINISHED;
  }

  if (partial) {
    recalculate(view, samples);
  }
  view.history = samples
    .filter((entry) => trip.locationEnabled || hasBatteryData(entry))
    .map((entry) => sharedSync(entry, trip.locationEnabled));
  return view;
}
