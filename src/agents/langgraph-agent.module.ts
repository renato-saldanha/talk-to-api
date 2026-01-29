import { Module } from "@nestjs/common";
import { LangGraphAgentService } from "./langgraph-agent.service";
import { RagService } from "../services/rag.service";

@Module({
  providers: [LangGraphAgentService, RagService],
  exports: [LangGraphAgentService, RagService],
})
export class LangGraphAgentModule {}
