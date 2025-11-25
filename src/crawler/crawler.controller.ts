import {
  Controller,
  Get,
  Post,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { CrawlResultDto } from './dto/crawl-result.dto';

/**
 * Controller for housing complex crawling operations
 */
@Controller('api/crawler')
export class CrawlerController {
  private readonly logger = new Logger(CrawlerController.name);

  constructor(private readonly crawlerService: CrawlerService) {}

  /**
   * Crawl housing complexes from a specific district
   * GET /api/crawler/housing-complexes?district=강남구
   */
  @Get('housing-complexes')
  async crawlHousingComplexes(@Query('district') district: string): Promise<CrawlResultDto> {
    if (!district) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'District parameter is required',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`Received request to crawl housing complexes. District: ${district}`);

    try {
      const result = await this.crawlerService.crawlByDistrict(district);

      if (!result.success) {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Crawling failed',
            error: result.error,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to crawl housing complexes', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to crawl housing complexes',
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crawl and sync housing complexes to database
   * POST /api/crawler/sync
   */
  @Post('sync')
  async syncToDatabase(): Promise<{
    success: boolean;
    savedCount: number;
    message: string;
    error?: string;
  }> {
    this.logger.log('Received request to sync housing complexes to database');

    try {
      const result = await this.crawlerService.syncToDatabase();

      if (!result.success) {
        throw new HttpException(
          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed to sync to database',
            error: result.error,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        success: true,
        savedCount: result.savedCount,
        message: `Successfully synced ${result.savedCount} housing complexes to database`,
      };
    } catch (error) {
      this.logger.error('Failed to sync to database', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to sync to database',
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get list of all available districts
   * GET /api/crawler/districts
   */
  @Get('districts')
  getDistrictsList(): { districts: string[] } {
    this.logger.log('Received request to get districts list');
    const districts = this.crawlerService.getDistrictsList();
    return {
      districts: districts.map((d) => d.name),
    };
  }

  /**
   * Health check endpoint for crawler module
   * GET /api/crawler/health
   */
  @Get('health')
  healthCheck(): { status: string; timestamp: Date } {
    return {
      status: 'ok',
      timestamp: new Date(),
    };
  }
}
