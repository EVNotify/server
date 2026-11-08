import { INestApplication, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'crypto';
import { Connection, createConnection, Model, Types } from 'mongoose';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io, Socket } from 'socket.io-client';
import { Account, AccountSchema } from '../account/schemas/account.schema';
import { Log } from '../logs/schemas/log.schema';
import { Sync } from '../logs/schemas/sync.schema';
import { PremiumService } from '../premium/premium.service';
import { Subscription } from '../premium/schemas/subscription.schema';
import { Voucher } from '../premium/schemas/voucher.schema';
import { TripType } from './entitites/trip-type.entity';
import { TripNotifyHandler } from './handler/tripnotify.handler';
import { Trip, TripSchema } from './schemas/trip.schema';
import { TripNotifyGateway } from './tripnotify.gateway';
import { TripNotifyService } from './tripnotify.service';

describe('TripNotify socket privacy', () => {
  const start = new Date('2030-01-01T12:00:00.000Z');
  const during = new Date('2030-01-01T12:30:00.000Z');
  const end = new Date('2030-01-01T13:00:00.000Z');
  const owner = 'abcdef';
  const otherOwner = 'fedcba';
  const logId = new Types.ObjectId();
  const modes = [
    { code: 'expire', accessibleAfterEnd: false },
    { code: 'retain', accessibleAfterEnd: true },
  ];
  let app: INestApplication;
  let connection: Connection;
  let trips: Model<Trip>;
  let accounts: Model<Account>;
  let service: TripNotifyService;
  let handler: TripNotifyHandler;
  let server: Server;
  let url: string;
  let clients: Socket[] = [];
  let barrierId = 0;

  function freezeAt(time: Date) {
    // Keep MongoDB, Socket.IO, and test timeout timers real.
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

  async function connect(auth: Record<string, unknown> = { code: 'expire' }) {
    const client = io(url, {
      auth,
      autoConnect: false,
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
      timeout: 2000,
    });
    clients.push(client);
    await new Promise<void>((resolve, reject) => {
      client.once('connect', () => resolve());
      client.once('connect_error', reject);
      client.connect();
    });
    return client;
  }

  function watchUpdates(client: Socket) {
    const updates: {
      event: string;
      payload: { logId: string; data: Record<string, unknown> };
    }[] = [];
    // Observe every event rather than trusting the normal client's event filter.
    client.onAny((event, payload) => {
      if (event.startsWith('route-update:')) {
        updates.push({ event, payload });
      }
    });
    return updates;
  }

  async function flush(...sockets: Socket[]) {
    // Ordered packets provide a barrier for negative assertions without sleeps.
    const event = `test:barrier:${barrierId++}`;
    const received = Promise.all(
      sockets.map(
        (socket) => new Promise<void>((resolve) => socket.once(event, resolve)),
      ),
    );
    server.emit(event);
    await received;
  }

  function sync(): Sync {
    return {
      timestamp: new Date().toISOString(),
      socDisplay: 80,
      dcBatteryPower: 12,
      charging: true,
      latitude: 52.5,
      longitude: 13.4,
      altitude: 50,
      accuracy: 5,
      speed: 40,
      odo: 10000,
    } as Sync;
  }

  async function publish(data = sync(), akey = owner) {
    await handler.handleSyncEvent({
      log: { _id: logId, akey } as Log,
      sync: data,
    });
  }

  beforeAll(async () => {
    await ConfigModule.forRoot();
    connection = await createConnection(process.env.DATABASE_URI).asPromise();
    const prefix = `tripnotify_socket_${randomBytes(6).toString('hex')}`;
    trips = connection.model(Trip.name, TripSchema, `${prefix}_trips`);
    accounts = connection.model(
      Account.name,
      AccountSchema,
      `${prefix}_accounts`,
    );
    const premium = new PremiumService(
      accounts,
      {} as Model<Voucher>,
      {} as Model<Subscription>,
    );
    const module = await Test.createTestingModule({
      providers: [
        TripNotifyGateway,
        TripNotifyHandler,
        TripNotifyService,
        { provide: getModelToken(Trip.name), useValue: trips },
        { provide: PremiumService, useValue: premium },
      ],
    }).compile();
    service = module.get(TripNotifyService);
    handler = module.get(TripNotifyHandler);
    const initialized = jest.spyOn(module.get(TripNotifyGateway), 'afterInit');
    app = module.createNestApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    server = initialized.mock.calls[0][0];
    initialized.mockRestore();
    url = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
  });

  beforeEach(async () => {
    freezeAt(during);
    await accounts.create(
      [owner, otherOwner].map((akey, index) => ({
        akey,
        passwordHash: 'unused',
        token: String(index).repeat(20),
        premiumUntil: new Date(end.getTime() + 86400000),
      })),
    );
    await trips.create([
      ...modes.map((mode) => ({
        ...mode,
        akey: owner,
        startDate: start,
        endDate: end,
        locationEnabled: true,
        type: TripType.CHARGE_AND_DRIVE,
      })),
      {
        code: 'other1',
        akey: otherOwner,
        startDate: start,
        endDate: end,
        accessibleAfterEnd: false,
        locationEnabled: true,
        type: TripType.CHARGE_AND_DRIVE,
      },
    ]);
  });

  afterEach(async () => {
    clients.forEach((client) => client.disconnect());
    clients = [];
    jest.useRealTimers();
    jest.restoreAllMocks();
    await Promise.all([trips.deleteMany({}), accounts.deleteMany({})]);
  });

  afterAll(async () => {
    await app?.close();
    if (connection) {
      try {
        await Promise.all(
          [trips, accounts]
            .filter(Boolean)
            .map((model) => model.collection.drop()),
        );
      } finally {
        await connection.close();
      }
    }
  });

  it.each([
    {},
    { code: undefined },
    { code: null },
    { code: 123456 },
    { code: { $ne: null } },
    { code: ['expire'] },
    { code: 'toolong' },
    { code: '!!!!!!' },
    { code: 'absent' },
  ])('rejects missing, malformed, or unknown auth: %j', async (auth) => {
    await expect(connect(auth)).rejects.toThrow('Unauthorized');
    expect(clients[0].connected).toBe(false);
  });

  describe.each(modes)(
    '$code authorization',
    ({ code, accessibleAfterEnd }) => {
      it('rejects connections before the start', async () => {
        freezeAt(new Date(start.getTime() - 1));
        await expect(connect({ code })).rejects.toThrow('Unauthorized');
      });

      it.each([start, during])('accepts connections at %s', async (time) => {
        freezeAt(time);
        expect((await connect({ code })).connected).toBe(true);
      });

      it.each([end, new Date(end.getTime() + 1)])(
        'enforces historical-access settings at %s',
        async (time) => {
          freezeAt(time);
          if (accessibleAfterEnd) {
            expect((await connect({ code })).connected).toBe(true);
          } else {
            await expect(connect({ code })).rejects.toThrow('Unauthorized');
          }
        },
      );

      it.each([null, during, new Date(during.getTime() - 1)])(
        'rejects connections without active Premium: %s',
        async (premiumUntil) => {
          await accounts.updateOne({ akey: owner }, { premiumUntil });
          await expect(connect({ code })).rejects.toThrow('Unauthorized');
        },
      );

      it.each([null, during, new Date(during.getTime() - 1)])(
        'stops existing connections when Premium becomes %s',
        async (premiumUntil) => {
          const client = await connect({ code });
          const updates = watchUpdates(client);
          await accounts.updateOne({ akey: owner }, { premiumUntil });
          await publish();
          await flush(client);
          expect(updates).toEqual([]);
        },
      );

      it('stops delivery after deletion', async () => {
        const client = await connect({ code });
        const updates = watchUpdates(client);
        await trips.deleteOne({ code });
        await publish();
        await flush(client);
        expect(updates).toEqual([]);
      });

      it.each([end, new Date(end.getTime() + 1)])(
        'stops existing connections at %s',
        async (time) => {
          const client = await connect({ code });
          const updates = watchUpdates(client);
          freezeAt(time);
          await publish();
          await flush(client);
          expect(updates).toEqual([]);
        },
      );
    },
  );

  it('isolates shares and accounts, including catch-all listeners', async () => {
    const first = await connect();
    const second = await connect();
    const differentShare = await connect({ code: 'retain' });
    const differentAccount = await connect({ code: 'other1' });
    const observed = [first, second, differentShare, differentAccount].map(
      watchUpdates,
    );
    const data = sync();
    await trips.updateOne({ code: 'retain' }, { locationEnabled: false });
    await publish(data);
    await flush(first, second, differentShare, differentAccount);

    const expected = {
      event: 'route-update:expire',
      payload: { logId: logId.toString(), data },
    };
    expect(observed[0]).toEqual([expected]);
    expect(observed[1]).toEqual([expected]);
    expect(observed[2]).toHaveLength(1);
    expect(observed[2][0].event).toBe('route-update:retain');
    expect(observed[2][0].payload.data).not.toHaveProperty('latitude');
    expect(observed[3]).toEqual([]);

    await publish(data, otherOwner);
    await flush(first, second, differentShare, differentAccount);
    expect(observed[0]).toHaveLength(1);
    expect(observed[1]).toHaveLength(1);
    expect(observed[2]).toHaveLength(1);
    expect(observed[3]).toEqual([
      { ...expected, event: 'route-update:other1' },
    ]);
  });

  it('filters mixed telemetry without mutating the input or another share', async () => {
    const client = await connect();
    const updates = watchUpdates(client);
    await trips.updateOne({ code: 'expire' }, { locationEnabled: false });
    const data = Object.freeze({
      ...sync(),
      socBMS: 79,
      soh: 98,
      slowChargePort: false,
      normalChargePort: true,
      rapidChargePort: false,
      auxBatteryVoltage: 12,
      dcBatteryVoltage: 400,
      dcBatteryCurrent: 30,
      cec: 100,
      ced: 90,
      batteryMinTemperature: 20,
      batteryMaxTemperature: 25,
      batteryInletTemperature: 18,
      outsideTemperature: 15,
      futureSensitiveField: 'must not be forwarded',
    });
    await publish(data);
    await flush(client);

    const {
      latitude,
      longitude,
      altitude,
      accuracy,
      speed,
      odo,
      futureSensitiveField,
      ...batteryData
    } = data;
    expect(updates).toEqual([
      {
        event: 'route-update:expire',
        payload: { logId: logId.toString(), data: batteryData },
      },
    ]);
    expect(data).toMatchObject({
      latitude,
      longitude,
      altitude,
      accuracy,
      speed,
      odo,
      futureSensitiveField,
    });
  });

  it('applies location permission changes to existing connections', async () => {
    const client = await connect();
    const updates = watchUpdates(client);
    const data = sync();
    await publish(data);
    await flush(client);
    expect(updates[0].payload.data.latitude).toBe(data.latitude);

    await trips.updateOne({ code: 'expire' }, { locationEnabled: false });
    await publish(data);
    await flush(client);
    expect(updates[1].payload.data).not.toHaveProperty('latitude');

    await trips.updateOne({ code: 'expire' }, { locationEnabled: true });
    await publish(data);
    await flush(client);
    expect(updates[2].payload.data.latitude).toBe(data.latitude);
  });

  it('starts live delivery exactly at the start', async () => {
    freezeAt(start);
    const client = await connect();
    const updates = watchUpdates(client);
    await publish();
    await flush(client);
    expect(updates).toHaveLength(1);
  });

  it('rechecks deletion after active trips have been discovered', async () => {
    const client = await connect();
    const updates = watchUpdates(client);
    const findActives = service.findActives.bind(service);
    jest.spyOn(service, 'findActives').mockImplementationOnce(async (akey) => {
      const found = await findActives(akey);
      await trips.deleteOne({ code: 'expire' });
      return found;
    });
    await publish();
    await flush(client);
    expect(updates).toEqual([]);
  });

  it('uses current location permissions rather than the discovered trip snapshot', async () => {
    const client = await connect();
    const updates = watchUpdates(client);
    const findActives = service.findActives.bind(service);
    jest.spyOn(service, 'findActives').mockImplementationOnce(async (akey) => {
      const found = await findActives(akey);
      await trips.updateOne({ code: 'expire' }, { locationEnabled: false });
      return found;
    });
    await publish();
    await flush(client);
    expect(updates).toHaveLength(1);
    expect(updates[0].payload.data).not.toHaveProperty('latitude');
  });

  it('rechecks the time after the authorization query completes', async () => {
    const client = await connect({ code: 'retain' });
    const updates = watchUpdates(client);
    const findAccessible = service.findAccessibleByCode.bind(service);
    jest
      .spyOn(service, 'findAccessibleByCode')
      .mockImplementation(async (code) => {
        const trip = await findAccessible(code);
        freezeAt(end);
        return trip;
      });
    await publish();
    await flush(client);
    expect(updates).toEqual([]);
  });

  it('rejects connections when the authorization database is unavailable', async () => {
    const warning = jest.spyOn(Logger.prototype, 'warn');
    jest
      .spyOn(trips, 'findOne')
      .mockRejectedValueOnce(new Error('private error'));
    await expect(connect()).rejects.toThrow(/^Unauthorized$/);
    expect(warning).toHaveBeenCalledWith(
      'TripNotify socket authorization failed',
    );
    expect(JSON.stringify(warning.mock.calls)).not.toContain('private error');
  });

  it('suppresses updates when the authorization database is unavailable', async () => {
    const client = await connect();
    const updates = watchUpdates(client);
    jest.spyOn(trips, 'findOne').mockRejectedValue(new Error('private error'));
    await publish();
    await flush(client);
    expect(updates).toEqual([]);
  });

  it('suppresses updates when the initial trip lookup fails', async () => {
    const client = await connect();
    const updates = watchUpdates(client);
    jest
      .spyOn(service, 'findActives')
      .mockRejectedValueOnce(new Error('private error'));
    await publish();
    await flush(client);
    expect(updates).toEqual([]);
  });
});
