export class PremiumStatusDto {
  constructor(premiumUntil: Date | null) {
    this.premiumUntil = premiumUntil;
  }

  premiumUntil: Date | null;
}