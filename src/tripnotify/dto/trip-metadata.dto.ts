export class TripMetadataDto {
  constructor(
    consumedEnergy: number,
    rechargedEnergy: number,
    avgDriveSpeed: number,
    avgChargeSpeed: number,
  ) {
    this.consumedEnergy = consumedEnergy;
    this.rechargedEnergy = rechargedEnergy;
    this.avgDriveSpeed = avgDriveSpeed;
    this.avgChargeSpeed = avgChargeSpeed;
  }

  consumedEnergy: number;

  rechargedEnergy: number;

  avgDriveSpeed: number;

  avgChargeSpeed: number;
}