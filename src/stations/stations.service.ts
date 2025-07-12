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

  private async findAndUpdateStationsViaRequest(dto: ListStationsDto) {
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

    // TODO map and store them
    console.log(data);
    return data;
  }

  async findNearby(dto: ListStationsDto) {
    // first check whether there are already results nearby
    // if so, return them,
    // if not, query api, return

    let stations = [];

    stations = await this.findAndUpdateStationsViaRequest(dto);

    return stations;
  }
}