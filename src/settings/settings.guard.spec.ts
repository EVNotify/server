import { BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SettingsGuard } from './settings.guard';
import { ExecutionContext } from '@nestjs/common';
import { FIELD_TYPE_SETTINGS } from './decorators/settings-field.decorator';

jest.mock('@nestjs/core');

describe('SettingsGuard', () => {
  let guard: SettingsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new SettingsGuard(reflector);
  });

  const createMockContext = (handler: any, req: any): ExecutionContext =>
    ({
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any as ExecutionContext);

  it('should not be able to proceed if no settings field given', async () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue(FIELD_TYPE_SETTINGS);

    const req = { body: {} };
    const context = createMockContext(() => {}, req);

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should not be able to proceed if invalid setting field given', async () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue(FIELD_TYPE_SETTINGS);

    const req = { body: { foo: 'bar' } };
    const context = createMockContext(() => {}, req);

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should be able to proceed with valid setting url param field', async () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue(FIELD_TYPE_SETTINGS);

    const req = { params: { field: 'email' } };
    const context = createMockContext(() => {}, req);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should be able to proceed with valid setting body field', async () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue(FIELD_TYPE_SETTINGS);

    const req = { body: { email: 'test@example.com' } };
    const context = createMockContext(() => {}, req);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should not be able to proceed with setting body field containing an invalid value', async () => {
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue(FIELD_TYPE_SETTINGS);

    const req = { body: { email: 'invalid' } };
    const context = createMockContext(() => {}, req);

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should allow non-settings fieldType', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue('not-settings');

    const req = { body: {} };
    const context = createMockContext(() => {}, req);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
