import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Station } from "./schemas/station.schema";
import { Model } from "mongoose";
import { ListStationsFilterDto } from "./dto/list-stations.dto";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError } from "axios";
import { OCMRequestFailedException } from "./exceptions/ocm-request-failed.exception";
import { StationDto } from "./dto/station.dto";
import { RouteQueryDto } from "./dto/route-query.dto";
import { RouteDto } from "./dto/route.dto";
import { buffer, distance, lineString, point, pointToLineDistance } from "@turf/turf";
import { RouteStationDto } from "./dto/route-station.dto";
import { Account } from "src/account/schemas/account.schema";
import { RoutePlannedRecentlyException } from "./exceptions/route-planned-recently.exception";
import { Feature, LineString, MultiPolygon, Polygon } from "geojson";
import * as polyline from "@mapbox/polyline";

@Injectable()
export class StationsService {
  constructor(
    @InjectModel(Station.name) private stationModel: Model<Station>,
    @InjectModel(Account.name) private accountModel: Model<Account>,
    private readonly httpService: HttpService,
  ) { }

  private baseUrl = 'https://api.openchargemap.io/v3';

  private async findAndUpdateStationsViaRequest(dto: ListStationsFilterDto, akey: string): Promise<Station[]> {
    const { data } = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/poi?compact=true&verbose=false&opendata=true&countryCode=de&distance=20&distanceunit=km&latitude=${dto.latitude}&longitude=${dto.longitude}`
      ).pipe(
        catchError((error: AxiosError) => {
          Logger.error(error.response.data);
          throw new OCMRequestFailedException();
        }),
      ),
    );

    const stations = data.map((s) => {
      return new Station({
        ID: s.ID,
        UUID: s.UUID,
        AddressInfo: s.AddressInfo,
        data: (() => {
          const { ID, UUID, AddressInfo, ...rest } = s;
          return rest;
        })(),
      });
    });

    await this.stationModel.bulkWrite(stations.map((station) => ({
      updateOne: {
        filter: { ID: station.ID },
        update: { $set: station },
        upsert: true,
      },
    })));

    await this.accountModel.updateOne({
      akey,
    }, {
      $set: {
        stationsRefreshedAt: new Date(),
      },
    });

    return stations;
  }

  private async findNearbyStationsWithinDatabase(dto: ListStationsFilterDto): Promise<Station[]> {
    await this.stationModel.ensureIndexes();

    const results = await this.stationModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [dto.longitude, dto.latitude],
          },
          distanceField: 'distance',
          spherical: true,
          maxDistance: 20 * 1000,
          key: 'location',
        },
      },
      {
        $match: {
          maxKW: {
            $gte: dto.minKW,
          }
        },
      },
      {
        $sort: { distance: 1 },
      },
    ]);

    return results;
  }

  private async findAndUpdateStationsAlongRouteViaRequest(geoJSON: Feature<LineString>) {
    const encodedPolygon = polyline.fromGeoJSON(geoJSON);
    const { data } = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/poi?compact=true&verbose=false&opendata=true&countryCode=de&distance=5&distanceunit=km&polyline=${encodedPolygon}`
      ).pipe(
        catchError((error: AxiosError) => {
          Logger.error(error.response.data);
          throw new OCMRequestFailedException();
        }),
      ),
    );

    const stations = data.map((s) => {
      return new Station({
        ID: s.ID,
        UUID: s.UUID,
        AddressInfo: s.AddressInfo,
        data: (() => {
          const { ID, UUID, AddressInfo, ...rest } = s;
          return rest;
        })(),
      });
    });

    await this.stationModel.bulkWrite(stations.map((station) => ({
      updateOne: {
        filter: { ID: station.ID },
        update: { $set: station },
        upsert: true,
      },
    })));
  }

  private async findStationsAlongRouteWithinDatabase(polygon: Feature<Polygon | MultiPolygon, {
    [name: string]: any;
  }>, minKW: number): Promise<Station[]> {
    return await this.stationModel.find({
      maxKW: {
        $gte: minKW,
      },
      location: {
        $geoWithin: {
          $geometry: polygon.geometry,
        },
      },
    });
  }

  async findNearby(dto: ListStationsFilterDto, akey: string): Promise<StationDto[]> {
    let stations = await this.findNearbyStationsWithinDatabase(dto);

    const stationsRefreshedAt = (await this.accountModel.findOne({
      akey,
    }).select('stationsRefreshedAt')).stationsRefreshedAt;
    const refreshedOverADayAgo = Date.now() - stationsRefreshedAt?.getTime() > 24 * 60 * 60 * 1000;

    if (!stations.length || refreshedOverADayAgo) {
      stations = await this.findAndUpdateStationsViaRequest(dto, akey);
    }

    return stations.map((station) => {
      const distanceToStation = distance([dto.longitude, dto.latitude], point(station.location.coordinates));

      return new StationDto(station, distanceToStation);
    });
  }

  async planRoute(dto: RouteQueryDto, akey: string): Promise<RouteDto> {
    const routePlannedAt = (await this.accountModel.findOne({
      akey,
    }).select('routePlannedAt')).routePlannedAt;
    const recentlyPlanned = Date.now() - routePlannedAt?.getTime() < 5000;

    if (recentlyPlanned) {
      throw new RoutePlannedRecentlyException();
    }

    const start = [dto.startLongitude, dto.startLatitude];
    const end = [dto.endLongitude, dto.endLatitude];
    const path = lineString([start, end]);
    const corridor = buffer(path, 5);


    await this.findAndUpdateStationsAlongRouteViaRequest(path);

    const stations = await this.findStationsAlongRouteWithinDatabase(corridor, dto.minKW);

    const routeStations = stations
      .map((station) => {
        const stationPoint = point(station.location.coordinates);
        const routeDistance = pointToLineDistance(stationPoint, path);
        const startDistance = distance(start, stationPoint);

        return new RouteStationDto(station, routeDistance, startDistance);
      })
      .sort((a, b) => a.distanceToStartKm - b.distanceToStartKm);

    await this.accountModel.updateOne({
      akey,
    }, {
      $set: {
        routePlannedAt: new Date(),
      },
    });

    return new RouteDto(routeStations);
  }
}