import { Module } from "@nestjs/common";
import { MigrationController } from "./migration.controller";
import { LogsService } from "../logs/logs.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Log, LogSchema } from "../logs/schemas/log.schema";
import { LastSync, LastSyncSchema } from "../logs/schemas/last-sync.schema";
import { MigrationService } from "./migration.service";
import { MigrationAccount, MigrationAccountSchema } from "./schemas/migration-account.schema";

@Module({
    controllers: [MigrationController],
    providers: [LogsService, MigrationService],
    imports: [
        MongooseModule.forFeature([
            { name: Log.name, schema: LogSchema },
            { name: LastSync.name, schema: LastSyncSchema },
            { name: MigrationAccount.name, schema: MigrationAccountSchema },
        ]),
    ],
})
export class MigrationModule { };