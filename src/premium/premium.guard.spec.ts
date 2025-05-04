import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PremiumGuard } from './premium.guard';
import { PremiumService } from './premium.service';
import { PremiumRequiredException } from './exceptions/premium-required.exception';
import { PREMIUM_ROLE_NAME } from './decorators/premium.decorator';

describe('PremiumGuard', () => {
  let guard: PremiumGuard;
  let reflector: Reflector;
  let premiumService: PremiumService;

  const mockReflector = {
    get: jest.fn(),
  };

  const mockPremiumService = {
    getExpiryDate: jest.fn(),
  };

  const createMockContext = (akey?: string): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({
        params: akey ? { akey } : {},
      }),
    }),
    getHandler: () => ({}),
  } as unknown as ExecutionContext);

  beforeEach(() => {
    reflector = mockReflector as unknown as Reflector;
    premiumService = mockPremiumService as unknown as PremiumService;
    guard = new PremiumGuard(reflector, premiumService);
    jest.clearAllMocks();
  });

  it('should allow access if no role is required', async () => {
    mockReflector.get.mockReturnValue(undefined);
    const context = createMockContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow access if role is not PREMIUM', async () => {
    mockReflector.get.mockReturnValue('user');
    const context = createMockContext();
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should throw ForbiddenException if akey is missing', async () => {
    mockReflector.get.mockReturnValue(PREMIUM_ROLE_NAME);
    const context = createMockContext();
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw PremiumRequiredException if expiryDate is null', async () => {
    mockReflector.get.mockReturnValue(PREMIUM_ROLE_NAME);
    mockPremiumService.getExpiryDate.mockResolvedValue(null);
    const context = createMockContext('test-key');

    await expect(guard.canActivate(context)).rejects.toThrow(PremiumRequiredException);
    expect(mockPremiumService.getExpiryDate).toHaveBeenCalledWith('test-key');
  });

  it('should allow access if expiryDate is valid', async () => {
    mockReflector.get.mockReturnValue(PREMIUM_ROLE_NAME);
    mockPremiumService.getExpiryDate.mockResolvedValue(new Date());
    const context = createMockContext('valid-key');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(mockPremiumService.getExpiryDate).toHaveBeenCalledWith('valid-key');
  });
});
