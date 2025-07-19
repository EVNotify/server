import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Station } from "./schemas/station.schema";
import { Model } from "mongoose";
import { ListStationsDto } from "./dto/list-stations.dto";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError } from "axios";
import { OCMRequestFailedException } from "./exceptions/ocm-request-failed.exception";

@Injectable()
export class StationsService {
  constructor(
    @InjectModel(Station.name) private stationModel: Model<Station>,
    private readonly httpService: HttpService,
  ) {}

  private baseUrl = 'https://api.openchargemap.io/v3';

  private async findAndUpdateStationsViaRequest(dto: ListStationsDto): Promise<Station[]> {
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

    await this.stationModel.insertMany(stations);

    return stations;
  }

  private async findNearbyStationsWithinDatabase(dto: ListStationsDto): Promise<Station[]> {
    return [];
  }

  async findNearby(dto: ListStationsDto) {
    let stations = await this.findNearbyStationsWithinDatabase(dto);

    // TODO filter by distance, optional calculate distance
    // TODO refresh handling
    if (!stations.length) {
      stations = await this.findAndUpdateStationsViaRequest(dto);
    }

    return stations;
  }
}