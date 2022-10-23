import { Prop } from '@nestjs/mongoose';
import { LastSync } from '../schemas/last-sync.schema';
import { SyncDto } from './sync.dto';

export class LastSyncDto extends SyncDto {
  constructor(lastSync?: LastSync) {
    super();
    this.timestamp = lastSync?.timestamp;
    this.updatedAt = lastSync?.updatedAt;
    this.latitude = lastSync?.latitude;
    this.longitude = lastSync?.longitude;
    this.altitude = lastSync?.altitude;
    this.accuracy = lastSync?.accuracy;
    this.speed = lastSync?.speed;
    this.charging = lastSync?.charging;
    this.socDisplay = lastSync?.socDisplay;
    this.socBMS = lastSync?.socBMS;
    this.soh = lastSync?.soh;
    this.slowChargePort = lastSync?.slowChargePort;
    this.normalChargePort = lastSync?.normalChargePort;
    this.rapidChargePort = lastSync?.rapidChargePort;
    this.odo = lastSync?.odo;
    this.auxBatteryVoltage = lastSync?.auxBatteryVoltage;
    this.dcBatteryVoltage = lastSync?.dcBatteryVoltage;
    this.dcBatteryCurrent = lastSync?.dcBatteryCurrent;
    this.dcBatteryPower = lastSync?.dcBatteryPower;
    this.cec = lastSync?.cec;
    this.ced = lastSync?.ced;
    this.batteryMinTemperature = lastSync?.batteryMinTemperature;
    this.batteryMaxTemperature = lastSync?.batteryMaxTemperature;
    this.batteryInletTemperature = lastSync?.batteryInletTemperature;
    this.outsideTemperature = lastSync?.outsideTemperature;
  }

  akey: string;

  @Prop()
  updatedAt: Date;
}
