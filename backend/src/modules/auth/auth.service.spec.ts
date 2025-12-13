import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SupabaseService } from '../../common/supabase/supabase.service';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseService: SupabaseService;

  const mockSupabaseService = {
    getServiceClient: jest.fn(() => ({
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
      },
      from: jest.fn(() => ({
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      })),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('should create a new user', async () => {
      const signUpDto = {
        email: 'test@example.com',
        password: 'Test123!',
        fullName: 'Test User',
      };

      const mockAuthUser = {
        user: { id: 'user-123', email: signUpDto.email },
        session: { access_token: 'token', refresh_token: 'refresh' },
      };

      mockSupabaseService.getServiceClient().auth.signUp.mockResolvedValue({
        data: mockAuthUser,
        error: null,
      });

      const result = await service.signUp(signUpDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
    });
  });

  describe('signIn', () => {
    it('should sign in existing user', async () => {
      const signInDto = {
        email: 'test@example.com',
        password: 'Test123!',
      };

      const mockAuthUser = {
        user: { id: 'user-123', email: signInDto.email },
        session: { access_token: 'token', refresh_token: 'refresh' },
      };

      mockSupabaseService.getServiceClient().auth.signInWithPassword.mockResolvedValue({
        data: mockAuthUser,
        error: null,
      });

      const result = await service.signIn(signInDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
    });
  });
});
