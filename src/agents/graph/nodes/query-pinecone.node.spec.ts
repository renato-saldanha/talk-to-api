import { queryPineconeNode } from './query-pinecone.node';
import { ConversationState } from '../../state/conversation-state';
import { RagService } from '../../../services/rag.service';
import { FunnelStep } from '@prisma/client';

describe('queryPineconeNode', () => {
  let ragService: RagService;

  beforeEach(() => {
    ragService = {
      isQualified: jest.fn(),
    } as any;
  });

  it('should return qualified true when reason is strong', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: '1990-01-01',
      weightLossReason: 'Health reasons',
      qualified: null,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    jest.spyOn(ragService, 'isQualified').mockResolvedValue(true);

    const result = await queryPineconeNode(state, ragService);

    expect(result.qualified).toBe(true);
    expect(ragService.isQualified).toHaveBeenCalledWith('Health reasons');
  });

  it('should return qualified false when reason is weak', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: '1990-01-01',
      weightLossReason: 'Beauty reasons',
      qualified: null,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    jest.spyOn(ragService, 'isQualified').mockResolvedValue(false);

    const result = await queryPineconeNode(state, ragService);

    expect(result.qualified).toBe(false);
  });

  it('should return empty object when not in collect_weight_loss_reason step', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_birth_date,
    };

    const result = await queryPineconeNode(state, ragService);

    expect(result).toEqual({});
    expect(ragService.isQualified).not.toHaveBeenCalled();
  });

  it('should return empty object when weightLossReason is missing', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: '1990-01-01',
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    const result = await queryPineconeNode(state, ragService);

    expect(result).toEqual({});
    expect(ragService.isQualified).not.toHaveBeenCalled();
  });

  it('should return qualified false on error', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: '1990-01-01',
      weightLossReason: 'Health reasons',
      qualified: null,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    jest.spyOn(ragService, 'isQualified').mockRejectedValue(new Error('Test error'));

    const result = await queryPineconeNode(state, ragService);

    expect(result.qualified).toBe(false);
  });
});
