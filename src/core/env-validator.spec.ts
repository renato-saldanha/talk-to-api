import { validateEnvironment } from './env-validator';

describe('EnvValidator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should validate successfully when all required vars are present', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.OPENAI_API_KEY = 'sk-test123';
    process.env.PINECONE_API_KEY = 'pcsk_test123';
    process.env.PINECONE_INDEX_NAME = 'test-index';
    process.env.PINECONE_ENVIRONMENT = 'gcp-starter';

    expect(() => validateEnvironment()).not.toThrow();
  });

  it('should throw error when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    process.env.OPENAI_API_KEY = 'sk-test123';
    process.env.PINECONE_API_KEY = 'pcsk_test123';
    process.env.PINECONE_INDEX_NAME = 'test-index';
    process.env.PINECONE_ENVIRONMENT = 'gcp-starter';

    expect(() => validateEnvironment()).toThrow('Missing required environment variables');
  });

  it('should throw error when DATABASE_URL format is invalid', () => {
    process.env.DATABASE_URL = 'invalid-url';
    process.env.OPENAI_API_KEY = 'sk-test123';
    process.env.PINECONE_API_KEY = 'pcsk_test123';
    process.env.PINECONE_INDEX_NAME = 'test-index';
    process.env.PINECONE_ENVIRONMENT = 'gcp-starter';

    expect(() => validateEnvironment()).toThrow('DATABASE_URL must be a valid PostgreSQL connection string');
  });

  it('should throw error when OPENAI_API_KEY format is invalid', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.OPENAI_API_KEY = 'invalid-key';
    process.env.PINECONE_API_KEY = 'pcsk_test123';
    process.env.PINECONE_INDEX_NAME = 'test-index';
    process.env.PINECONE_ENVIRONMENT = 'gcp-starter';

    expect(() => validateEnvironment()).toThrow('OPENAI_API_KEY must be a valid OpenAI API key');
  });

  it('should throw error when PINECONE_API_KEY format is invalid', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.OPENAI_API_KEY = 'sk-test123';
    process.env.PINECONE_API_KEY = 'invalid-key';
    process.env.PINECONE_INDEX_NAME = 'test-index';
    process.env.PINECONE_ENVIRONMENT = 'gcp-starter';

    expect(() => validateEnvironment()).toThrow('PINECONE_API_KEY must be a valid Pinecone API key');
  });
});
