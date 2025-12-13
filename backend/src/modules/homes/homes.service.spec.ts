import { Test, TestingModule } from '@nestjs/testing';
import { HomesService } from './homes.service';
import { SupabaseService } from '../../common/supabase/supabase.service';

describe('HomesService', () => {
  let service: HomesService;

  const mockSupabaseService = {
    getServiceClient: jest.fn(() => ({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        order: jest.fn().mockReturnThis(),
      })),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomesService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<HomesService>(HomesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new home', async () => {
      const createHomeDto = {
        name: 'My Smart Home',
        address_line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        timezone: 'America/Los_Angeles',
      };

      const mockHome = {
        id: 'home-123',
        ...createHomeDto,
        created_at: new Date().toISOString(),
      };

      mockSupabaseService.getServiceClient().from().single.mockResolvedValue({
        data: mockHome,
        error: null,
      });

      const result = await service.create(createHomeDto, 'user-123');

      expect(result).toBeDefined();
    });
  });
});
