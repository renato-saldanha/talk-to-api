import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from './conversation.service';
import { PrismaService } from '../core/prisma/prisma.service';
import { SessionService } from './session.service';
import { Status, FunnelStep } from '@prisma/client';

describe('ConversationService', () => {
  let service: ConversationService;
  let prismaService: PrismaService;
  let sessionService: SessionService;

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
        ConversationService,
        {
          provide: PrismaService,
          useValue: {
            conversation: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            message: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: SessionService,
          useValue: {
            isExpired: jest.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
    prismaService = module.get<PrismaService>(PrismaService);
    sessionService = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create new conversation when not found', async () => {
    jest.spyOn(prismaService.conversation, 'findUnique').mockResolvedValue(null);
    jest.spyOn(prismaService.conversation, 'create').mockResolvedValue(mockConversation);

    const result = await service.findOrCreateConversation('5511999999999');

    expect(result).toEqual(mockConversation);
    expect(prismaService.conversation.create).toHaveBeenCalled();
  });

  it('should return existing conversation when found', async () => {
    jest.spyOn(prismaService.conversation, 'findUnique').mockResolvedValue(mockConversation);

    const result = await service.findOrCreateConversation('5511999999999');

    expect(result).toEqual(mockConversation);
    expect(prismaService.conversation.create).not.toHaveBeenCalled();
  });

  it('should update expired conversation', async () => {
    const expiredConversation = { ...mockConversation, status: Status.active };
    const updatedConversation = { ...expiredConversation, status: Status.expired };

    jest.spyOn(prismaService.conversation, 'findUnique').mockResolvedValue(expiredConversation);
    jest.spyOn(sessionService, 'isExpired').mockReturnValue(true);
    jest.spyOn(prismaService.conversation, 'update').mockResolvedValue(updatedConversation);

    const result = await service.findOrCreateConversation('5511999999999');

    expect(result.status).toBe(Status.expired);
    expect(prismaService.conversation.update).toHaveBeenCalled();
  });

  it('should update conversation', async () => {
    const updateData = {
      name: 'John',
      funnelStep: FunnelStep.collect_birth_date,
    };
    const updated = { ...mockConversation, ...updateData };

    jest.spyOn(prismaService.conversation, 'update').mockResolvedValue(updated);

    const result = await service.updateConversation('5511999999999', updateData);

    expect(result).toEqual(updated);
    expect(prismaService.conversation.update).toHaveBeenCalled();
  });

  it('should get conversation status', async () => {
    const conversationWithData = {
      ...mockConversation,
      name: 'John',
      birthDate: new Date('1990-01-01'),
      weightLossReason: 'Health reasons',
    };

    jest.spyOn(prismaService.conversation, 'findUnique').mockResolvedValue(conversationWithData);

    const result = await service.getConversationStatus('5511999999999');

    expect(result).toEqual({
      phoneNumber: '5511999999999',
      status: Status.active,
      funnelStep: FunnelStep.collect_name,
      variables: {
        name: 'John',
        birthDate: '1990-01-01',
        weightLossReason: 'Health reasons',
      },
    });
  });

  it('should return null for non-existent conversation', async () => {
    jest.spyOn(prismaService.conversation, 'findUnique').mockResolvedValue(null);

    const result = await service.getConversationStatus('5511999999999');

    expect(result).toBeNull();
  });

  it('should create message', async () => {
    const mockMessage = {
      id: '1',
      conversationId: '1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    };

    jest.spyOn(prismaService.message, 'create').mockResolvedValue(mockMessage);

    const result = await service.createMessage('1', 'user', 'Hello');

    expect(result).toEqual(mockMessage);
    expect(prismaService.message.create).toHaveBeenCalled();
  });

  it('should get messages', async () => {
    const mockMessages = [
      {
        id: '1',
        conversationId: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      },
    ];

    jest.spyOn(prismaService.message, 'findMany').mockResolvedValue(mockMessages);

    const result = await service.getMessages('1');

    expect(result).toEqual(mockMessages);
    expect(prismaService.message.findMany).toHaveBeenCalled();
  });
});
