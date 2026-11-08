import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'crypto';
import { Connection, createConnection, Model } from 'mongoose';
import * as request from 'supertest';
import { AccountService } from '../account/account.service';
import { Account, AccountSchema } from '../account/schemas/account.schema';
import { HISTORY_TYPE } from '../logs/entities/history-type.entity';
import { STATUS } from '../logs/entities/status.entity';
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
        // The real AuthGuard bypasses owner authentication for @Guest routes.
        { provide: AccountService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
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
        HISTORY_TYPE.BATTERY_DATA,
      );
      expect(response.body.logs).toHaveLength(1);
      expect(response.body.logs[0].history).toEqual([
        { ...batteryEntry, timestamp: during.toISOString() },
      ]);
    },
  );

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
