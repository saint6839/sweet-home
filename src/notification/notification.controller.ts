import { Body, Controller, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendTestEmailDto } from './dto/send-test-email.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('test')
  async sendTestEmail(@Body() dto: SendTestEmailDto): Promise<void> {
    await this.notificationService.sendTestEmail(dto.email);
  }
}

