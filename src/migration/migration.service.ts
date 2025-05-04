import { Injectable } from "@nestjs/common";
import { MigrationAccount } from "./schemas/migration-account.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MigrationAccountNotFound } from "./exceptions/migration-account-not-found.exception";
import { LogsService } from "../logs/logs.service";
import { MigrateSocDto } from "./dto/migrate-soc.dto";
import { SyncDto } from "../logs/dto/sync.dto";

@Injectable()
export class MigrationService {
    constructor(
        private readonly logsService: LogsService,
        @InjectModel(MigrationAccount.name) private migrationAccountModel: Model<MigrationAccount>,
    ) {};

    private async requireMigrationAccount(v2Akey: string, v2Token: string): Promise<MigrationAccount>
    {
        const account = await this.migrationAccountModel.findOne({ v2Akey, v2Token });

        if (!account) {
            throw new MigrationAccountNotFound();
        }

        return account;
    }

    async migrateSoC(dto: MigrateSocDto) {
        const migrationAccount = await this.requireMigrationAccount(dto.akey, dto.token);

        const syncData = new SyncDto();

        syncData.timestamp = new Date().toISOString();
        syncData.socDisplay = dto.response.display;
        syncData.socBMS = dto.response.bms;

        return this.logsService.syncData(migrationAccount.v3Akey, syncData);
    }
}