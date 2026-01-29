import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from './rag.service';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';

jest.mock('@langchain/openai');
jest.mock('@pinecone-database/pinecone');

describe('RagService', () => {
  let service: RagService;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.PINECONE_API_KEY = 'pcsk_test';
    process.env.PINECONE_INDEX_NAME = 'test-index';
    process.env.RAG_QUALIFIED_SCORE_THRESHOLD = '0.75';

    const module: TestingModule = await Test.createTestingModule({
      providers: [RagService],
    }).compile();

    service = module.get<RagService>(RagService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return threshold', () => {
    const threshold = service.getThreshold();
    expect(threshold).toBe(0.75);
  });

  it('should query similar reasons and return score', async () => {
    const mockEmbedding = [0.1, 0.2, 0.3];
    const mockIndex = {
      query: jest.fn().mockResolvedValue({
        matches: [{ score: 0.85 }],
      }),
    };
    const mockPinecone = {
      index: jest.fn().mockReturnValue(mockIndex),
    };
    (Pinecone as unknown as jest.Mock).mockImplementation(() => mockPinecone);

    (OpenAIEmbeddings as unknown as jest.Mock).mockImplementation(() => ({
      embedQuery: jest.fn().mockResolvedValue(mockEmbedding),
    }));

    const newService = new RagService();
    const score = await newService.querySimilarReasons('test reason');

    expect(score).toBe(0.85);
  });

  it('should return 0 when no matches found', async () => {
    const mockEmbedding = [0.1, 0.2, 0.3];
    const mockIndex = {
      query: jest.fn().mockResolvedValue({
        matches: [],
      }),
    };
    const mockPinecone = {
      index: jest.fn().mockReturnValue(mockIndex),
    };
    (Pinecone as unknown as jest.Mock).mockImplementation(() => mockPinecone);

    (OpenAIEmbeddings as unknown as jest.Mock).mockImplementation(() => ({
      embedQuery: jest.fn().mockResolvedValue(mockEmbedding),
    }));

    const newService = new RagService();
    const score = await newService.querySimilarReasons('test reason');

    expect(score).toBe(0);
  });

  it('should return true for qualified reason', async () => {
    jest.spyOn(service, 'querySimilarReasons').mockResolvedValue(0.85);

    const isQualified = await service.isQualified('strong reason');

    expect(isQualified).toBe(true);
  });

  it('should return false for non-qualified reason', async () => {
    jest.spyOn(service, 'querySimilarReasons').mockResolvedValue(0.5);

    const isQualified = await service.isQualified('weak reason');

    expect(isQualified).toBe(false);
  });
});
