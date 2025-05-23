import { ConflictException, Controller, Get, HttpCode, HttpStatus, InternalServerErrorException, NotFoundException, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../account/account.guard";
import { PremiumService } from "./premium.service";
import { PremiumStatusDto } from "./dto/premium-status.dto";
import { AccountNotExistsException } from "../account/exceptions/account-not-exists.exception";
import { PREMIUM_DURATION } from "./entities/premium-duration.entity";
import { AdNotRedeemableException } from "./exceptions/ad-not-redeemable.exception";
import { VoucherNotExistsException } from "./exceptions/voucher-not-exists.exception";
import { VoucherAlreadyRedeemedException } from "./exceptions/voucher-already-redeemed.exception";

@Controller('premium')
@UseGuards(AuthGuard)
@ApiTags('Premium')
export class PremiumController {
  constructor(
    private readonly premiumService: PremiumService,
  ) { }

  @Get(':akey')
  @ApiBearerAuth()
  async status(@Param('akey') akey: string): Promise<PremiumStatusDto> {
    try {
      const expiryDate = await this.premiumService.getExpiryDate(akey);

      return new PremiumStatusDto(expiryDate);
    } catch (error) {
      if (error instanceof AccountNotExistsException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }

  @Post(':akey/redeem/ad')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async redeemAd(@Param('akey') akey: string): Promise<PremiumStatusDto> {
    try {
      const isPremium = (await this.premiumService.getExpiryDate(akey)) != null;

      if (isPremium) {
        throw new AdNotRedeemableException();
      }

      // TODO verify if ad was really watched
      const newExpiryDate = await this.premiumService.extendPremium(akey, PREMIUM_DURATION.FIVE_MINUTES);

      return new PremiumStatusDto(newExpiryDate);
    } catch (error) {
      if (error instanceof AccountNotExistsException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof AdNotRedeemableException) {
        throw new ConflictException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }

  @Post(':akey/redeem/voucher/:code')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async redeemVoucher(@Param('akey') akey: string, @Param('code') code: string): Promise<PremiumStatusDto> {
    try {
      const voucher = await this.premiumService.findVoucher(code);

      const newExpiryDate = await this.premiumService.redeemVoucher(akey, voucher);

      return new PremiumStatusDto(newExpiryDate);
    } catch (error) {
      if (error instanceof VoucherNotExistsException) {
        throw new NotFoundException(error.message);
      } else if (error instanceof VoucherAlreadyRedeemedException) {
        throw new ConflictException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }

  @Post(':akey/redeem/subscription')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async redeemSubscription(@Param('akey') akey: string) {
    try {
      // TODO verify if subscription was really paid
      const newExpiryDate = await this.premiumService.extendPremium(akey, PREMIUM_DURATION.ONE_MONTH);

      return new PremiumStatusDto(newExpiryDate);
    } catch (error) {
      if (error instanceof AccountNotExistsException) {
        throw new NotFoundException(error.message);
      }

      throw new InternalServerErrorException();
    }
  }
}