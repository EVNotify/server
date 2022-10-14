import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountModule } from 'src/account/account.module';
import { Log, LogSchema } from './schemas/log.schema';

@Module({
  controllers: [LogsController],
  providers: [LogsService],
  imports: [
    AccountModule,
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
  ],
})
export class LogsModule {}