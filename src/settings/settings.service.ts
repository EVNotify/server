import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SettingDto } from './dto/setting.dto';
import { Settings } from './schemas/settings.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
  ) {}

  async findOne(akey: string, field?: string): Promise<SettingDto> {
    let settings = await this.settingsModel.findOne({ akey }).select(field);

    if (!settings) {
      settings = await this.settingsModel.create({ akey });

      if (field) {
        settings = await this.settingsModel.findOne({ akey }).select(field);
      }
    }

    return Promise.resolve(new SettingDto(settings));
  }

  async update(akey: string, object: SettingDto): Promise<SettingDto> {
    const settings = await this.settingsModel.findOneAndUpdate(
      { akey },
      object,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return Promise.resolve(new SettingDto(settings));
  }
}
