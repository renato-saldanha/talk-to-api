import { Test, TestingModule } from "@nestjs/testing";
import { HealthService } from "./health.service";
import { PrismaService } from "../core/prisma/prisma.service";
import { Pinecone } from "@pinecone-database/pinecone";

jest.mock("@pinecone-database/pinecone");

describe("HealthService", () => {
  let service: HealthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return ok status when both services are connected", async () => {
    jest
      .spyOn(prismaService, "$queryRaw")
      .mockResolvedValue([{ "?column?": 1 }]);

    const mockIndex = {
      describeIndexStats: jest.fn().mockResolvedValue({ totalRecordCount: 0 }),
    };
    const mockPinecone = {
      index: jest.fn().mockReturnValue(mockIndex),
    };
    (Pinecone as jest.Mock).mockImplementation(() => mockPinecone);

    process.env.PINECONE_API_KEY = "pcsk_test";
    process.env.PINECONE_INDEX_NAME = "test-index";

    const result = await service.checkHealth();

    expect(result.status).toBe("ok");
    expect(result.database).toBe("connected");
    expect(result.pinecone).toBe("connected");
  });

  it("should return error when database is disconnected", async () => {
    jest
      .spyOn(prismaService, "$queryRaw")
      .mockRejectedValue(new Error("Connection failed"));

    const result = await service.checkHealth();

    expect(result.status).toBe("error");
    expect(result.database).toBe("disconnected");
  });

  it("should return error when Pinecone is disconnected", async () => {
    jest
      .spyOn(prismaService, "$queryRaw")
      .mockResolvedValue([{ "?column?": 1 }]);

    const mockPinecone = {
      index: jest.fn().mockImplementation(() => {
        throw new Error("Pinecone error");
      }),
    };
    (Pinecone as jest.Mock).mockImplementation(() => mockPinecone);

    process.env.PINECONE_API_KEY = "pcsk_test";
    process.env.PINECONE_INDEX_NAME = "test-index";

    const result = await service.checkHealth();

    expect(result.status).toBe("error");
    expect(result.pinecone).toBe("disconnected");
  });

  it("should return error when both database and Pinecone are disconnected", async () => {
    jest
      .spyOn(prismaService, "$queryRaw")
      .mockRejectedValue(new Error("Connection failed"));

    const mockPinecone = {
      index: jest.fn().mockImplementation(() => {
        throw new Error("Pinecone error");
      }),
    };
    (Pinecone as jest.Mock).mockImplementation(() => mockPinecone);

    process.env.PINECONE_API_KEY = "pcsk_test";
    process.env.PINECONE_INDEX_NAME = "test-index";

    const result = await service.checkHealth();

    expect(result.status).toBe("error");
    expect(result.database).toBe("disconnected");
    expect(result.pinecone).toBe("disconnected");
  });
});
