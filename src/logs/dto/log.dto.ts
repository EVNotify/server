import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { STATUS } from '../entities/status.entity';
import { Log } from '../schemas/log.schema';

export class LogDto {
  constructor(log?: Log) {
    this.id = log?._id.toString();
    this.title = log?.title;
    this.status = log?.status;
    this.startDate = log?.startDate;
    this.endDate = log?.endDate;
    this.isCharge = log?.isCharge;
    this.startSOC = log?.startSOC;
    this.endSOC = log?.endSOC;
    this.startODO = log?.startODO;
    this.endODO = log?.endODO;
    this.startCEC = log?.startCEC;
    this.endCEC = log?.endCEC;
    this.startCED = log?.startCED;
    this.endCED = log?.endCED;
    this.averageKW = log?.averageKW;
    this.distance = log?.distance;
    this.averageSpeed = log?.averageSpeed;
  }

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  title: string;

  @IsEnum(STATUS)
  @IsNotEmpty()
  status: STATUS = STATUS.RUNNING;

  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @IsDate()
  @IsOptional()
  endDate: Date;

  @IsBoolean()
  isCharge = false;

  @IsNumber()
  @Min(0)
  @Max(100)
  startSOC: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  endSOC: number;

  @IsNumber()
  @Min(0)
  startODO: number;

  @IsNumber()
  @Min(0)
  endODO: number;

  @IsNumber()
  @Min(0)
  startCEC: number;

  @IsNumber()
  @Min(0)
  endCEC: number;

  @IsNumber()
  @Min(0)
  startCED: number;

  @IsNumber()
  @Min(0)
  endCED: number;

  @IsNumber()
  averageKW: number;

  @IsNumber()
  @Min(0)
  distance: number;

  @IsNumber()
  @Min(0)
  averageSpeed: number;
}
