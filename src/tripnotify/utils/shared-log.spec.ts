import { Types } from 'mongoose';
import { STATUS } from '../../logs/entities/status.entity';
import { TYPE } from '../../logs/entities/type.entity';
import { Log } from '../../logs/schemas/log.schema';
import { Sync } from '../../logs/schemas/sync.schema';
import { TripInformationDto } from '../dto/trip-information.dto';
import { Trip } from '../schemas/trip.schema';
import { sharedLog } from './shared-log';
import { LogWithHistoryDto } from '../dto/log-with-history.dto';

describe('shared log projection', () => {
  const start = new Date('2030-01-01T12:00:00Z');
  const end = new Date('2030-01-01T13:00:00Z');
  const during = new Date('2030-01-01T12:30:00Z');
  const trip = {
    startDate: start,
    endDate: end,
    locationEnabled: true,
  } as Trip;
  function source(overrides: Partial<Log> = {}): Log {
    return {
      _id: new Types.ObjectId(),
      akey: 'abcdef',
      startDate: new Date('2030-01-01T11:00:00Z'),
      endDate: new Date('2030-01-01T14:00:00Z'),
      updatedAt: new Date('2030-01-01T14:00:00Z'),
      status: STATUS.FINISHED,
      type: TYPE.DRIVE,
      startSOC: 99,
      currentSOC: 99,
      endSOC: 99,
      startODO: 999,
      endODO: 999,
      startCEC: 999,
      endCEC: 999,
      startCED: 999,
      endCED: 999,
      rechargedKWh: 999,
      dischargedKWh: 999,
      distance: 999,
      averageKW: 999,
      averageSpeed: 999,
      history: [],
      ...overrides,
    } as Log;
  }
  function sample(timestamp: Date | string, fields: Partial<Sync> = {}): Sync {
    return {
      timestamp:
        typeof timestamp === 'string' ? timestamp : timestamp.toISOString(),
      ...fields,
    } as Sync;
  }

  it('sorts and clips samples, recalculates all measurements, and leaves the input unchanged', () => {
    const first = sample(start, {
      socDisplay: 0,
      socBMS: 99,
      cec: 110,
      ced: 510,
      odo: 100,
      dcBatteryPower: 0,
      speed: 0,
      latitude: 0,
      longitude: 0,
    });
    const middle = sample('2030-01-01T12:10:00Z', {
      socDisplay: 80,
      cec: 112,
      ced: 515,
      odo: 101,
      dcBatteryPower: -10,
      speed: 0,
      latitude: 0,
      longitude: 0,
    });
    const last = sample('2030-01-01T12:20:00Z', {
      socBMS: 75,
      cec: 115,
      ced: 520,
      odo: 102,
      dcBatteryPower: 10,
      speed: 20,
      latitude: 0,
      longitude: 0.01,
    });
    const history = [
      sample(end, { cec: 999 }),
      last,
      sample('invalid'),
      first,
      middle,
      sample('2030-01-01T11:59:59Z', { ced: 0 }),
    ];
    history.forEach(Object.freeze);
    Object.freeze(history);
    const log = Object.freeze(source({ history }));
    const view = sharedLog(log, history, trip, end);
    expect(view.history).toEqual([first, middle, last]);
    expect(view).toMatchObject({
      startDate: start,
      endDate: end,
      updatedAt: new Date(last.timestamp),
      startSOC: 0,
      currentSOC: 75,
      endSOC: 75,
      startODO: 100,
      endODO: 102,
      startCEC: 110,
      endCEC: 115,
      startCED: 510,
      endCED: 520,
      rechargedKWh: 5,
      dischargedKWh: 10,
      averageKW: 0,
      distance: 1.11,
    });
    expect(view.averageSpeed).toBeCloseTo(20 / 3);
    expect(log.rechargedKWh).toBe(999);
    expect(log.startDate).toEqual(new Date('2030-01-01T11:00:00Z'));
    expect(history[0].timestamp).toBe(end.toISOString());
  });

  it('preserves stored measurements for a fully contained session', () => {
    const history = [sample(during, { socDisplay: 80 })];
    const log = source({
      startDate: new Date(start.getTime() + 1000),
      endDate: new Date(end.getTime() - 1000),
      history,
    });
    expect(sharedLog(log, history, trip, end)).toMatchObject({
      rechargedKWh: 999,
      distance: 999,
      averageKW: 999,
    });
  });

  it.each([
    {
      startDate: new Date('2030-01-01T14:00:00Z'),
      endDate: new Date('2030-01-01T15:00:00Z'),
    },
    {
      startDate: new Date('2030-01-01T10:00:00Z'),
      endDate: new Date('2030-01-01T11:00:00Z'),
    },
  ])(
    'keeps shared dates consistent with sample times despite recorded dates %j',
    (dates) => {
      const first = new Date('2030-01-01T12:10:00Z');
      const last = new Date('2030-01-01T12:20:00Z');
      const history = [sample(first, { cec: 10 }), sample(last, { cec: 12 })];
      const log = Object.freeze(source(dates));
      const view = sharedLog(log, history, trip, end);

      expect(view.startDate.getTime()).toBeLessThanOrEqual(first.getTime());
      expect(view.startDate.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(view.endDate.getTime()).toBeGreaterThanOrEqual(last.getTime());
      expect(view.endDate.getTime()).toBeLessThanOrEqual(end.getTime());
      expect(view.rechargedKWh).toBe(2);
      expect(log.startDate).toEqual(dates.startDate);
      expect(log.endDate).toEqual(dates.endDate);
    },
  );

  it('does not turn insufficient data into zero or copy full-session values', () => {
    const view = sharedLog(
      source(),
      [sample(during, { socDisplay: 0, cec: 0, ced: 0 })],
      trip,
      end,
    );
    expect(view.startSOC).toBe(0);
    for (const field of [
      'averageKW',
      'averageSpeed',
      'distance',
      'rechargedKWh',
      'dischargedKWh',
      'startODO',
      'endODO',
    ]) {
      expect(view[field]).toBeUndefined();
    }
    expect(
      JSON.parse(JSON.stringify(new TripInformationDto([view]).metadata)),
    ).toEqual({});
  });

  it('keeps real zero measurements and zero deltas', () => {
    const history = [start, during].map((time) =>
      sample(time, { cec: 0, ced: 0, dcBatteryPower: 0, speed: 0 }),
    );
    const view = sharedLog(source(), history, trip, end);
    expect(view).toMatchObject({
      rechargedKWh: 0,
      dischargedKWh: 0,
      averageKW: 0,
      averageSpeed: 0,
    });
    expect(new TripInformationDto([view]).metadata).toMatchObject({
      rechargedEnergy: 0,
      consumedEnergy: 0,
      avgDriveSpeed: 0,
    });
    view.type = TYPE.CHARGE;
    expect(new TripInformationDto([view]).metadata.avgChargeSpeed).toBe(0);
  });

  it.each([
    [10, 5, 12],
    [-1, 5, 12],
  ])(
    'does not report energy across invalid/reset counters: %j',
    (...values: number[]) => {
      const history = values.map((cec, index) =>
        sample(new Date(start.getTime() + index * 1000), { cec }),
      );
      expect(
        sharedLog(source(), history, trip, end).rechargedKWh,
      ).toBeUndefined();
    },
  );

  it('needs distinct timestamps for a counter delta', () => {
    const history = [sample(start, { cec: 10 }), sample(start, { cec: 20 })];
    expect(
      sharedLog(source(), history, trip, end).rechargedKWh,
    ).toBeUndefined();
  });

  it('ignores nonfinite readings and invalid coordinates', () => {
    const history = [
      sample(start, { dcBatteryPower: NaN, latitude: 100, longitude: 0 }),
      sample(during, { dcBatteryPower: Infinity, latitude: 0, longitude: 0 }),
    ];
    const view = sharedLog(source(), history, trip, end);
    expect(view.averageKW).toBeUndefined();
    expect(view.distance).toBeUndefined();
  });

  it('omits legacy logs with missing or null histories and entries', () => {
    for (const history of [undefined, null, [], [null]]) {
      expect(sharedLog(source(), history, trip, end)).toBeNull();
    }
  });

  it('omits logs without any valid samples inside the window', () => {
    expect(
      sharedLog(
        source(),
        [sample('invalid'), sample(end), sample(new Date(start.getTime() - 1))],
        trip,
        end,
      ),
    ).toBeNull();
  });

  it('shows a running session as finished once the share ends', () => {
    const log = source({ endDate: null, status: STATUS.RUNNING });
    const history = [sample(during, { socDisplay: 80 })];
    expect(sharedLog(log, history, trip, during)).toMatchObject({
      status: STATUS.RUNNING,
      endDate: null,
    });
    expect(sharedLog(log, history, trip, end)).toMatchObject({
      status: STATUS.FINISHED,
      endDate: end,
    });
    expect(log.status).toBe(STATUS.RUNNING);
    expect(log.endDate).toBeNull();
  });

  it('sanitizes mixed telemetry and drops GPS-only history when location sharing is off', () => {
    const history = [
      sample(start, { latitude: 1, longitude: 2 }),
      sample(during, {
        socDisplay: 0,
        charging: false,
        latitude: 1,
        longitude: 2,
        altitude: 10,
        speed: 20,
        odo: 123,
      }),
    ];
    const view = sharedLog(
      source(),
      history,
      { ...trip, locationEnabled: false } as Trip,
      end,
    );
    expect(view.history).toEqual([
      sample(during, { socDisplay: 0, charging: false }),
    ]);
    expect(history[1].latitude).toBe(1);
  });

  it('does not silently exclude an unclassified session from averages', () => {
    const history = [sample(start, { dcBatteryPower: 10, speed: 20 })];
    const charge = sharedLog(source({ type: TYPE.CHARGE }), history, trip, end);
    const drive = sharedLog(source({ type: TYPE.DRIVE }), history, trip, end);
    const unknown = sharedLog(
      source({ type: TYPE.UNKNOWN }),
      [sample(start, { socDisplay: 80 })],
      trip,
      end,
    );
    const totals = new TripInformationDto([charge, drive, unknown]).metadata;
    expect(totals.avgChargeSpeed).toBeUndefined();
    expect(totals.avgDriveSpeed).toBeUndefined();
  });

  it.each([0, 60])(
    'classifies unknown sessions with zero power and speed %s as driving',
    (averageSpeed) => {
      const log = new LogWithHistoryDto(
        source({
          type: TYPE.UNKNOWN,
          averageKW: 0,
          averageSpeed,
        }),
      );
      const totals = new TripInformationDto([log]).metadata;
      expect(totals.avgDriveSpeed).toBe(averageSpeed);
      expect(totals.avgChargeSpeed).toBeUndefined();
    },
  );

  it.each([
    {
      type: TYPE.CHARGE,
      averageKW: 0,
      averageSpeed: 60,
      expected: { avgChargeSpeed: 0, avgDriveSpeed: undefined },
    },
    {
      type: TYPE.DRIVE,
      averageKW: 10,
      averageSpeed: 0,
      expected: { avgChargeSpeed: undefined, avgDriveSpeed: 0 },
    },
    {
      type: TYPE.UNKNOWN,
      averageKW: -10,
      averageSpeed: 60,
      expected: { avgChargeSpeed: 10, avgDriveSpeed: undefined },
    },
    {
      type: TYPE.UNKNOWN,
      averageKW: 0,
      averageSpeed: undefined,
      expected: { avgChargeSpeed: 0, avgDriveSpeed: undefined },
    },
  ])(
    'preserves classification of $type with power $averageKW and speed $averageSpeed',
    ({ expected, ...fields }) => {
      const log = new LogWithHistoryDto(source(fields));
      expect(new TripInformationDto([log]).metadata).toMatchObject(expected);
    },
  );

  it('does not present an incomplete sum or mean as a complete trip total', () => {
    const known = sharedLog(
      source({ type: TYPE.CHARGE }),
      [
        sample(start, { cec: 10, ced: 20, dcBatteryPower: 10 }),
        sample(during, { cec: 15, ced: 21, dcBatteryPower: 20 }),
      ],
      trip,
      end,
    );
    const unknown = sharedLog(
      source({ type: TYPE.CHARGE }),
      [sample(start, { ced: 30 }), sample(during, { ced: 31 })],
      trip,
      end,
    );
    const totals = new TripInformationDto([known, unknown]).metadata;
    expect(totals.consumedEnergy).toBe(2);
    expect(totals.rechargedEnergy).toBeUndefined();
    expect(totals.avgChargeSpeed).toBeUndefined();
  });
});
