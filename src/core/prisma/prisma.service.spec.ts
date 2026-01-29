import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "./prisma.service";

describe("PrismaService", () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should connect on module init", async () => {
    jest.spyOn(service, "$connect").mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(service.$connect).toHaveBeenCalled();
  });

  it("should disconnect on module destroy", async () => {
    jest.spyOn(service, "$disconnect").mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(service.$disconnect).toHaveBeenCalled();
  });
});
