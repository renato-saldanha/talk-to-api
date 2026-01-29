import { validateResponseNode } from './validate-response.node';
import { ConversationState } from '../../state/conversation-state';
import { FunnelStep } from '@prisma/client';

describe('validateResponseNode', () => {
  it('should advance to collect_birth_date when name is provided', () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const result = validateResponseNode(state);

    expect(result.funnelStep).toBe(FunnelStep.collect_birth_date);
  });

  it('should advance to collect_weight_loss_reason when birthDate is provided', () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: '1990-01-01',
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_birth_date,
    };

    const result = validateResponseNode(state);

    expect(result.funnelStep).toBe(FunnelStep.collect_weight_loss_reason);
  });

  it('should not advance when name is missing', () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const result = validateResponseNode(state);

    expect(result.funnelStep).toBeUndefined();
  });

  it('should not advance when birthDate is missing', () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_birth_date,
    };

    const result = validateResponseNode(state);

    expect(result.funnelStep).toBeUndefined();
  });

  it('should not advance when name is empty string', () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: '   ',
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const result = validateResponseNode(state);

    expect(result.funnelStep).toBeUndefined();
  });

  it('should not advance when birthDate is empty string', () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: '   ',
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_birth_date,
    };

    const result = validateResponseNode(state);

    expect(result.funnelStep).toBeUndefined();
  });

  it('should not advance when weightLossReason is empty string', () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: '1990-01-01',
      weightLossReason: '   ',
      qualified: null,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    const result = validateResponseNode(state);

    expect(result).toEqual({});
  });

  it('should return empty object for other funnel steps', () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [],
      name: 'John',
      birthDate: '1990-01-01',
      weightLossReason: 'Health',
      qualified: true,
      funnelStep: FunnelStep.qualified,
    };

    const result = validateResponseNode(state);

    expect(result).toEqual({});
  });
});
