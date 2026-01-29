import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { Status, FunnelStep } from '@prisma/client';
import { SessionService } from './session.service';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
  ) {}

  async findOrCreateConversation(phoneNumber: string) {
    let conversation = await this.prisma.conversation.findUnique({
      where: { phoneNumber },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          phoneNumber,
          status: Status.active,
          funnelStep: FunnelStep.collect_name,
          lastActivity: new Date(),
        },
      });
    } else {
      const isExpired = this.sessionService.isExpired(conversation.lastActivity);
      if (isExpired && conversation.status === Status.active) {
        conversation = await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { status: Status.expired },
        });
      }
    }

    return conversation;
  }

  async updateConversation(
    phoneNumber: string,
    data: {
      status?: Status;
      funnelStep?: FunnelStep;
      name?: string;
      birthDate?: Date;
      weightLossReason?: string;
      qualified?: boolean;
    },
  ) {
    return this.prisma.conversation.update({
      where: { phoneNumber },
      data: {
        ...data,
        lastActivity: new Date(),
      },
    });
  }

  async getConversationStatus(phoneNumber: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { phoneNumber },
    });

    if (!conversation) {
      return null;
    }

    const isExpired = this.sessionService.isExpired(conversation.lastActivity);
    if (isExpired && conversation.status === Status.active) {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: Status.expired },
      });
      conversation.status = Status.expired;
    }

    return {
      phoneNumber: conversation.phoneNumber,
      status: conversation.status,
      funnelStep: conversation.funnelStep,
      variables: {
        name: conversation.name || undefined,
        birthDate: conversation.birthDate
          ? conversation.birthDate.toISOString().split('T')[0]
          : undefined,
        weightLossReason: conversation.weightLossReason || undefined,
      },
    };
  }

  async createMessage(
    conversationId: string,
    role: string,
    content: string,
  ) {
    return this.prisma.message.create({
      data: {
        conversationId,
        role,
        content,
      },
    });
  }

  async getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
    });
  }
}
