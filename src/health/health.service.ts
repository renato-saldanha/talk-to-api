import { Injectable } from "@nestjs/common";
import { PrismaService } from "../core/prisma/prisma.service";
import { Pinecone } from "@pinecone-database/pinecone";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkHealth() {
    const health = {
      status: "ok",
      database: "disconnected",
      pinecone: "disconnected",
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.database = "connected";
    } catch (error) {
      health.status = "error";
      health.database = "disconnected";
    }

    try {
      const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
      });
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
      await index.describeIndexStats();
      health.pinecone = "connected";
    } catch (error) {
      health.status = "error";
      health.pinecone = "disconnected";
    }

    return health;
  }
}
