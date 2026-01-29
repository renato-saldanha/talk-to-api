import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsService } from './conversations.service';
import { ConversationService } from '../services/conversation.service';
import { LangGraphAgentService } from '../agents/langgraph-agent.service';
import { Status, FunnelStep } from '@prisma/client';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let conversationService: ConversationService;
  let langGraphAgent: LangGraphAgentService;

  const mockConversation = {
    id: '1',
    phoneNumber: '5511999999999',
    status: Status.active,
    funnelStep: FunnelStep.collect_name,
    lastActivity: new Date(),
    createdAt: new Date(),
    finishedAt: null,
    name: null,
    birthDate: null,
    weightLossReason: null,
    qualified: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: ConversationService,
          useValue: {
            findOrCreateConversation: jest.fn(),
            createMessage: jest.fn(),
            getMessages: jest.fn(),
            updateConversation: jest.fn(),
            getConversationStatus: jest.fn(),
          },
        },
        {
          provide: LangGraphAgentService,
          useValue: {
            processMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    conversationService = module.get<ConversationService>(ConversationService);
    langGraphAgent = module.get<LangGraphAgentService>(LangGraphAgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process message successfully', async () => {
    const agentState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_birth_date,
      response: 'What is your birth date?',
    };

    jest.spyOn(conversationService, 'findOrCreateConversation').mockResolvedValue(mockConversation);
    jest.spyOn(conversationService, 'createMessage').mockResolvedValue({} as any);
    jest.spyOn(conversationService, 'getMessages').mockResolvedValue([
      { id: '1', conversationId: '1', role: 'user', content: 'Hello', timestamp: new Date() },
    ] as any);
    jest.spyOn(langGraphAgent, 'processMessage').mockResolvedValue(agentState);
    jest.spyOn(conversationService, 'updateConversation').mockResolvedValue({
      ...mockConversation,
      name: 'John',
      funnelStep: FunnelStep.collect_birth_date,
    });

    const result = await service.processMessage('5511999999999', 'Hello');

    expect(result.type).toBe('text');
    expect(result.content).toBe('What is your birth date?');
    expect(result.conversation.phoneNumber).toBe('5511999999999');
  });

  it('should throw error for expired conversation', async () => {
    const expiredConversation = { ...mockConversation, status: Status.expired };

    jest.spyOn(conversationService, 'findOrCreateConversation').mockResolvedValue(expiredConversation);

    await expect(
      service.processMessage('5511999999999', 'Hello'),
    ).rejects.toThrow('Conversation has expired');
  });

  it('should verify expiration after 15 minutes', async () => {
    const oldDate = new Date(Date.now() - 16 * 60 * 1000);
    const expiredConversation = {
      ...mockConversation,
      lastActivity: oldDate,
      status: Status.expired,
    };

    jest.spyOn(conversationService, 'findOrCreateConversation').mockResolvedValue(expiredConversation);

    await expect(
      service.processMessage('5511999999999', 'Hello'),
    ).rejects.toThrow('Conversation has expired');
  });

  it('should throw error for finished conversation', async () => {
    const qualifiedConversation = { ...mockConversation, status: Status.qualified };

    jest.spyOn(conversationService, 'findOrCreateConversation').mockResolvedValue(qualifiedConversation);

    await expect(
      service.processMessage('5511999999999', 'Hello'),
    ).rejects.toThrow('Conversation is already finished');
  });

  it('should get status', async () => {
    const status = {
      phoneNumber: '5511999999999',
      status: Status.active,
      funnelStep: FunnelStep.collect_name,
      variables: {
        name: undefined,
        birthDate: undefined,
        weightLossReason: undefined,
      },
    };

    jest.spyOn(conversationService, 'getConversationStatus').mockResolvedValue(status);

    const result = await service.getStatus('5511999999999');

    expect(result).toEqual(status);
  });

  it('should update lastActivity when processing message', async () => {
    const agentState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_birth_date,
      response: 'Response',
    };

    jest.spyOn(conversationService, 'findOrCreateConversation').mockResolvedValue(mockConversation);
    jest.spyOn(conversationService, 'createMessage').mockResolvedValue({} as any);
    jest.spyOn(conversationService, 'getMessages').mockResolvedValue([
      { id: '1', conversationId: '1', role: 'user', content: 'Hello', timestamp: new Date() },
    ] as any);
    jest.spyOn(langGraphAgent, 'processMessage').mockResolvedValue(agentState);
    jest.spyOn(conversationService, 'updateConversation').mockResolvedValue({
      ...mockConversation,
      name: 'John',
    });

    await service.processMessage('5511999999999', 'Hello');

    expect(conversationService.updateConversation).toHaveBeenCalled();
  });

  it('should persist conversation to database', async () => {
    const agentState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_birth_date,
      response: 'Response',
    };

    jest.spyOn(conversationService, 'findOrCreateConversation').mockResolvedValue(mockConversation);
    jest.spyOn(conversationService, 'createMessage').mockResolvedValue({} as any);
    jest.spyOn(conversationService, 'getMessages').mockResolvedValue([
      { id: '1', conversationId: '1', role: 'user', content: 'Hello', timestamp: new Date() },
    ] as any);
    jest.spyOn(langGraphAgent, 'processMessage').mockResolvedValue(agentState);
    jest.spyOn(conversationService, 'updateConversation').mockResolvedValue({
      ...mockConversation,
      name: 'John',
    });

    await service.processMessage('5511999999999', 'Hello');

    expect(conversationService.createMessage).toHaveBeenCalledTimes(2);
    expect(conversationService.updateConversation).toHaveBeenCalled();
  });

  it('should return formatted response', async () => {
    const agentState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: '1990-01-01',
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_weight_loss_reason,
      response: 'What is your reason?',
    };

    const updatedConversation = {
      ...mockConversation,
      name: 'John',
      birthDate: new Date('1990-01-01'),
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    jest.spyOn(conversationService, 'findOrCreateConversation')
      .mockResolvedValueOnce(mockConversation)
      .mockResolvedValueOnce(updatedConversation);
    jest.spyOn(conversationService, 'createMessage').mockResolvedValue({} as any);
    jest.spyOn(conversationService, 'getMessages').mockResolvedValue([
      { id: '1', conversationId: '1', role: 'user', content: 'Hello', timestamp: new Date() },
    ] as any);
    jest.spyOn(langGraphAgent, 'processMessage').mockResolvedValue(agentState);
    jest.spyOn(conversationService, 'updateConversation').mockResolvedValue(updatedConversation);

    const result = await service.processMessage('5511999999999', 'Hello');

    expect(result).toHaveProperty('type', 'text');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('conversation');
    expect(result.conversation).toHaveProperty('phoneNumber');
    expect(result.conversation).toHaveProperty('status');
    expect(result.conversation).toHaveProperty('funnelStep');
    expect(result.conversation).toHaveProperty('variables');
  });

  it('should handle error and return error message', async () => {
    jest.spyOn(conversationService, 'findOrCreateConversation').mockRejectedValue(new Error('Database error'));

    await expect(
      service.processMessage('5511999999999', 'Hello'),
    ).rejects.toThrow();
  });

  it('should update status to qualified when funnelStep is qualified', async () => {
    const agentState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: '1990-01-01',
      weightLossReason: 'Health',
      qualified: true,
      funnelStep: FunnelStep.qualified,
      response: 'Congratulations!',
    };

    jest.spyOn(conversationService, 'findOrCreateConversation').mockResolvedValue(mockConversation);
    jest.spyOn(conversationService, 'createMessage').mockResolvedValue({} as any);
    jest.spyOn(conversationService, 'getMessages').mockResolvedValue([
      { id: '1', conversationId: '1', role: 'user', content: 'Health reasons', timestamp: new Date() },
    ] as any);
    jest.spyOn(langGraphAgent, 'processMessage').mockResolvedValue(agentState);
    jest.spyOn(conversationService, 'updateConversation').mockResolvedValue({
      ...mockConversation,
      status: Status.qualified,
      funnelStep: FunnelStep.qualified,
    });

    await service.processMessage('5511999999999', 'Health reasons');

    expect(conversationService.updateConversation).toHaveBeenCalledWith(
      '5511999999999',
      expect.objectContaining({
        status: Status.qualified,
        funnelStep: FunnelStep.qualified,
        finishedAt: expect.any(Date),
      }),
    );
  });

  it('should update status to rejected when funnelStep is rejected', async () => {
    const agentState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: '1990-01-01',
      weightLossReason: 'Beauty',
      qualified: false,
      funnelStep: FunnelStep.rejected,
      response: 'Sorry',
    };

    jest.spyOn(conversationService, 'findOrCreateConversation').mockResolvedValue(mockConversation);
    jest.spyOn(conversationService, 'createMessage').mockResolvedValue({} as any);
    jest.spyOn(conversationService, 'getMessages').mockResolvedValue([
      { id: '1', conversationId: '1', role: 'user', content: 'Beauty reasons', timestamp: new Date() },
    ] as any);
    jest.spyOn(langGraphAgent, 'processMessage').mockResolvedValue(agentState);
    jest.spyOn(conversationService, 'updateConversation').mockResolvedValue({
      ...mockConversation,
      status: Status.rejected,
      funnelStep: FunnelStep.rejected,
    });

    await service.processMessage('5511999999999', 'Beauty reasons');

    expect(conversationService.updateConversation).toHaveBeenCalledWith(
      '5511999999999',
      expect.objectContaining({
        status: Status.rejected,
        funnelStep: FunnelStep.rejected,
        finishedAt: expect.any(Date),
      }),
    );
  });
});
