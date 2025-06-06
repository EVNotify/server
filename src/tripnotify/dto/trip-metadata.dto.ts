export class TripMetadataDto {
  constructor(
    consumedEnergy: number,
    rechargedEnergy: number,
    driveSpeed: number,
    chargeSpeed: number,
  ) {
    this.consumedEnergy = consumedEnergy;
    this.rechargedEnergy = rechargedEnergy;
    this.driveSpeed = driveSpeed;
    this.chargeSpeed = chargeSpeed;
  }

  consumedEnergy: number;

  rechargedEnergy: number;

  driveSpeed: number;

  chargeSpeed: number;
}