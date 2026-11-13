import { Sync } from '../../logs/schemas/sync.schema';

// Explicit fields keep future telemetry additions private by default.
const BATTERY_DATA_FIELDS: ReadonlyArray<keyof Sync> = [
  'timestamp',
  'charging',
  'socDisplay',
  'socBMS',
  'soh',
  'slowChargePort',
  'normalChargePort',
  'rapidChargePort',
  'auxBatteryVoltage',
  'dcBatteryVoltage',
  'dcBatteryCurrent',
  'dcBatteryPower',
  'cec',
  'ced',
  'batteryMinTemperature',
  'batteryMaxTemperature',
  'batteryInletTemperature',
  'outsideTemperature',
];

export function hasBatteryData(data: Sync): boolean {
  return BATTERY_DATA_FIELDS.some(
    (field) => field !== 'timestamp' && data[field] != null,
  );
}

export function sharedSync(
  data: Sync,
  locationEnabled: boolean,
): Partial<Sync> {
  if (locationEnabled) {
    return { ...data };
  }

  const result: Partial<Sync> = {};
  for (const field of BATTERY_DATA_FIELDS) {
    if (data[field] !== undefined) {
      Object.assign(result, { [field]: data[field] });
    }
  }
  return result;
}
