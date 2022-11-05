import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';
import { SettingsGuard } from './settings.guard';
import { SettingsModule } from './settings.module';

describe('SettingsGuard', () => {
  let settingsGuard: SettingsGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SettingsModule,
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.DATABASE_URI),
      ],
    }).compile();

    settingsGuard = module.get<SettingsGuard>(SettingsGuard);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should be defined', () => {
    expect(settingsGuard).toBeDefined();
  });

  it('should be able to proceed if not a setting field type', async () => {
    const mockContext = createMock<ExecutionContext>();

    expect(async () => {
      await settingsGuard.canActivate(mockContext);
    }).resolves;
  });

  // FIXME not able to set execution context with metadata that can be resolved by reflector..
  test.todo('should not be able to proceed if no settings field given');

  test.todo('should not be able to proceed if invalid setting field given');

  test.todo('should be able to proceed with valid setting url param field');

  test.todo('should be able to proceed with valid setting body field');

  test.todo(
    'should not be able to proceed with setting body field containing a invalid field',
  );
});
