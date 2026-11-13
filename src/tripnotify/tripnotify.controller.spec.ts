import { ClassSerializerInterceptor, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'crypto';
import { Connection, createConnection, Model } from 'mongoose';
import * as request from 'supertest';
import { AccountService } from '../account/account.service';
import { Account, AccountSchema } from '../account/schemas/account.schema';
import { HISTORY_TYPE } from '../logs/entities/history-type.entity';
import { STATUS } from '../logs/entities/status.entity';
import { TYPE } from '../logs/entities/type.entity';
import { LogsService } from '../logs/logs.service';
import { LastSync } from '../logs/schemas/last-sync.schema';
import { Log, LogSchema } from '../logs/schemas/log.schema';
import { PremiumService } from '../premium/premium.service';
import { Subscription } from '../premium/schemas/subscription.schema';
import { Voucher } from '../premium/schemas/voucher.schema';
import { TripType } from './entitites/trip-type.entity';
import { TripNotStartedException } from './exceptions/trip-not-started.exception';
import { Trip, TripSchema } from './schemas/trip.schema';
import { TripNotifyController } from './tripnotify.controller';
import { TripNotifyService } from './tripnotify.service';

describe('TripNotify guest access', () => {
  const start = new Date('2030-01-01T12:00:00.000Z');
  const end = new Date('2030-01-01T13:00:00.000Z');
  const during = new Date('2030-01-01T12:30:00.000Z');
  const owner = 'abcdef';
  const batteryEntry = { timestamp: during, socDisplay: 80 };
  const locationEntry = { timestamp: during, latitude: 52.5, longitude: 13.4 };
  const sharingModes = [
    { code: 'expire', accessibleAfterEnd: false },
    { code: 'retain', accessibleAfterEnd: true },
  ];
  const boundaries = [
    { name: 'before start', time: new Date(start.getTime() - 1), status: 403 },
    { name: 'exactly at start', time: start, status: 200 },
    { name: 'during the trip', time: during, status: 200 },
    { name: 'exactly at end', time: end, status: 404 },
    { name: 'after end', time: new Date(end.getTime() + 1), status: 404 },
  ];

  let app: INestApplication;
  let connection: Connection;
  let trips: Model<Trip>;
  let accounts: Model<Account>;
  let logs: Model<Log>;
  let service: TripNotifyService;
  let logsService: LogsService;

  function freezeAt(time: Date) {
    // Keep MongoDB and HTTP timers real; control only the application clock.
    jest.useFakeTimers({
      now: time,
      doNotFake: [
        'hrtime',
        'nextTick',
        'performance',
        'queueMicrotask',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
    });
  }

  beforeAll(async () => {
    await ConfigModule.forRoot();
    connection = await createConnection(process.env.DATABASE_URI).asPromise();
    const prefix = `tripnotify_guest_${randomBytes(6).toString('hex')}`;
    trips = connection.model(Trip.name, TripSchema, `${prefix}_trips`);
    accounts = connection.model(
      Account.name,
      AccountSchema,
      `${prefix}_accounts`,
    );
    logs = connection.model(Log.name, LogSchema, `${prefix}_logs`);

    // Only getExpiryDate is used, so purchase/voucher models need no behavior.
    const premiumService = new PremiumService(
      accounts,
      {} as Model<Voucher>,
      {} as Model<Subscription>,
    );
    service = new TripNotifyService(trips, premiumService);
    logsService = new LogsService(
      logs,
      {} as Model<LastSync>,
      premiumService,
      new EventEmitter2(),
    );
    const module = await Test.createTestingModule({
      controllers: [TripNotifyController],
      providers: [
        { provide: TripNotifyService, useValue: service },
        { provide: LogsService, useValue: logsService },
        { provide: PremiumService, useValue: premiumService },
        {
          provide: AccountService,
          useValue: {
            async loginWithToken(akey, dto) {
              if (!(await accounts.exists({ akey, token: dto.token }))) {
                throw new Error('Unauthorized');
              }
            },
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalInterceptors(new ClassSerializerInterceptor(new Reflector()));
    await app.init();
  });

  beforeEach(async () => {
    await accounts.create({
      akey: owner,
      passwordHash: 'unused',
      token: '0'.repeat(20),
      premiumUntil: new Date(end.getTime() + 86400000),
    });
    await trips.create(
      sharingModes.map((mode) => ({
        ...mode,
        akey: owner,
        startDate: start,
        endDate: end,
        locationEnabled: true,
        type: TripType.CHARGE_AND_DRIVE,
      })),
    );
    await logs.create({
      akey: owner,
      startDate: start,
      endDate: end,
      status: STATUS.FINISHED,
      history: [batteryEntry, locationEntry],
    });
  });

  afterEach(async () => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    await Promise.all([
      trips.deleteMany({}),
      accounts.deleteMany({}),
      logs.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await app?.close();
    if (connection) {
      await Promise.all(
        [trips, accounts, logs]
          .filter(Boolean)
          .map((model) => model.collection.drop()),
      );
      await connection.close();
    }
  });

  describe.each(sharingModes)(
    'accessibleAfterEnd: $accessibleAfterEnd',
    ({ code, accessibleAfterEnd }) => {
      describe.each(['', '/info'])('GET /trips/:code%s', (suffix) => {
        it.each(boundaries)('$name', async ({ time, status }) => {
          freezeAt(time);
          const expectedStatus =
            accessibleAfterEnd && time >= end ? 200 : status;
          const response = await request(app.getHttpServer())
            .get(`/trips/${code}${suffix}`)
            .expect(expectedStatus);

          if (expectedStatus === 200) {
            if (suffix) {
              expect(response.body.logs).toHaveLength(1);
              expect(response.body.logs[0].history).toEqual([
                { ...batteryEntry, timestamp: during.toISOString() },
                { ...locationEntry, timestamp: during.toISOString() },
              ]);
            } else {
              expect(response.body).toMatchObject({
                code,
                start: start.toISOString(),
                end: end.toISOString(),
              });
            }
          } else {
            expect(response.body).not.toHaveProperty('logs');
            expect(response.body.message).toBe(
              expectedStatus === 404
                ? 'Trip does not exist'
                : new TripNotStartedException(start).message,
            );
          }
        });

        it.each([
          { name: 'missing', expiry: null },
          { name: 'expired', expiry: new Date(during.getTime() - 1) },
          { name: 'expiring exactly now', expiry: during },
        ])('rejects $name Premium', async ({ expiry }) => {
          await accounts.updateOne({ akey: owner }, { premiumUntil: expiry });
          freezeAt(during);

          const response = await request(app.getHttpServer())
            .get(`/trips/${code}${suffix}`)
            .expect(403);

          expect(response.body.message).toBe(
            'Trip owner does not have an active premium subscription.',
          );
          expect(response.body).not.toHaveProperty('logs');
        });
      });
    },
  );

  it.each(['', '/info'])(
    'rejects unknown codes on /trips/:code%s',
    async (suffix) => {
      freezeAt(during);
      const response = await request(app.getHttpServer())
        .get(`/trips/absent${suffix}`)
        .expect(404);

      expect(response.body.message).toBe('Trip does not exist');
    },
  );

  it.each([end, new Date(end.getTime() + 1)])(
    'does not read logs or history for an expired /info request at %s',
    async (time) => {
      const findLogs = jest.spyOn(logsService, 'findLogsWithinDateRange');
      const findHistory = jest.spyOn(logsService, 'findOneWithHistory');
      freezeAt(time);

      const response = await request(app.getHttpServer())
        .get('/trips/expire/info')
        .expect(404);

      expect(response.body).not.toHaveProperty('logs');
      expect(findLogs).not.toHaveBeenCalled();
      expect(findHistory).not.toHaveBeenCalled();
    },
  );

  it.each(sharingModes)(
    'excludes location history when locationEnabled is false for $code',
    async ({ code }) => {
      await trips.updateOne({ code }, { locationEnabled: false });
      const findHistory = jest.spyOn(logsService, 'findOneWithHistory');
      freezeAt(during);

      const response = await request(app.getHttpServer())
        .get(`/trips/${code}/info`)
        .expect(200);

      expect(findHistory).toHaveBeenCalledWith(
        owner,
        expect.any(String),
        HISTORY_TYPE.ALL,
      );
      expect(response.body.logs).toHaveLength(1);
      expect(response.body.logs[0].history).toEqual([
        { ...batteryEntry, timestamp: during.toISOString() },
      ]);
    },
  );

  describe('owner management list', () => {
    it('includes scheduled, active, and expired trips with either access setting', async () => {
      freezeAt(during);
      await accounts.updateOne({ akey: owner }, { premiumUntil: null });
      await trips.create([
        ...[false, true].flatMap((accessibleAfterEnd, index) => [
          {
            code: `old00${index}`,
            akey: owner,
            startDate: new Date(start.getTime() - 7200000),
            endDate: new Date(start.getTime() - 3600000),
            accessibleAfterEnd,
            locationEnabled: true,
            type: TripType.CHARGE_AND_DRIVE,
          },
          {
            code: `new00${index}`,
            akey: owner,
            startDate: new Date(end.getTime() + 3600000),
            endDate: new Date(end.getTime() + 7200000),
            accessibleAfterEnd,
            locationEnabled: true,
            type: TripType.CHARGE_AND_DRIVE,
          },
        ]),
        {
          code: 'other1',
          akey: 'fedcba',
          startDate: start,
          endDate: end,
          accessibleAfterEnd: true,
          locationEnabled: true,
          type: TripType.CHARGE_AND_DRIVE,
        },
      ]);
      const response = await request(app.getHttpServer())
        .get(`/trips/${owner}/list`)
        .set('Authorization', `${owner} ${'0'.repeat(20)}`)
        .expect(200);
      expect(response.body.map((trip) => trip.code).sort()).toEqual(
        ['expire', 'retain', 'old000', 'old001', 'new000', 'new001'].sort(),
      );
    });

    it('requires valid owner credentials', async () => {
      await request(app.getHttpServer())
        .get(`/trips/${owner}/list`)
        .expect(401);
      await request(app.getHttpServer())
        .get(`/trips/${owner}/list`)
        .set('Authorization', `${owner} ${'1'.repeat(20)}`)
        .expect(401);
    });

    it('rejects an authenticated request for another owner', async () => {
      await request(app.getHttpServer())
        .get('/trips/fedcba/list')
        .set('Authorization', `${owner} ${'0'.repeat(20)}`)
        .expect(403);
    });
  });

  describe('shared history windows', () => {
    it.each([STATUS.RUNNING, STATUS.FINISHED])(
      'includes delayed telemetry ingested after expiry in a %s log',
      async (status) => {
        await logs.deleteMany({});
        const uploadedAt = new Date(end.getTime() + 1000);
        freezeAt(uploadedAt);
        const samples = [
          { timestamp: new Date(start.getTime() - 1).toISOString(), cec: 0 },
          { timestamp: start.toISOString(), cec: 100 },
          { timestamp: during.toISOString(), cec: 110 },
          { timestamp: end.toISOString(), cec: 999 },
        ];
        for (const sample of samples) {
          await logsService.syncData(owner, {
            ...sample,
            charging: true,
            dcBatteryPower: -20,
          } as Parameters<LogsService['syncData']>[1]);
        }
        const log = await logs.findOne({ akey: owner });
        expect(log.startDate).toEqual(uploadedAt);
        if (status === STATUS.FINISHED) {
          await logs.updateOne(
            { _id: log._id },
            { status, endDate: uploadedAt },
          );
        }
        const before = await logs.findById(log._id).lean();

        const response = await request(app.getHttpServer())
          .get('/trips/retain/info')
          .expect(200);

        expect(response.body.logs).toHaveLength(1);
        expect(response.body.logs[0]).toMatchObject({
          id: log._id.toString(),
          status: STATUS.FINISHED,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          rechargedKWh: 10,
          averageKW: -20,
          history: samples.slice(1, 3).map((sample) => ({
            ...sample,
            charging: true,
            dcBatteryPower: -20,
          })),
        });
        expect(response.body.metadata.rechargedEnergy).toBe(10);
        expect(await logs.findById(log._id).lean()).toEqual(before);
        await request(app.getHttpServer())
          .get('/trips/expire/info')
          .expect(404);
      },
    );

    it('uses sample dates instead of recorded session bounds and ignores malformed histories', async () => {
      freezeAt(during);
      await logs.deleteMany({});
      const log = await logs.create({
        akey: owner,
        startDate: new Date(start.getTime() - 120000),
        endDate: new Date(start.getTime() - 60000),
        status: STATUS.FINISHED,
        history: [
          { timestamp: '2030-01-01T13:00:00+01:00', socDisplay: 80 },
          { timestamp: during, socDisplay: 70 },
          { timestamp: 'invalid' },
          { timestamp: null },
          {},
        ],
      });
      const unrelated = {
        akey: owner,
        startDate: start,
        endDate: end,
        status: STATUS.FINISHED,
      };
      await logs.collection.insertMany([
        { ...unrelated, history: null },
        { ...unrelated },
        { ...unrelated, history: [] },
        { ...unrelated, history: [null, {}, { timestamp: 'invalid' }] },
        {
          ...unrelated,
          history: [
            { timestamp: new Date(start.getTime() - 1) },
            { timestamp: end },
          ],
        },
        { ...unrelated, akey: 'fedcba', history: [batteryEntry] },
      ]);
      const before = await logs.findById(log._id).lean();

      const response = await request(app.getHttpServer())
        .get('/trips/expire/info')
        .expect(200);

      expect(response.body.logs).toHaveLength(1);
      expect(response.body.logs[0]).toMatchObject({
        id: log._id.toString(),
        startDate: start.toISOString(),
        endDate: during.toISOString(),
        startSOC: 80,
        endSOC: 70,
        history: [
          { timestamp: '2030-01-01T13:00:00+01:00', socDisplay: 80 },
          { timestamp: during.toISOString(), socDisplay: 70 },
        ],
      });
      expect(await logs.findById(log._id).lean()).toEqual(before);
    });

    it.each([
      {
        name: 'starts before the share',
        from: -60000,
        to: 1800000,
        status: STATUS.FINISHED,
      },
      {
        name: 'ends after the share',
        from: 60000,
        to: 3660000,
        status: STATUS.FINISHED,
      },
      {
        name: 'spans the share',
        from: -60000,
        to: 3660000,
        status: STATUS.FINISHED,
      },
      {
        name: 'is still running from before the share',
        from: -60000,
        to: null,
        status: STATUS.RUNNING,
      },
    ])(
      'includes a log that $name without exposing outside samples',
      async ({ from, to, status }) => {
        freezeAt(new Date(end.getTime() + 1000));
        const logStart = new Date(start.getTime() + from);
        const logEnd = to == null ? null : new Date(start.getTime() + to);
        const first = new Date(
          Math.max(logStart.getTime(), start.getTime()) + 1000,
        );
        const last = new Date(
          Math.min(logEnd?.getTime() ?? end.getTime(), end.getTime()) - 1000,
        );
        const samples = [first, last].map((timestamp) => ({
          timestamp,
          socDisplay: 80,
        }));
        if (from < 0) samples.unshift({ timestamp: logStart, socDisplay: 90 });
        if (to == null || logEnd >= end)
          samples.push({ timestamp: end, socDisplay: 70 });
        const log = await logs.create({
          akey: owner,
          startDate: logStart,
          endDate: logEnd,
          status,
          history: samples,
        });
        const before = await logs.findById(log._id).lean();
        const response = await request(app.getHttpServer())
          .get('/trips/retain/info')
          .expect(200);
        const shared = response.body.logs.find(
          (entry) => entry.id === log._id.toString(),
        );
        expect(shared.history.map((entry) => entry.timestamp)).toEqual(
          [first, last].map((time) => time.toISOString()),
        );
        expect(shared.startDate).toBe(
          new Date(Math.max(logStart.getTime(), start.getTime())).toISOString(),
        );
        expect(shared.endDate).toBe(
          new Date(
            Math.min(logEnd?.getTime() ?? end.getTime(), end.getTime()),
          ).toISOString(),
        );
        expect(shared.status).toBe(STATUS.FINISHED);
        expect(await logs.findById(log._id).lean()).toEqual(before);
      },
    );

    it('handles exact boundaries and excludes unrelated or empty histories', async () => {
      freezeAt(during);
      await logs.deleteMany({});
      const touching = await logs.create({
        akey: owner,
        startDate: new Date(start.getTime() - 60000),
        endDate: start,
        status: STATUS.FINISHED,
        history: [{ timestamp: start, socDisplay: 80 }],
      });
      await logs.create([
        {
          akey: owner,
          startDate: end,
          endDate: new Date(end.getTime() + 60000),
          status: STATUS.FINISHED,
          history: [{ timestamp: end, socDisplay: 80 }],
        },
        {
          akey: owner,
          startDate: new Date(start.getTime() - 60000),
          endDate: new Date(start.getTime() - 1),
          status: STATUS.FINISHED,
          history: [{ timestamp: new Date(start.getTime() - 1) }],
        },
        {
          akey: owner,
          startDate: new Date(start.getTime() - 60000),
          endDate: new Date(end.getTime() + 60000),
          status: STATUS.FINISHED,
          history: [{ timestamp: 'invalid' }, { timestamp: end }],
        },
        {
          akey: 'fedcba',
          startDate: start,
          endDate: end,
          status: STATUS.FINISHED,
          history: [batteryEntry],
        },
      ]);
      const response = await request(app.getHttpServer())
        .get('/trips/expire/info')
        .expect(200);
      expect(response.body.logs.map((entry) => entry.id)).toEqual([
        touching._id.toString(),
      ]);
      expect(response.body.logs[0].history[0].timestamp).toBe(
        start.toISOString(),
      );
    });

    it('returns windowed totals rather than stored whole-session totals', async () => {
      freezeAt(during);
      await logs.deleteMany({});
      const log = await logs.create({
        akey: owner,
        startDate: new Date(start.getTime() - 60000),
        endDate: new Date(end.getTime() + 60000),
        status: STATUS.FINISHED,
        type: TYPE.CHARGE,
        rechargedKWh: 999,
        dischargedKWh: 999,
        averageKW: 999,
        history: [
          { timestamp: new Date(start.getTime() - 1), cec: 0, ced: 0 },
          { timestamp: start, cec: 110, ced: 50, dcBatteryPower: -10 },
          { timestamp: during, cec: 115, ced: 51, dcBatteryPower: -30 },
          { timestamp: end, cec: 999, ced: 999, dcBatteryPower: -999 },
        ],
      });
      const response = await request(app.getHttpServer())
        .get('/trips/expire/info')
        .expect(200);
      expect(response.body.logs[0]).toMatchObject({
        rechargedKWh: 5,
        dischargedKWh: 1,
        averageKW: -20,
      });
      expect(response.body.metadata).toMatchObject({
        rechargedEnergy: 5,
        consumedEnergy: 1,
        avgChargeSpeed: 20,
      });
      expect((await logs.findById(log._id)).rechargedKWh).toBe(999);

      await logs.create({
        akey: owner,
        startDate: new Date(start.getTime() - 60000),
        endDate: end,
        status: STATUS.FINISHED,
        type: TYPE.CHARGE,
        rechargedKWh: 999,
        history: [batteryEntry],
      });
      const incomplete = await request(app.getHttpServer())
        .get('/trips/expire/info')
        .expect(200);
      expect(incomplete.body.metadata).not.toHaveProperty('rechargedEnergy');
      expect(incomplete.body.metadata).not.toHaveProperty('avgChargeSpeed');
    });

    it('strips spatial fields from mixed battery/location records', async () => {
      freezeAt(during);
      await trips.updateOne({ code: 'expire' }, { locationEnabled: false });
      await logs.updateMany(
        {},
        {
          history: [
            {
              ...batteryEntry,
              latitude: 52.5,
              longitude: 13.4,
              altitude: 20,
              accuracy: 5,
              speed: 30,
              odo: 1000,
              futureSensitiveField: 'private',
            },
          ],
        },
      );
      const response = await request(app.getHttpServer())
        .get('/trips/expire/info')
        .expect(200);
      expect(response.body.logs[0].history).toEqual([
        { ...batteryEntry, timestamp: during.toISOString() },
      ]);
    });
  });

  it('uses the captured time when a lookup crosses the trip start', async () => {
    freezeAt(new Date(start.getTime() - 1));
    const findOne = trips.findOne.bind(trips);
    const lookup = jest
      .spyOn(trips, 'findOne')
      .mockImplementationOnce((filter) => {
        jest.setSystemTime(start);
        return findOne(filter);
      });

    await expect(service.findAccessibleByCode('expire')).rejects.toBeInstanceOf(
      TripNotStartedException,
    );
    expect(lookup).toHaveBeenCalledWith(
      expect.objectContaining({
        $and: expect.arrayContaining([
          {
            $or: [
              { accessibleAfterEnd: true },
              {
                accessibleAfterEnd: false,
                endDate: { $gt: new Date(start.getTime() - 1) },
              },
            ],
          },
        ]),
      }),
    );
  });
});
