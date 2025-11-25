import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from './crawler.service';
import { PrismaService } from '../database/prisma.service';

describe('CrawlerService', () => {
  let service: CrawlerService;

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
      providers: [
        CrawlerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDistrictsList', () => {
    it('should return array of districts', () => {
      const districts = service.getDistrictsList();
      expect(Array.isArray(districts)).toBe(true);
      expect(districts.length).toBe(26); // 전체 + 25개 구
      expect(districts[0].name).toBe('전체');
    });
  });
});
