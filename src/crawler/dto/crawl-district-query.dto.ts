import { IsNotEmpty, IsString } from 'class-validator';

export class CrawlDistrictQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'District parameter is required' })
  district!: string;
}

