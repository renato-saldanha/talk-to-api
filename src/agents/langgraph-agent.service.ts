import { Injectable } from '@nestjs/common';
import { ConversationState } from './state/conversation-state';
import { createFunnelGraph } from './graph/funnel-graph';
import { RagService } from '../services/rag.service';
import { FunnelStep } from '@prisma/client';

@Injectable()
export class LangGraphAgentService {
  private graph: ReturnType<typeof createFunnelGraph>;

  constructor(private readonly ragService: RagService) {
    this.graph = createFunnelGraph(this.ragService);
  }

  async processMessage(
    phoneNumber: string,
    messages: Array<{ role: string; content: string }>,
    currentState: {
      name?: string | null;
      birthDate?: string | null;
      weightLossReason?: string | null;
      qualified?: boolean | null;
      funnelStep: FunnelStep;
    },
  ): Promise<ConversationState> {
    const initialState: ConversationState = {
      phoneNumber,
      messages,
      name: currentState.name || null,
      birthDate: currentState.birthDate || null,
      weightLossReason: currentState.weightLossReason || null,
      qualified: currentState.qualified || null,
      funnelStep: currentState.funnelStep,
    };

    const result = await this.graph.invoke(initialState);

    return {
      phoneNumber: result.phoneNumber || phoneNumber,
      messages: result.messages || messages,
      name: result.name ?? currentState.name ?? null,
      birthDate: result.birthDate ?? currentState.birthDate ?? null,
      weightLossReason: result.weightLossReason ?? currentState.weightLossReason ?? null,
      qualified: result.qualified ?? currentState.qualified ?? null,
      funnelStep: result.funnelStep || currentState.funnelStep,
      response: result.response,
    };
  }
}
