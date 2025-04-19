import {
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
import { TYPE } from '../entities/type.entity';

export class LogDto {
  constructor(log?: Log) {
    this.id = log?._id.toString();
    this.updatedAt = log?.updatedAt;
    this.title = log?.title;
    this.status = log?.status;
    this.type = log?.type;
    this.startDate = log?.startDate;
    this.endDate = log?.endDate;
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
    this.rechargedKW = log?.rechargedKW;
    this.dischargedKW = log?.dischargedKW;
  }

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;

  @IsString()
  @IsOptional()
  title: string;

  @IsEnum(STATUS)
  @IsNotEmpty()
  status: STATUS = STATUS.RUNNING;

  @IsEnum(TYPE)
  @IsNotEmpty()
  type: TYPE = TYPE.UNKNOWN;

  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @IsDate()
  @IsOptional()
  endDate: Date;

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

  @IsNumber()
  @Min(0)
  rechargedKW: number;

  @IsNumber()
  @Min(0)
  dischargedKW: number;
}
