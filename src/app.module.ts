import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './core/database/database.module';
import { ConversationsModule } from './conversations/conversations.module';
import { LangGraphAgentModule } from './agents/langgraph-agent.module';
import { PineconeSeedService } from './services/pinecone-seed.service';
import { RagService } from './services/rag.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    HealthModule,
    ConversationsModule,
    LangGraphAgentModule,
  ],
  providers: [PineconeSeedService, RagService],
  exports: [PineconeSeedService],
})
export class AppModule {}
