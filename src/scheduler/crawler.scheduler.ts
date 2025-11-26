import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CrawlerService } from '../crawler/crawler.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CrawlerScheduler {
  private readonly logger = new Logger(CrawlerScheduler.name);

  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Running scheduled crawler task...');

    try {
      const result = await this.crawlerService.syncToDatabase();

      if (result.changes && result.changes.length > 0) {
        this.logger.log(
          `Changes detected: ${result.changes.length} items. Sending notifications...`,
        );
        await this.notificationService.sendUpdateNotification(result.changes);
      } else {
        this.logger.log('No significant changes detected.');
      }

      this.logger.log(
        `Scheduled crawler task completed. Saved: ${result.savedCount}`,
      );
    } catch (error) {
      this.logger.error('Scheduled crawler task failed', error);
    }
  }
}

