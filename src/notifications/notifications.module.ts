import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  providers: [
    EventEmitter2,
  ],
})
export class NotificationsModule {}
