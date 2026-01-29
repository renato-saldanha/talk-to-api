import { Injectable } from '@nestjs/common';
import { ConversationService } from '../services/conversation.service';
import { LangGraphAgentService } from '../agents/langgraph-agent.service';
import { Status, FunnelStep } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly langGraphAgent: LangGraphAgentService,
  ) {}

  async processMessage(phoneNumber: string, content: string) {
    const conversation = await this.conversationService.findOrCreateConversation(
      phoneNumber,
    );

    if (conversation.status === Status.expired) {
      throw new Error('Conversation has expired');
    }

    if (
      conversation.status === Status.qualified ||
      conversation.status === Status.rejected
    ) {
      throw new Error('Conversation is already finished');
    }

    await this.conversationService.createMessage(
      conversation.id,
      'user',
      content,
    );

    const messages = await this.conversationService.getMessages(
      conversation.id,
    );

    const messageHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const agentState = await this.langGraphAgent.processMessage(
      phoneNumber,
      messageHistory,
      {
        name: conversation.name,
        birthDate: conversation.birthDate
          ? conversation.birthDate.toISOString().split('T')[0]
          : null,
        weightLossReason: conversation.weightLossReason,
        qualified: conversation.qualified,
        funnelStep: conversation.funnelStep,
      },
    );

    const updateData: any = {
      name: agentState.name,
      birthDate: agentState.birthDate
        ? new Date(agentState.birthDate)
        : undefined,
      weightLossReason: agentState.weightLossReason,
      qualified: agentState.qualified,
      funnelStep: agentState.funnelStep,
    };

    if (agentState.funnelStep === FunnelStep.qualified) {
      updateData.status = Status.qualified;
      updateData.finishedAt = new Date();
    } else if (agentState.funnelStep === FunnelStep.rejected) {
      updateData.status = Status.rejected;
      updateData.finishedAt = new Date();
    }

    await this.conversationService.updateConversation(phoneNumber, updateData);

    if (agentState.response) {
      await this.conversationService.createMessage(
        conversation.id,
        'assistant',
        agentState.response,
      );
    }

    const updatedConversation = await this.conversationService.findOrCreateConversation(
      phoneNumber,
    );

    return {
      type: 'text',
      content: agentState.response || 'Desculpe, ocorreu um erro.',
      conversation: {
        phoneNumber: updatedConversation.phoneNumber,
        status: updatedConversation.status,
        funnelStep: updatedConversation.funnelStep,
        variables: {
          name: updatedConversation.name || undefined,
          birthDate: updatedConversation.birthDate
            ? updatedConversation.birthDate.toISOString().split('T')[0]
            : undefined,
          weightLossReason: updatedConversation.weightLossReason || undefined,
        },
      },
    };
  }

  async getStatus(phoneNumber: string) {
    return this.conversationService.getConversationStatus(phoneNumber);
  }
}
