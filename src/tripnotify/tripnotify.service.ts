import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Trip, TRIP_LENGTH } from "./schemas/trip.schema";
import { Model } from "mongoose";
import { TripNotExistsException } from "./exceptions/trip-not-exists.exception";
import { CreateTripDto } from "./dto/create-trip.dto";
import { randomBytes } from "crypto";
import { TripCreationException } from "./exceptions/trip-creation.exception";
import { TripNotStartedException } from "./exceptions/trip-not-started.exception";

@Injectable()
export class TripNotifyService {
  constructor(
    @InjectModel(Trip.name) private tripModel: Model<Trip>,
  ) { }

  async findAccessibleByCode(code: string): Promise<Trip> {
    const trip = await this.tripModel.findOne({
      $and: [
        { code },
        {
          $or: [
            { accessibleAfterEnd: true },
            {
              accessibleAfterEnd: false,
              endDate: { $lte: new Date() },
            },
          ],
        },
      ],
    });

    if (!trip) {
      throw new TripNotExistsException();
    }

    if (trip.startDate > new Date()) {
      throw new TripNotStartedException(trip.startDate);
    }

    return trip;
  }

  async create(akey: string, dto: CreateTripDto): Promise<Trip> {
    const now = new Date();
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (start <= now) {
      throw new TripCreationException('Start of the trip must be in the future');
    }

    if (start >= end) {
      throw new TripCreationException('Start must be greater than end date');
    }

    const diffMs = end.getTime() - start.getTime();
    const maxMs = 24 * 60 * 60 * 1000;

    if (diffMs > maxMs) {
      throw new TripCreationException('Trip should not be longer than 24 hours');
    }

    const data = {
      ...dto,
      akey,
      code: randomBytes(TRIP_LENGTH / 2).toString('hex'),
    };

    return await (new this.tripModel(data)).save();
  }
}