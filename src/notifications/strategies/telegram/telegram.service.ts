import * as TelegramBot from 'node-telegram-bot-api';
import { Injectable } from '@nestjs/common';
import { Translator } from 'src/utils/translator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings } from 'src/settings/schemas/settings.schema';
import { TelegramUserDto } from '../../dto/telegram-user.dto';
import { LANGUAGES } from '../../../settings/entities/language.entity';
import { LogsService } from '../../../logs/logs.service';

@Injectable()
export class TelegramService {
  public readonly bot: TelegramBot;
  public readonly translator: Translator;

  constructor(
    private readonly logsService: LogsService,
    @InjectModel(Settings.name) private settingsModel: Model<Settings>,
  ) {
    this.translator = new Translator();
    this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

    this.bot.on(/\/start\W*(\w+)?/i, async (msg, match) => {
      this.sendStartMessage(msg.chat.id, match[1]);
    });

    this.bot.on(/\/help\W*(\w+)?/i, async (msg, match) => {
      this.sendHelpMessage(msg.chat.id, match[1]);
    });

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
  ): Promise<TelegramUserDto | null> {
    const setting = await this.settingsModel
      .findOne({
        telegram: telegramId,
      })
      .select('akey');

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
    this.bot.sendMessage(
      telegramId,
      this.translator.translate(
        'telegram.message.start',
        language ?? LANGUAGES.en,
      ),
    );
  }

  private sendErrorMessage(telegramId: number): void {
    this.bot.sendMessage(
      telegramId,
      this.translator.translate('telegram.message.error', LANGUAGES.en),
    );
  }

  // TODO: support to fetch another akey belonging to the telegram id
  private async sendSoCMessage(
    telegramId: number,
    akey: string = null,
  ): Promise<void> {
    const user = await this.retrieveUser(telegramId);

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

    this.bot.sendMessage(
      telegramId,
      this.translator.translate(
        'telegram.message.help',
        language ? user?.language ?? LANGUAGES.en : LANGUAGES.en,
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

    this.bot.sendLocation(telegramId, lastSync.latitude, lastSync.longitude);
  }

  // TODO
  private async sendExtendedMessage(telegramId: number): Promise<void> {
    const user = await this.retrieveUser(telegramId);

    if (!user) {
      this.sendErrorMessage(telegramId);
      return;
    }

    this.bot.sendMessage(
      telegramId,
      this.translator.translate('telegram.message.extended', 'en'),
    );
  }

  private sendCombinedMessage(telegramId: number): void {
    this.sendSoCMessage(telegramId);
    this.sendExtendedMessage(telegramId);
    this.sendLocationMessage(telegramId);
  }
}
