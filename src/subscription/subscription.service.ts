import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Subscribe to notifications
   */
  async subscribe(createSubscriptionDto: CreateSubscriptionDto) {
    const { email } = createSubscriptionDto;

    try {
      const existingSubscriber = await this.prismaService.subscriber.findUnique({
        where: { email },
      });

      if (existingSubscriber) {
        if (existingSubscriber.isActive) {
          throw new ConflictException('Email is already subscribed');
        } else {
          // Reactivate if previously unsubscribed
          return await this.prismaService.subscriber.update({
            where: { email },
            data: { isActive: true },
          });
        }
      }

      return await this.prismaService.subscriber.create({
        data: { email },
      });
    } catch (error) {
      this.logger.error(`Failed to subscribe email: ${email}`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribe(email: string) {
    try {
      const existingSubscriber = await this.prismaService.subscriber.findUnique({
        where: { email },
      });

      if (!existingSubscriber) {
        throw new NotFoundException('Subscriber not found');
      }

      return await this.prismaService.subscriber.update({
        where: { email },
        data: { isActive: false },
      });
    } catch (error) {
      this.logger.error(`Failed to unsubscribe email: ${email}`, error);
      throw error;
    }
  }

  /**
   * Get all active subscribers
   */
  async getAllActiveSubscribers() {
    return this.prismaService.subscriber.findMany({
      where: { isActive: true },
    });
  }
}


