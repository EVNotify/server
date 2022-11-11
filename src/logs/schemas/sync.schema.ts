import { Prop } from '@nestjs/mongoose';
import { SyncDto } from '../dto/sync.dto';

export class Sync {
  constructor(syncDto?: SyncDto) {
    this.timestamp = syncDto?.timestamp;
    this.latitude = syncDto?.latitude;
    this.longitude = syncDto?.longitude;
    this.altitude = syncDto?.altitude;
    this.accuracy = syncDto?.accuracy;
    this.speed = syncDto?.speed;
    this.charging = syncDto?.charging;
    this.socDisplay = syncDto?.socDisplay;
    this.socBMS = syncDto?.socBMS;
    this.soh = syncDto?.soh;
    this.slowChargePort = syncDto?.slowChargePort;
    this.normalChargePort = syncDto?.normalChargePort;
    this.rapidChargePort = syncDto?.rapidChargePort;
    this.odo = syncDto?.odo;
    this.auxBatteryVoltage = syncDto?.auxBatteryVoltage;
    this.dcBatteryVoltage = syncDto?.dcBatteryVoltage;
    this.dcBatteryCurrent = syncDto?.dcBatteryCurrent;
    this.dcBatteryPower = syncDto?.dcBatteryPower;
    this.cec = syncDto?.cec;
    this.ced = syncDto?.ced;
    this.batteryMinTemperature = syncDto?.batteryMinTemperature;
    this.batteryMaxTemperature = syncDto?.batteryMaxTemperature;
    this.batteryInletTemperature = syncDto?.batteryInletTemperature;
    this.outsideTemperature = syncDto?.outsideTemperature;
  }

  timestamp: string;

  @Prop()
  latitude: number;

  @Prop()
  longitude: number;

  @Prop()
  altitude: number;

  @Prop()
  accuracy: number;

  @Prop()
  speed: number;

  @Prop()
  charging: boolean;

  @Prop({
    min: 0,
    max: 100,
  })
  socDisplay: number;

  @Prop({
    min: 0,
    max: 100,
  })
  socBMS: number;

  @Prop({
    min: 0,
    max: 100,
  })
  soh: number;

  @Prop()
  slowChargePort: boolean;

  @Prop()
  normalChargePort: boolean;

  @Prop()
  rapidChargePort: boolean;

  @Prop()
  odo: number;

  @Prop({
    min: 0,
  })
  auxBatteryVoltage: number;

  @Prop()
  dcBatteryVoltage: number;

  @Prop()
  dcBatteryCurrent: number;

  @Prop()
  dcBatteryPower: number;

  @Prop({
    min: 0,
  })
  cec: number;

  @Prop({
    min: 0,
  })
  ced: number;

  @Prop()
  batteryMinTemperature: number;

  @Prop()
  batteryMaxTemperature: number;

  @Prop()
  batteryInletTemperature: number;

  @Prop()
  outsideTemperature: number;
}
