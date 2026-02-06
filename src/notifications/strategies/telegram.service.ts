import * as TelegramBot from 'node-telegram-bot-api';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings } from '../../settings/schemas/settings.schema';
import { Account } from '../../account/schemas/account.schema';
import { TranslatorService } from '../../translator/translator.service';
import { LogsService } from '../../logs/logs.service';
import { LANGUAGES } from '../../settings/entities/language.entity';
import { TelegramUserDto } from '../dto/telegram-user.dto';

@Injectable()
export class TelegramService {
  public readonly bot: TelegramBot;

  constructor(
    private readonly logsService: LogsService,
    private readonly translator: TranslatorService,
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
    @InjectModel(Account.name) private accountModel: Model<Account>,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

    this.bot.onText(/\/start\W*(\w+)?/i, (msg, match) =>
      this.sendStartMessage(msg.chat.id, match[1]),
    );

    this.bot.onText(/\/help\W*(\w+)?/i, async (msg, match) => {
      this.sendHelpMessage(msg.chat.id, match[1]);
    });

    this.bot.onText(/\/subscribe\W*(\w+)?/i, (msg, match) =>
      this.sendSubscriptionMessage(msg.chat.id, match[1]),
    );

    this.bot.onText(/unsubscribe/i, (msg) =>
      this.sendUnsubscriptionMessage(msg.chat.id),
    );
    this.bot.onText(/\/soc\W*(\w+)?/i, (msg, match) =>
      this.sendSoCMessage(msg.chat.id, match[1]),
    );

    this.bot.onText(/location/i, (msg) =>
      this.sendLocationMessage(msg.chat.id),
    );

    this.bot.onText(/extended/i, (msg) =>
      this.sendExtendedMessage(msg.chat.id),
    );

    this.bot.onText(/all/i, (msg) => this.sendCombinedMessage(msg.chat.id));

    if (this.bot.isPolling()) {
      return;
    }

    this.bot.startPolling();
  }

  private async retrieveUser(
    telegramId: number,
    akey: string = null,
  ): Promise<TelegramUserDto | null> {
    const query = akey
      ? {
          telegram: telegramId,
          akey,
        }
      : {
          telegram: telegramId,
        };
    const setting = await this.settingsModel.findOne(query).select('akey');

    if (!setting) {
      return null;
    }

    return new TelegramUserDto(
      telegramId,
      setting.akey,
      setting.language ?? LANGUAGES.en,
    );
  }

  private sendStartMessage(telegramId: number, language: string = null): void {
    const locale = LANGUAGES[language] ||LANGUAGES.en;

    this.bot.sendMessage(
      telegramId,
      this.translator.translate(
        'telegram.message.start',
        locale,
      ),
    );
  }

  private sendErrorMessage(telegramId: number): void {
    this.bot.sendMessage(
      telegramId,
      this.translator.translate('telegram.message.error', LANGUAGES.en),
    );
  }

  private async linkViaToken(telegramId: number, token: string): Promise<void> {
    const user = await this.accountModel.findOne({
      token,
    });

    if (!user) {
      this.sendErrorMessage(telegramId);
      return;
    }

    await this.settingsModel.updateOne(
      {
        akey: user.akey,
      },
      {
        $set: {
          telegram: telegramId,
        },
      },
      { upsert: true },
    );

    this.bot.sendMessage(
      telegramId,
      this.translator.translate('telegram.message.subscribed'),
    );
  }

  private async sendSubscriptionMessage(
    telegramId: number,
    token?: string,
  ): Promise<void> {
    const user = await this.retrieveUser(telegramId);

    if (user) {
      this.bot.sendMessage(
        telegramId,
        this.translator.translate(
          'telegram.message.already_subscribed',
          user.language,
        ),
      );
      return;
    }

    if (token) {
      await this.linkViaToken(telegramId, token);
      return;
    }

    const message = await this.bot.sendMessage(
      telegramId,
      this.translator.translate('telegram.message.subscribe'),
      {
        reply_markup: {
          force_reply: true,
        },
      },
    );

    await this.bot.onReplyToMessage(telegramId, message.message_id, (reply) => {
      this.linkViaToken(telegramId, reply.text);
    });
  }

  private async sendUnsubscriptionMessage(telegramId: number): Promise<void> {
    const user = await this.retrieveUser(telegramId);

    if (!user) {
      this.sendErrorMessage(telegramId);
      return;
    }

    await this.settingsModel.updateOne(
      {
        telegram: telegramId,
      },
      {
        $set: {
          telegram: null,
        },
      },
    );

    this.bot.sendMessage(
      telegramId,
      this.translator.translate('telegram.message.unsubscribed', user.language),
    );
  }

  private async sendSoCMessage(
    telegramId: number,
    akey: string = null,
  ): Promise<void> {
    const user = await this.retrieveUser(telegramId, akey);

    if (!user) {
      this.sendErrorMessage(telegramId);
      return;
    }

    const lastSync = await this.logsService.lastSync(user.akey);

    this.bot.sendMessage(
      telegramId,
      this.translator.translate('telegram.message.soc_info', user.language, {
        soc: lastSync.socDisplay || lastSync.socBMS,
        updatedAt: lastSync.updatedAt,
      }),
    );
  }

  private async sendHelpMessage(
    telegramId: number,
    language: string = null,
  ): Promise<void> {
    const user = await this.retrieveUser(telegramId);
    const locale = LANGUAGES[language] ||LANGUAGES.en;

    this.bot.sendMessage(
      telegramId,
      this.translator.translate(
        'telegram.message.help',
        locale ?? user?.language ?? LANGUAGES.en,
      ),
    );
  }

  private async sendLocationMessage(telegramId: number): Promise<void> {
    const user = await this.retrieveUser(telegramId);

    if (!user) {
      this.sendErrorMessage(telegramId);
      return;
    }

    const lastSync = await this.logsService.lastSync(user.akey);

    if (!lastSync.latitude || !lastSync.longitude) {
      this.sendErrorMessage(telegramId);
      return;
    }

    this.bot.sendLocation(telegramId, lastSync.latitude, lastSync.longitude);
    this.bot.sendMessage(
      telegramId,
      this.translator.translate(
        'telegram.message.location_info',
        user.language,
        {
          updatedAt: lastSync.updatedAt,
        },
      ),
    );
  }

  private async sendExtendedMessage(telegramId: number): Promise<void> {
    const user = await this.retrieveUser(telegramId);

    if (!user) {
      this.sendErrorMessage(telegramId);
      return;
    }

    const lastSync = await this.logsService.lastSync(user.akey);

    this.bot.sendMessage(
      telegramId,
      this.translator.translate(
        'telegram.message.extended_info',
        user.language,
        {
          soh: lastSync.soh,
          charging: this.translator.translate(
            lastSync.charging ? 'yes' : 'no',
            user.language,
          ),
          auxBatteryVoltage: lastSync.auxBatteryVoltage,
          dcBatteryVoltage: lastSync.dcBatteryVoltage,
          dcBatteryCurrent: lastSync.dcBatteryCurrent,
          dcBatteryPower: lastSync.dcBatteryPower,
          batteryMinTemperature: lastSync.batteryMinTemperature,
          batteryMaxTemperature: lastSync.batteryMaxTemperature,
          batteryInletTemperature: lastSync.batteryInletTemperature,
          odo: lastSync.odo,
          updatedAt: lastSync.updatedAt,
        },
      ),
    );
  }

  private sendCombinedMessage(telegramId: number): void {
    this.sendSoCMessage(telegramId);
    this.sendExtendedMessage(telegramId);
    this.sendLocationMessage(telegramId);
  }
}