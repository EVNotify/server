import { LogWithHistoryDto } from "./log-with-history.dto";
import { Expose } from "class-transformer";
import { TripMetadataDto } from "./trip-metadata.dto";
import { TYPE } from "src/logs/entities/type.entity";

export class TripInformationDto {
  constructor(logs: LogWithHistoryDto[]) {
    this.logs = logs;
  }

  logs: LogWithHistoryDto[];

  @Expose()
  get metadata(): TripMetadataDto {
    let consumedEnergy = 0;
    let rechargedEnergy = 0;
    let avgDriveSpeed = 0;
    let avgChargeSpeed = 0;
    let countChargeLogs = 0;
    let countDriveLogs = 0;

    this.logs.forEach((log) => {
      consumedEnergy += log.dischargedKWh || 0;
      rechargedEnergy += log.rechargedKWh || 0;

      if (log.type === TYPE.CHARGE || (log.type === TYPE.UNKNOWN && log.averageKW)) {
        avgChargeSpeed += Math.abs(log.averageKW || 0);
        countChargeLogs++;
      } else if (log.type === TYPE.DRIVE || (log.type === TYPE.UNKNOWN && log.averageSpeed)) {
        avgDriveSpeed += log.averageSpeed || 0;
        countDriveLogs++;
      }
    });

    avgDriveSpeed = countDriveLogs ? avgDriveSpeed / countDriveLogs : 0;
    avgChargeSpeed = countChargeLogs ? avgChargeSpeed / countChargeLogs : 0;

    return new TripMetadataDto(
      parseFloat((consumedEnergy || 0).toFixed(2)),
      parseFloat((rechargedEnergy || 0).toFixed(2)),
      parseFloat((avgDriveSpeed || 0).toFixed(2)),
      parseFloat((avgChargeSpeed || 0).toFixed(2)),
    );
  }
}