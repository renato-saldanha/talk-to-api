import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env.SESSION_EXPIRY_MINUTES = '15';
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionService],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return false for non-expired session', () => {
    const lastActivity = new Date();
    const isExpired = service.isExpired(lastActivity);
    expect(isExpired).toBe(false);
  });

  it('should return true for expired session', () => {
    const lastActivity = new Date(Date.now() - 16 * 60 * 1000);
    const isExpired = service.isExpired(lastActivity);
    expect(isExpired).toBe(true);
  });

  it('should return false for session just under expiry limit', () => {
    const lastActivity = new Date(Date.now() - 14 * 60 * 1000);
    const isExpired = service.isExpired(lastActivity);
    expect(isExpired).toBe(false);
  });

  it('should return expiry minutes', () => {
    const minutes = service.getExpiryMinutes();
    expect(minutes).toBe(15);
  });
});
