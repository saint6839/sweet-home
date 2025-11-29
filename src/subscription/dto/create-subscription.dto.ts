import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateSubscriptionDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}

