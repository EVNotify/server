import * as TelegramBot from 'node-telegram-bot-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramService {
  public readonly bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

    this.bot.on('message', (message) => {
      // todo handle messages to be able to execute commands and register for telegram notification
      console.log(message.text);
    });

    if (this.bot.isPolling()) {
      return;
    }

    this.bot.startPolling();
  }
}
