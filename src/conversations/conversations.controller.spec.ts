import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Status, FunnelStep } from '@prisma/client';

describe('ConversationsController', () => {
  let controller: ConversationsController;
  let service: ConversationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        {
          provide: ConversationsService,
          useValue: {
            processMessage: jest.fn(),
            getStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ConversationsController>(ConversationsController);
    service = module.get<ConversationsService>(ConversationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create message', async () => {
    const mockResponse = {
      type: 'text',
      content: 'Hello',
      conversation: {
        phoneNumber: '5511999999999',
        status: Status.active,
        funnelStep: FunnelStep.collect_name,
        variables: {
          name: undefined,
          birthDate: undefined,
          weightLossReason: undefined,
        },
      },
    };

    jest.spyOn(service, 'processMessage').mockResolvedValue(mockResponse);

    const result = await controller.createMessage('5511999999999', {
      content: 'Hello',
    });

    expect(result).toEqual(mockResponse);
    expect(service.processMessage).toHaveBeenCalledWith('5511999999999', 'Hello');
  });

  it('should throw error when processing message fails', async () => {
    jest.spyOn(service, 'processMessage').mockRejectedValue(new Error('Test error'));

    await expect(
      controller.createMessage('5511999999999', { content: 'Hello' }),
    ).rejects.toThrow(HttpException);
  });

  it('should get status', async () => {
    const mockStatus = {
      phoneNumber: '5511999999999',
      status: Status.active,
      funnelStep: FunnelStep.collect_name,
      variables: {
        name: undefined,
        birthDate: undefined,
        weightLossReason: undefined,
      },
    };

    jest.spyOn(service, 'getStatus').mockResolvedValue(mockStatus);

    const result = await controller.getStatus('5511999999999');

    expect(result).toEqual(mockStatus);
    expect(service.getStatus).toHaveBeenCalledWith('5511999999999');
  });

  it('should throw 404 when conversation not found', async () => {
    jest.spyOn(service, 'getStatus').mockResolvedValue(null);

    await expect(controller.getStatus('5511999999999')).rejects.toThrow(
      new HttpException('Conversation not found', HttpStatus.NOT_FOUND),
    );
  });
});
