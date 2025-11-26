import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { CrawlerModule } from './crawler/crawler.module';
import { NotificationModule } from './notification/notification.module';
import { CrawlerScheduler } from './scheduler/crawler.scheduler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CrawlerModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, CrawlerScheduler],
})
export class AppModule {}
