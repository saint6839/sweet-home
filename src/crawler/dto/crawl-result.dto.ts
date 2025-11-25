import { HousingComplexDto } from './housing-complex.dto';

/**
 * DTO for crawl result response
 */
export class CrawlResultDto {
  success!: boolean;
  data!: HousingComplexDto[];
  totalCount!: number;
  crawledAt!: Date;
  error?: string;
}

