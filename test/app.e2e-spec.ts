import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { HealthService } from "../src/health/health.service";
import { ConversationsService } from "../src/conversations/conversations.service";
import { PrismaService } from "../src/core/prisma/prisma.service";

describe("App (e2e)", () => {
  let app: INestApplication;

  beforeAll(() => {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ||
      "postgresql://user:password@localhost:5432/test";
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sk-fake";
    process.env.PINECONE_API_KEY = process.env.PINECONE_API_KEY || "pcsk_fake";
    process.env.PINECONE_INDEX_NAME =
      process.env.PINECONE_INDEX_NAME || "test-index";
    process.env.PINECONE_ENVIRONMENT =
      process.env.PINECONE_ENVIRONMENT || "gcp-starter";
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
        conversation: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        message: { create: jest.fn(), findMany: jest.fn() },
      })
      .overrideProvider(HealthService)
      .useValue({
        checkHealth: jest.fn().mockResolvedValue({
          status: "ok",
          database: "connected",
          pinecone: "connected",
        }),
      })
      .overrideProvider(ConversationsService)
      .useValue({
        processMessage: jest.fn().mockResolvedValue({
          type: "text",
          content: "Hello",
          conversation: {
            phoneNumber: "5511999999999",
            status: "active",
            funnelStep: "collect_name",
            variables: {
              name: undefined,
              birthDate: undefined,
              weightLossReason: undefined,
            },
          },
        }),
        getStatus: jest.fn().mockResolvedValue({
          phoneNumber: "5511999999999",
          status: "active",
          funnelStep: "collect_name",
          variables: {
            name: undefined,
            birthDate: undefined,
            weightLossReason: undefined,
          },
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /health", () => {
    it("returns 200 and health shape", () => {
      return request(app.getHttpServer())
        .get("/health")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("status", "ok");
          expect(res.body).toHaveProperty("database", "connected");
          expect(res.body).toHaveProperty("pinecone", "connected");
        });
    });
  });

  describe("POST /conversations/:phoneNumber/messages", () => {
    it("returns 400 when body is invalid (missing content)", () => {
      return request(app.getHttpServer())
        .post("/conversations/5511999999999/messages")
        .send({})
        .expect(400);
    });

    it("returns 400 when content is not a string", () => {
      return request(app.getHttpServer())
        .post("/conversations/5511999999999/messages")
        .send({ content: 123 })
        .expect(400);
    });

    it("returns 201 and response shape when body is valid", () => {
      return request(app.getHttpServer())
        .post("/conversations/5511999999999/messages")
        .send({ content: "Hello" })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("type", "text");
          expect(res.body).toHaveProperty("content");
          expect(res.body).toHaveProperty("conversation");
          expect(res.body.conversation).toHaveProperty(
            "phoneNumber",
            "5511999999999",
          );
          expect(res.body.conversation).toHaveProperty("status");
          expect(res.body.conversation).toHaveProperty("funnelStep");
          expect(res.body.conversation).toHaveProperty("variables");
        });
    });
  });

  describe("GET /conversations/:phoneNumber/status", () => {
    it("returns 200 and status shape", () => {
      return request(app.getHttpServer())
        .get("/conversations/5511999999999/status")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("phoneNumber", "5511999999999");
          expect(res.body).toHaveProperty("status");
          expect(res.body).toHaveProperty("funnelStep");
          expect(res.body).toHaveProperty("variables");
        });
    });
  });
});
