import { Module } from "@nestjs/common";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";
import { ConversationService } from "../services/conversation.service";
import { SessionService } from "../services/session.service";
import { LangGraphAgentModule } from "../agents/langgraph-agent.module";
import { DatabaseModule } from "../core/database/database.module";

@Module({
  imports: [LangGraphAgentModule, DatabaseModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationService, SessionService],
})
export class ConversationsModule {}
