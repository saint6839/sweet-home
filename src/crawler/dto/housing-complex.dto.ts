import { IsString, IsOptional, IsUrl, IsNotEmpty } from 'class-validator';

/**
 * DTO for housing complex data
 */
export class HousingComplexDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  district!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsUrl()
  @IsOptional()
  detailUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO for crawl request by district
 */
export class CrawlByDistrictDto {
  @IsString()
  @IsNotEmpty()
  district!: string;
}

