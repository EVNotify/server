import { LogWithHistoryDto } from "./log-with-history.dto";
import { Expose } from "class-transformer";
import { TripMetadataDto } from "./trip-metadata.dto";

export class TripInformationDto {
  constructor(logs: LogWithHistoryDto[]) {
    this.logs = logs;
  }

  logs: LogWithHistoryDto[];

  @Expose()
  get metadata(): TripMetadataDto {
    let consumedEnergy = 0;
    let rechargedEnergy = 0;
    let driveSpeed = 0;
    let chargeSpeed = 0;

    this.logs.forEach((log) => {
      consumedEnergy += log.dischargedKWh;
      rechargedEnergy += log.rechargedKWh;
      driveSpeed += log.averageSpeed;
      chargeSpeed += log.averageKW;
    });

    driveSpeed = (driveSpeed / this.logs.length) || 0;
    chargeSpeed = (chargeSpeed / this.logs.length) || 0;

    return new TripMetadataDto(
      consumedEnergy || 0,
      rechargedEnergy || 0,
      driveSpeed,
      chargeSpeed,
    );
  }
}