import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { IHousingComplex } from '../crawler/interfaces/housing-complex.interface';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async sendUpdateNotification(changes: IHousingComplex[]) {
    const subscribers = await this.subscriptionService.getAllActiveSubscribers();

    if (subscribers.length === 0) {
      this.logger.warn('No active subscribers found.');
      return;
    }

    if (changes.length === 0) {
      return;
    }

    const subject = `[청년안심주택] ${changes.length}건의 변동사항이 감지되었습니다.`;
    const html = this.generateEmailContent(changes);
    const recipientEmails = subscribers.map((sub: { email: string }) => sub.email);

    try {
      // Send individually to protect privacy (or use BCC)
      // Using BCC for efficiency as per plan
      await this.mailerService.sendMail({
        bcc: recipientEmails,
        subject,
        html,
      });
      this.logger.log(
        `Notification sent to ${subscribers.length} subscribers for ${changes.length} changes.`,
      );
    } catch (error) {
      this.logger.error('Failed to send notification email', error);
    }
  }

  private generateEmailContent(changes: IHousingComplex[]): string {
    let listItems = '';

    for (const item of changes) {
      listItems += `
        <div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
          <h3 style="margin: 0 0 5px 0;">${item.name}</h3>
          <p style="margin: 0 0 5px 0; color: #666;">${item.district}</p>
          <p style="margin: 0 0 5px 0;"><strong>상태:</strong> ${item.description || '정보 없음'}</p>
          <p style="margin: 0;">
            <a href="${item.detailUrl}" style="background-color: #007bff; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; font-size: 14px;">상세보기</a>
          </p>
        </div>
      `;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>청년안심주택 변동 알림</h2>
        <p>다음 주택들의 상태가 변경되었습니다:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
          ${listItems}
        </div>
        <p style="font-size: 12px; color: #999; margin-top: 20px;">
          본 메일은 자동 발송되었습니다. <br/>
          수신을 원치 않으시면 API를 통해 구독을 취소해주세요.
        </p>
      </div>
    `;
  }
}
