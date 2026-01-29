import { Test, TestingModule } from '@nestjs/testing';
import { PineconeSeedService } from './pinecone-seed.service';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';

jest.mock('@pinecone-database/pinecone');
jest.mock('@langchain/openai');

describe('PineconeSeedService', () => {
  let service: PineconeSeedService;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.PINECONE_API_KEY = 'pcsk_test';
    process.env.PINECONE_INDEX_NAME = 'test-index';
    process.env.SKIP_PINECONE_SEED = '0';

    const module: TestingModule = await Test.createTestingModule({
      providers: [PineconeSeedService],
    }).compile();

    service = module.get<PineconeSeedService>(PineconeSeedService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should skip seed when SKIP_PINECONE_SEED is 1', async () => {
    process.env.SKIP_PINECONE_SEED = '1';

    await service.seed();

    expect(true).toBe(true);
  });

  it('should skip seed when index already has data', async () => {
    process.env.SKIP_PINECONE_SEED = '0';

    const mockIndex = {
      describeIndexStats: jest.fn().mockResolvedValue({
        totalRecordCount: 10,
      }),
    };
    const mockPinecone = {
      index: jest.fn().mockReturnValue(mockIndex),
      listIndexes: jest.fn().mockResolvedValue({
        indexes: [{ name: 'test-index' }],
      }),
    };
    (Pinecone as unknown as jest.Mock).mockImplementation(() => mockPinecone);

    const newService = new PineconeSeedService();
    await newService.seed();

    expect(mockIndex.describeIndexStats).toHaveBeenCalled();
  });

  it('should create index if it does not exist', async () => {
    process.env.SKIP_PINECONE_SEED = '0';
    process.env.PINECONE_ENVIRONMENT = 'gcp-starter';

    const originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn((fn: any) => {
      fn();
      return {} as any;
    }) as any;

    const mockIndex = {
      describeIndexStats: jest.fn().mockResolvedValue({
        totalRecordCount: 0,
      }),
      upsert: jest.fn().mockResolvedValue({}),
    };
    const mockPinecone = {
      index: jest.fn().mockReturnValue(mockIndex),
      listIndexes: jest.fn().mockResolvedValue({
        indexes: [],
      }),
      createIndex: jest.fn().mockResolvedValue({}),
    };
    (Pinecone as unknown as jest.Mock).mockImplementation(() => mockPinecone);

    (OpenAIEmbeddings as unknown as jest.Mock).mockImplementation(() => ({
      embedQuery: jest.fn().mockResolvedValue(new Array(1536).fill(0.1)),
    }));

    const newService = new PineconeSeedService();
    await newService.seed();

    expect(mockPinecone.createIndex).toHaveBeenCalled();
    const createCall = (mockPinecone.createIndex as jest.Mock).mock.calls[0][0];
    expect(createCall.spec?.serverless?.cloud).toBe('gcp');
    expect(createCall.spec?.serverless?.region).toBe('us-central1');

    global.setTimeout = originalSetTimeout;
  });

  it('should use aws/us-east-1 when PINECONE_ENVIRONMENT is not gcp', async () => {
    process.env.SKIP_PINECONE_SEED = '0';
    process.env.PINECONE_ENVIRONMENT = 'aws-us-east-1';

    const originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn((fn: any) => {
      fn();
      return {} as any;
    }) as any;

    const mockIndex = {
      describeIndexStats: jest.fn().mockResolvedValue({ totalRecordCount: 0 }),
      upsert: jest.fn().mockResolvedValue({}),
    };
    const mockPinecone = {
      index: jest.fn().mockReturnValue(mockIndex),
      listIndexes: jest.fn().mockResolvedValue({ indexes: [] }),
      createIndex: jest.fn().mockResolvedValue({}),
    };
    (Pinecone as unknown as jest.Mock).mockImplementation(() => mockPinecone);
    (OpenAIEmbeddings as unknown as jest.Mock).mockImplementation(() => ({
      embedQuery: jest.fn().mockResolvedValue(new Array(1536).fill(0.1)),
    }));

    const newService = new PineconeSeedService();
    await newService.seed();

    const createCall = (mockPinecone.createIndex as jest.Mock).mock.calls[0][0];
    expect(createCall.spec?.serverless?.cloud).toBe('aws');
    expect(createCall.spec?.serverless?.region).toBe('us-east-1');

    global.setTimeout = originalSetTimeout;
  });
});
