import { Test, TestingModule } from "@nestjs/testing";
import { PremiumModule } from "./premium.module";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { PremiumService } from "./premium.service";
import { PremiumController } from "./premium.controller";
import { AccountDto } from "../account/dto/account.dto";
import { CreateAccountDto } from "../account/dto/create-account.dto";
import { AccountService } from "../account/account.service";
import mongoose from "mongoose";
import { PremiumStatusDto } from "./dto/premium-status.dto";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { PREMIUM_DURATION } from "./entities/premium-duration.entity";
import { randomBytes } from "crypto";
import { Voucher, VOUCHER_LENGTH } from "./schemas/voucher.schema";
import { PurchaseTokenInvalidException } from "./exceptions/purchase-token-invalid.exception";

describe('PremiumController', () => {
  let premiumService: PremiumService;
  let accountService: AccountService;
  let controller: PremiumController;
  let testAccount: AccountDto;

  async function createAccount() {
    const dto = new CreateAccountDto();

    dto.akey = accountService.akey();
    dto.password = 'password';

    return await accountService.create(dto);
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PremiumModule,
        ConfigModule.forRoot(),
        MongooseModule.forRoot(process.env.DATABASE_URI),
      ],
    }).compile();

    accountService = module.get<AccountService>(AccountService);
    premiumService = module.get<PremiumService>(PremiumService);
    controller = module.get<PremiumController>(PremiumController);

    testAccount = await createAccount();
  });

  afterAll(async () => {
    const timer = setTimeout(async () => await mongoose.disconnect(), 1000);

    timer.unref();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should not be able to retrieve status of non-existing account', async () => {
    await expect(async () => {
      await controller.status(
        testAccount.akey.split("").reverse().join(""),
      );
    }).rejects.toThrow(NotFoundException);
  });

  it('should be able to retrieve status of existing account', async () => {
    const response = await controller.status(testAccount.akey);

    expect(response).toBeInstanceOf(PremiumStatusDto);
    expect(response).toHaveProperty('premiumUntil', null);
  });

  describe('Ad redemption', () => {
    it('should be able to extend premium of account by watching an ad', async () => {
      const response = await controller.redeemAd(testAccount.akey);

      const now = new Date();
      const expectedDate = new Date(now.getTime() + PREMIUM_DURATION.FIVE_MINUTES * 60000);
      const toleranceInMs = 2000;

      expect(response).toBeInstanceOf(PremiumStatusDto);
      expect(response).toHaveProperty('premiumUntil');

      expect(response.premiumUntil.getTime()).toBeGreaterThan(expectedDate.getTime() - toleranceInMs);
      expect(response.premiumUntil.getTime()).toBeLessThan(expectedDate.getTime() + toleranceInMs);
    });

    it('should not be able to extend premium by watching an ad again', async () => {
      await controller.redeemAd(testAccount.akey);

      await expect(async () => {
        await controller.redeemAd(
          testAccount.akey,
        );
      }).rejects.toThrow(ConflictException);
    });
  });

  describe('Subscription redemption', () => {
    it('should not be able to redeem subscription with invalid code', async () => {
      jest.spyOn(premiumService, 'redeemSubscription').mockRejectedValueOnce(new PurchaseTokenInvalidException());

      await expect(async () => {
        await controller.redeemSubscription(testAccount.akey, 'invalid_code');
      }).rejects.toThrow(BadRequestException);
    });

    it('should be able to extend premium of account by subscribing', async () => {
      const expectedDate = new Date(new Date().getTime() + PREMIUM_DURATION.ONE_MONTH * 60000);
      jest.spyOn(premiumService, 'redeemSubscription').mockResolvedValueOnce(expectedDate);

      const response = await controller.redeemSubscription(testAccount.akey, 'valid_code');

      expect(response).toBeInstanceOf(PremiumStatusDto);
      expect(response).toHaveProperty('premiumUntil', expectedDate);
    });

    it('should be able to extend premium of account by subscribing again', async () => {
      const initialDate = new Date(new Date().getTime() + PREMIUM_DURATION.ONE_MONTH * 60000);
      jest.spyOn(premiumService, 'redeemSubscription').mockResolvedValueOnce(initialDate);
      await controller.redeemSubscription(testAccount.akey, 'valid_code');

      const expectedDate = new Date(initialDate.getTime() + PREMIUM_DURATION.ONE_MONTH * 60000);
      jest.spyOn(premiumService, 'redeemSubscription').mockResolvedValueOnce(expectedDate);

      const response = await controller.redeemSubscription(testAccount.akey, 'valid_code');

      expect(response).toBeInstanceOf(PremiumStatusDto);
      expect(response).toHaveProperty('premiumUntil', expectedDate);
    });
  });

  describe('Voucher redemption', () => {
    let voucher: Voucher;

    beforeEach(async () => {
      voucher = await premiumService.generateVoucher(PREMIUM_DURATION.ONE_WEEK);
    });

    it('should not be able to redeem non-existing voucher', async () => {
      await expect(async () => {
        await controller.redeemVoucher(
          testAccount.akey,
          randomBytes(VOUCHER_LENGTH / 2).toString('hex'),
        );
      }).rejects.toThrow(NotFoundException);
    });

    it('should be able to redeem existing voucher', async () => {
      const response = await controller.redeemVoucher(testAccount.akey, voucher.code);

      const now = new Date();
      const expectedDate = new Date(now.getTime() + voucher.durationInMinutes * 60000);
      const toleranceInMs = 2000;

      expect(response).toBeInstanceOf(PremiumStatusDto);
      expect(response).toHaveProperty('premiumUntil');

      expect(response.premiumUntil.getTime()).toBeGreaterThan(expectedDate.getTime() - toleranceInMs);
      expect(response.premiumUntil.getTime()).toBeLessThan(expectedDate.getTime() + toleranceInMs);
    });

    it('should not be able to redeem already used voucher', async () => {
      await controller.redeemVoucher(testAccount.akey, voucher.code);

      await expect(async () => {
        await controller.redeemVoucher(
          testAccount.akey,
          voucher.code,
        );
      }).rejects.toThrow(ConflictException);
    });
  });
});