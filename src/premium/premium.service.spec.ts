import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { PremiumService } from './premium.service';
import { PremiumModule } from './premium.module';

describe('PremiumService', () => {
  let service: PremiumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PremiumModule,
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.DATABASE_URI),
      ],
    }).compile();

    service = module.get<PremiumService>(PremiumService);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
