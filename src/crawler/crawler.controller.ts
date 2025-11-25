import { Controller, Get, Post, Query, Logger } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { CrawlResultDto } from './dto/crawl-result.dto';
import { CrawlDistrictQueryDto } from './dto/crawl-district-query.dto';

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
  async crawlHousingComplexes(
    @Query() query: CrawlDistrictQueryDto,
  ): Promise<CrawlResultDto> {
    this.logger.log(
      `Received request to crawl housing complexes. District: ${query.district}`,
    );
    return this.crawlerService.crawlByDistrict(query.district);
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
  }> {
    this.logger.log('Received request to sync housing complexes to database');

    const result = await this.crawlerService.syncToDatabase();

    return {
      success: true,
      savedCount: result.savedCount,
      message: `Successfully synced ${result.savedCount} housing complexes to database`,
    };
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
