import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { MigrateSocDto } from "./dto/migrate-soc.dto";
import { MigrationService } from "./migration.service";

@Controller('migration')
@ApiTags('Migration from v2 to v3')
export class MigrationController {
    constructor(
        private readonly migrationService: MigrationService,
    ) {};

    @Post('soc')
    async migrateSoC(
        @Body() migrateSocDto: MigrateSocDto,
    ) {
        return this.migrationService.migrateSoC(migrateSocDto);
    }

    @Post('extended')
    async migrateExtended() {

    }

    @Post('location')
    async migrateLocation() {

    }
}