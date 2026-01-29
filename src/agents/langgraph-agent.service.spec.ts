import { Test, TestingModule } from "@nestjs/testing";
import { LangGraphAgentService } from "./langgraph-agent.service";
import { RagService } from "../services/rag.service";
import { FunnelStep } from "@prisma/client";

describe("LangGraphAgentService", () => {
  let service: LangGraphAgentService;
  let ragService: RagService;

  beforeAll(() => {
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sk-fake";
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LangGraphAgentService,
        {
          provide: RagService,
          useValue: {
            isQualified: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LangGraphAgentService>(LangGraphAgentService);
    ragService = module.get<RagService>(RagService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should process message and return state", async () => {
    jest.spyOn(ragService, "isQualified").mockResolvedValue(true);

    const result = await service.processMessage(
      "5511999999999",
      [{ role: "user", content: "Hello" }],
      {
        name: null,
        birthDate: null,
        weightLossReason: null,
        qualified: null,
        funnelStep: FunnelStep.collect_name,
      },
    );

    expect(result).toBeDefined();
    expect(result.phoneNumber).toBe("5511999999999");
    expect(result.messages).toHaveLength(1);
  });
});
