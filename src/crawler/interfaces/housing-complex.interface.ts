/**
 * Interface for housing complex data structure
 */
export interface IHousingComplex {
  name: string;
  district: string;
  address?: string;
  imageUrl?: string;
  detailUrl?: string;
  description?: string;
}

/**
 * Interface for crawling result
 */
export interface ICrawlResult {
  success: boolean;
  data: IHousingComplex[];
  totalCount: number;
  crawledAt: Date;
  error?: string;
}

/**
 * Interface for district (지역구)
 */
export interface IDistrict {
  name: string;
  selector: string;
}

