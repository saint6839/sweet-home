import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { PrismaService } from '../database/prisma.service';

describe('CrawlerController', () => {
  let controller: CrawlerController;

  const mockCrawlerService = {
    crawlAllDistricts: jest.fn(),
    crawlByDistrict: jest.fn(),
    syncToDatabase: jest.fn(),
    getDistrictsList: jest.fn(),
  };

  const mockPrismaService = {
    housingComplex: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrawlerController],
      providers: [
        {
          provide: CrawlerService,
          useValue: mockCrawlerService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<CrawlerController>(CrawlerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return ok status', () => {
      const result = controller.healthCheck();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getDistrictsList', () => {
    it('should return list of districts', () => {
      const mockDistricts = [
        { name: '전체', selector: 'button:has-text("전체")' },
        { name: '강남구', selector: 'button:has-text("강남구")' },
      ];
      mockCrawlerService.getDistrictsList.mockReturnValue(mockDistricts);

      const result = controller.getDistrictsList();
      expect(result.districts).toEqual(['전체', '강남구']);
    });
  });

  describe('crawlAllHousingComplexes', () => {
    it('should return crawl result on success', async () => {
      const mockResult = {
        success: true,
        data: [
          {
            name: '테스트 단지',
            district: '강남구',
            address: '서울시 강남구',
          },
        ],
        totalCount: 1,
        crawledAt: new Date(),
      };
      mockCrawlerService.crawlAllDistricts.mockResolvedValue(mockResult);

      const result = await controller.crawlAllHousingComplexes();
      expect(result.success).toBe(true);
      expect(result.totalCount).toBe(1);
    });
  });
});

