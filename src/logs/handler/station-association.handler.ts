import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LOG_FINISHED_EVENT } from 'src/logs/entities/log.entity';
import { Log } from 'src/logs/schemas/log.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LogsService } from 'src/logs/logs.service';
import { TYPE } from 'src/logs/entities/type.entity';
import { HISTORY_TYPE } from 'src/logs/entities/history-type.entity';
import { Station } from 'src/stations/schemas/station.schema';
import { MissingStation } from 'src/stations/schemas/missing-station.schema';

@Injectable()
export class StationAssociationHandler {
  constructor(
    private readonly logsService: LogsService,
    @InjectModel(Station.name) private readonly stationModel: Model<Station>,
    @InjectModel(MissingStation.name) private readonly missingStationModel: Model<MissingStation>,
    @InjectModel(Log.name) private readonly logModel: Model<Log>,
  ) {}

  @OnEvent(LOG_FINISHED_EVENT)
  async handleFinished(log: Log) {
    try {
      if (log.type !== TYPE.CHARGE) {
        return;
      }

      const history = await this.logsService.findOneWithHistory(log.akey, log._id.toString(), HISTORY_TYPE.LOCATION_DATA);

      const firstWithLocation = history.find((entry) => entry.latitude != null && entry.longitude != null);

      if (!firstWithLocation) {
        return;
      }

      const latitude = firstWithLocation.latitude;
      const longitude = firstWithLocation.longitude;

      await this.stationModel.ensureIndexes();

      const results = await this.stationModel.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] },
            distanceField: 'distance',
            spherical: true,
            maxDistance: 200,
            key: 'location',
          },
        },
        { $sort: { distance: 1 } },
        { $limit: 1 },
      ]);

      if (results.length) {
        const stationDoc = results[0];

        await this.logModel.updateOne({ _id: log._id, akey: log.akey }, { $set: { station: stationDoc._id } });
      } else {
        await this.missingStationModel.create({
          akey: log.akey,
          logRef: log._id,
          latitude,
          longitude,
        });
      }
    } catch (error) {
      Logger.error('Error in StationAssociationHandler', error);
    }
  }
}
