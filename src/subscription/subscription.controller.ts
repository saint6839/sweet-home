import { Controller, Post, Delete, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('api/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  async subscribe(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.subscribe(createSubscriptionDto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    await this.subscriptionService.unsubscribe(createSubscriptionDto.email);
  }
}


