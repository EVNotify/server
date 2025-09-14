import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Account } from "../account/schemas/account.schema";
import { AccountNotExistsException } from "../account/exceptions/account-not-exists.exception";
import { Voucher, VOUCHER_LENGTH } from "./schemas/voucher.schema";
import { VoucherNotExistsException } from "./exceptions/voucher-not-exists.exception";
import { VoucherAlreadyRedeemedException } from "./exceptions/voucher-already-redeemed.exception";
import { randomBytes } from "crypto";
import { google } from "googleapis";
import { PurchaseTokenInvalidException } from "./exceptions/purchase-token-invalid.exception";

@Injectable()
export class PremiumService {
  private playDeveloperApi;

  constructor(
    @InjectModel(Account.name) private accountModel: Model<Account>,
    @InjectModel(Voucher.name) private voucherModel: Model<Voucher>,
  ) {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'evnotify.json',
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    this.playDeveloperApi = google.androidpublisher({ version: 'v3', auth });
  }

  async getExpiryDate(akey: string): Promise<Date|null> {
    const account = await this.accountModel.findOne({ akey });

    if (!account) {
      throw new AccountNotExistsException();
    }

    if (!account.premiumUntil || account.premiumUntil <= new Date()) {
      return null;
    }

    return account.premiumUntil;
  }

  async extendPremium(akey: string, duration: number): Promise<Date> {
    const currentExpiryDate = await this.getExpiryDate(akey);
    const baseDate = currentExpiryDate || new Date();
    const newExpiryDate = new Date(baseDate.getTime() + duration * 60000);

    await this.accountModel.updateOne({
      akey,
    }, {
      $set: {
        premiumUntil: newExpiryDate,
      }
    });

    return newExpiryDate;
  }

  async generateVoucher(duration: number): Promise<Voucher> {
    const voucher = new Voucher();

    voucher.code = randomBytes(VOUCHER_LENGTH / 2).toString('hex');
    voucher.durationInMinutes = duration;

    return await new this.voucherModel(voucher).save();
  } 

  async findVoucher(code: string): Promise<Voucher> {
    const voucher = await this.voucherModel.findOne({ code });

    if (!voucher) {
      throw new VoucherNotExistsException();
    }

    if (voucher.redeemedAt != null || voucher.redeemedBy != null) {
      throw new VoucherAlreadyRedeemedException();
    }

    return voucher;
  }

  async redeemVoucher(akey: string, voucher: Voucher): Promise<Date> {
    if (voucher.redeemedAt != null || voucher.redeemedBy != null) {
      throw new VoucherAlreadyRedeemedException();
    }

    const newExpiryDate = await this.extendPremium(akey, voucher.durationInMinutes);

    await this.voucherModel.updateOne({
      code: voucher.code,
    }, {
      $set: {
        redeemedAt: new Date(),
        redeemedBy: akey,
      }
    });

    return newExpiryDate;
  }

  async redeemSubscription(akey: string, purchaseToken: string): Promise<Date> {
    let response;
    
    try {
      response = await this.playDeveloperApi.purchases.subscriptions.get({
        packageName: 'com.evnotify.v3',
        subscriptionId: 'evnotify_premium_monthly',
        token: purchaseToken,
      });  
    } catch (error) {
      Logger.error('Error verifying subscription', error);
    }

    const expiryTimeMillis = response?.data?.expiryTimeMillis;

    if (!expiryTimeMillis) {
      throw new PurchaseTokenInvalidException();
    }

    const expiryDate = new Date(parseInt(expiryTimeMillis));

    await this.accountModel.updateOne({
      akey,
    }, {
      $set: {
        premiumUntil: expiryDate,
      }
    });

    return expiryDate;
  }
}