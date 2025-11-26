import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as crypto from 'crypto';
import { IHousingComplex, ICrawlResult, IDistrict } from './interfaces/housing-complex.interface';
import { PrismaService } from '../database/prisma.service';

/**
 * Service for crawling housing complex data from Seoul Youth Housing website
 */
@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly targetUrl = 'https://soco.seoul.go.kr/youth/main/main.do';
  private readonly districts: IDistrict[] = [
    { name: '전체', selector: 'button:has-text("전체")' },
    { name: '강남구', selector: 'button:has-text("강남구")' },
    { name: '강동구', selector: 'button:has-text("강동구")' },
    { name: '강북구', selector: 'button:has-text("강북구")' },
    { name: '강서구', selector: 'button:has-text("강서구")' },
    { name: '관악구', selector: 'button:has-text("관악구")' },
    { name: '광진구', selector: 'button:has-text("광진구")' },
    { name: '구로구', selector: 'button:has-text("구로구")' },
    { name: '금천구', selector: 'button:has-text("금천구")' },
    { name: '노원구', selector: 'button:has-text("노원구")' },
    { name: '도봉구', selector: 'button:has-text("도봉구")' },
    { name: '동대문구', selector: 'button:has-text("동대문구")' },
    { name: '동작구', selector: 'button:has-text("동작구")' },
    { name: '마포구', selector: 'button:has-text("마포구")' },
    { name: '서대문구', selector: 'button:has-text("서대문구")' },
    { name: '서초구', selector: 'button:has-text("서초구")' },
    { name: '성동구', selector: 'button:has-text("성동구")' },
    { name: '성북구', selector: 'button:has-text("성북구")' },
    { name: '송파구', selector: 'button:has-text("송파구")' },
    { name: '양천구', selector: 'button:has-text("양천구")' },
    { name: '영등포구', selector: 'button:has-text("영등포구")' },
    { name: '용산구', selector: 'button:has-text("용산구")' },
    { name: '은평구', selector: 'button:has-text("은평구")' },
    { name: '종로구', selector: 'button:has-text("종로구")' },
    { name: '중구', selector: 'button:has-text("중구")' },
    { name: '중랑구', selector: 'button:has-text("중랑구")' },
  ];

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Crawl all housing complexes from all districts
   */
  async crawlAllDistricts(): Promise<ICrawlResult> {
    this.logger.log('Starting to crawl all districts');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      const allComplexes: IHousingComplex[] = [];

      for (const district of this.districts) {
        this.logger.log(`Crawling district: ${district.name}`);
        const complexes = await this.crawlDistrictPage(page, district);
        allComplexes.push(...complexes);

        // Add small delay between districts to avoid overwhelming the server
        await this.delay(1000);
      }

      const result: ICrawlResult = {
        success: true,
        data: allComplexes,
        totalCount: allComplexes.length,
        crawledAt: new Date(),
      };

      this.logger.log(`Crawling completed. Total complexes: ${allComplexes.length}`);
      return result;
    } catch (error) {
      this.logger.error('Crawling failed', error);
      throw new InternalServerErrorException('Failed to crawl all districts');
    } finally {
      await browser.close();
    }
  }

  /**
   * Crawl housing complexes from a specific district
   */
  async crawlByDistrict(districtName: string): Promise<ICrawlResult> {
    this.logger.log(`Starting to crawl district: ${districtName}`);

    const district = this.districts.find((d) => d.name === districtName);
    if (!district) {
      throw new BadRequestException(`District not found: ${districtName}`);
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      const complexes = await this.crawlDistrictPage(page, district);

      const result: ICrawlResult = {
        success: true,
        data: complexes,
        totalCount: complexes.length,
        crawledAt: new Date(),
      };

      this.logger.log(`District crawling completed. Found ${complexes.length} complexes`);
      return result;
    } catch (error) {
      this.logger.error(`District crawling failed: ${districtName}`, error);
      throw new InternalServerErrorException(`Failed to crawl district: ${districtName}`);
    } finally {
      await browser.close();
    }
  }

  /**
   * Crawl and sync data to database, returning changed items
   */
  async syncToDatabase(): Promise<{ success: boolean; savedCount: number; changes: IHousingComplex[] }> {
    this.logger.log('Starting sync to database');

    try {
      // Only crawl '전체' district
      const crawlResult = await this.crawlByDistrict('전체');
      
      const changes: IHousingComplex[] = [];
      const existingComplexes = await this.prismaService.housingComplex.findMany();

      // Create a map for faster lookup
      const existingMap = new Map<string, string | null>(); // key: name+district, value: dataHash
      existingComplexes.forEach(c => {
        existingMap.set(`${c.name}-${c.district}`, c.dataHash);
      });

      // Update or Create
      for (const complex of crawlResult.data) {
        const hash = this.computeHash(complex);
        const key = `${complex.name}-${complex.district}`;
        const existingHash = existingMap.get(key);

        // If it's a new item or hash is different
        if (!existingMap.has(key) || existingHash !== hash) {
          // Upsert logic
          // We need to find the ID if it exists to update it, otherwise create.
          // Since we don't have unique constraints on name+district easily usable in upsert without composite key,
          // we'll search first.
          const existingRecord = existingComplexes.find(c => c.name === complex.name && c.district === complex.district);

          if (existingRecord) {
             await this.prismaService.housingComplex.update({
                where: { id: existingRecord.id },
                data: {
                  address: complex.address,
                  imageUrl: complex.imageUrl,
                  detailUrl: complex.detailUrl,
                  description: complex.description,
                  dataHash: hash,
                },
             });
             // Only track as "changed" if it existed before (modification), or maybe new ones too?
             // User said: "이전에 저장했던 상태에서 바뀌어서 상태가 발생할때마다" -> implying updates.
             // But new items are also technically changes. Let's include updates where description changed.
             // The user specifically mentioned "description" (status) changes.
             // Let's check if description changed specifically for better notification quality.
             if (existingRecord.description !== complex.description) {
                changes.push(complex);
             }
          } else {
             await this.prismaService.housingComplex.create({
                data: {
                  name: complex.name,
                  district: complex.district,
                  address: complex.address,
                  imageUrl: complex.imageUrl,
                  detailUrl: complex.detailUrl,
                  description: complex.description,
                  dataHash: hash,
                },
             });
             // New item
             // changes.push(complex); // Uncomment if we want to notify about new items too
          }
        }
      }

      // We are not deleting old items that are no longer in the crawl result for now,
      // as they might just be temporarily unavailable or moved to another page.
      // But usually sync implies mirroring state.
      // If we want to delete items that are gone:
      // 1. Collect all IDs processed.
      // 2. Delete where ID not in processed list.
      // Keeping it simple as per request (focus on updates).

      this.logger.log(`Sync completed. Saved ${crawlResult.data.length} complexes. Changes detected: ${changes.length}`);

      return {
        success: true,
        savedCount: crawlResult.data.length,
        changes,
      };
    } catch (error) {
      this.logger.error('Sync to database failed', error);
      throw new InternalServerErrorException('Failed to sync to database');
    }
  }

  /**
   * Compute hash for change detection
   */
  private computeHash(complex: IHousingComplex): string {
    const data = `${complex.name}|${complex.district}|${complex.address}|${complex.detailUrl}|${complex.description}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Crawl a specific district page
   */
  private async crawlDistrictPage(
    page: puppeteer.Page,
    district: IDistrict,
  ): Promise<IHousingComplex[]> {
    try {
      // Navigate to the page
      await page.goto(this.targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      // Wait for the initial list to be loaded by JavaScript
      await page.waitForSelector('ul.theme_list li .theme_detail h3', { timeout: 30000 });
      this.logger.log('Initial list loaded');

      // Find and click district button if not "전체"
      if (district.name !== '전체') {
        const districtButtons = await page.$$('ul.theme_cate li button');

        let buttonClicked = false;
        for (const button of districtButtons) {
          const buttonText = await button.evaluate((el) => el.textContent?.trim());
          if (buttonText === district.name) {
            await button.click();
            this.logger.log(`Clicked button for ${district.name}`);
            buttonClicked = true;
            break;
          }
        }

        if (buttonClicked) {
          // Wait for the list to be updated after clicking
          await this.delay(2000);
          // Wait for the new list to load
          await page.waitForSelector('ul.theme_list li .theme_detail h3', { timeout: 10000 });
          await this.delay(1000); // Additional safety delay
        }
      } else {
        // For "전체", just wait a bit more to ensure everything is loaded
        await this.delay(1000);
      }

      // Extract housing complex data from list items
      const complexes = await page.evaluate((districtName) => {
        const listItems = document.querySelectorAll('ul.theme_list li, ul.theme_slider li');
        const results: any[] = [];

        listItems.forEach((item) => {
          // Skip cloned slides (slick slider creates clones)
          if (item.classList.contains('slick-cloned')) {
            return;
          }

          // Get name from h3
          const nameElement = item.querySelector('.theme_detail h3');
          const name = nameElement?.textContent?.trim();

          if (!name) {
            return;
          }

          // Get subway line info
          const subwayParagraphs = item.querySelectorAll('.theme_detail p');
          let subway = '';
          let address = '';

          subwayParagraphs.forEach((p) => {
            const text = p.textContent?.trim() || '';
            if (text.includes('지하철역')) {
              const spanText = p.querySelector('span')?.textContent?.trim() || '';
              subway = text.replace(spanText, '').trim();
            } else if (text.includes('주소')) {
              const spanText = p.querySelector('span')?.textContent?.trim() || '';
              address = text.replace(spanText, '').trim();
            }
          });

          // Get image
          const imageElement = item.querySelector('.thum img');
          const imageUrl = imageElement?.getAttribute('src') || undefined;

          // Get link (extract ID from javascript:homeView(ID))
          const linkElement = item.querySelector('a');
          const href = linkElement?.getAttribute('href') || '';
          const idMatch = href.match(/homeView\((\d+)\)/);
          const detailUrl = idMatch
            ? `https://soco.seoul.go.kr/youth/pgm/home/yohome/view.do?menuNo=400002&homeCode=${idMatch[1]}`
            : undefined;

          // Get status icons
          const iconElements = item.querySelectorAll('.icon span');
          const statuses: string[] = [];
          iconElements.forEach((icon) => {
            const statusText = icon.textContent?.trim().replace(/\s+/g, ' ');
            if (statusText) {
              statuses.push(statusText);
            }
          });

          const description = statuses.length > 0
            ? `상태: ${statuses.join(', ')} | 지하철: ${subway}`
            : `지하철: ${subway}`;

          results.push({
            name,
            district: districtName,
            address: address || undefined,
            imageUrl: imageUrl ? `https://soco.seoul.go.kr${imageUrl}` : undefined,
            detailUrl,
            description,
          });
        });

        return results;
      }, district.name);

      this.logger.log(`Found ${complexes.length} complexes in ${district.name}`);
      return complexes;
    } catch (error) {
      this.logger.error(`Failed to crawl district: ${district.name}`, error);
      return [];
    }
  }

  /**
   * Helper method to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all districts list
   */
  getDistrictsList(): IDistrict[] {
    return this.districts;
  }
}
