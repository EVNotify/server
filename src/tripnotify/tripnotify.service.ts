import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Trip, TRIP_LENGTH } from "./schemas/trip.schema";
import { Model } from "mongoose";
import { TripDto } from "./dto/trip.dto";
import { TripNotExistsException } from "./exceptions/trip-not-exists.exception";
import { CreateTripDto } from "./dto/create-trip.dto";
import { randomBytes } from "crypto";
import { TripCreationException } from "./exceptions/trip-creation.exception";

@Injectable()
export class TripNotifyService {
  constructor(
    @InjectModel(Trip.name) private tripModel: Model<Trip>,
  ) { }

  async findByCode(code: string): Promise<TripDto> {
    const trip = await this.tripModel.findOne({
      code,
      endDate: { $gt: new Date() },
    });

    if (!trip) {
      throw new TripNotExistsException();
    }

    return new TripDto(trip);
  }

  async create(akey: string, dto: CreateTripDto): Promise<TripDto> {
    const now = new Date();

    if (dto.startDate <= now) {
      throw new TripCreationException('Start of the trip must be in the future');
    }

    if (dto.startDate >= dto.endDate) {
      throw new TripCreationException('Start must be greater than end date');
    }

    const diffMs = dto.endDate.getTime() - dto.startDate.getTime();
    const maxMs = 24 * 60 * 60 * 1000;

    if (diffMs > maxMs) {
      throw new TripCreationException('Trip should not be longer than 24 hours');
    }

    const data = {
      ...dto,
      akey,
      code: randomBytes(TRIP_LENGTH / 2).toString('hex'),
    };

    const trip = await (new this.tripModel(data)).save();

    return new TripDto(trip);
  }
}