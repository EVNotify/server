import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PremiumController } from './premium.controller';
import { PremiumService } from './premium.service';
import { Account, AccountSchema } from '../account/schemas/account.schema';
import { AccountModule } from '../account/account.module';
import { Voucher, VoucherSchema } from './schemas/voucher.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    MongooseModule.forFeature([{ name: Voucher.name, schema: VoucherSchema }]),
    AccountModule,
  ],
  controllers: [PremiumController],
  providers: [PremiumService],
  exports: [PremiumService],
})
export class PremiumModule {}
