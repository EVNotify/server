import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { LogsModule } from './logs.module';
import { LogsService } from './logs.service';

describe('LogsService', () => {
  let service: LogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        LogsModule,
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.DATABASE_URI),
        EventEmitterModule.forRoot(),
      ],
    }).compile();

    service = module.get<LogsService>(LogsService);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
