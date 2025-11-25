import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global module for Prisma database access
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

