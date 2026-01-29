import { analyzeMessageNode } from './analyze-message.node';
import { ConversationState } from '../../state/conversation-state';
import { FunnelStep } from '@prisma/client';
import { OpenAI } from '@langchain/openai';

jest.mock('@langchain/openai');

describe('analyzeMessageNode', () => {
  const originalEnv = process.env;
  let mockLLM: jest.Mocked<OpenAI>;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: 'sk-test',
      OPENAI_MODEL: 'gpt-4o-mini',
    };

    mockLLM = {
      invoke: jest.fn(),
    } as any;

    (OpenAI as unknown as jest.Mock).mockImplementation(() => mockLLM);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should extract name from message', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [
        { role: 'user', content: 'Meu nome é Maria Silva' },
      ],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const mockResponse = { content: '{"name": "Maria Silva", "birthDate": null, "weightLossReason": null}' };
    jest.spyOn(mockLLM, 'invoke').mockResolvedValue(mockResponse as any);

    const result = await analyzeMessageNode(state);

    expect(result.name).toBe('Maria Silva');
    expect(mockLLM.invoke).toHaveBeenCalled();
  });

  it('should extract birth date from message', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [
        { role: 'user', content: 'Nasci em 15/03/1990' },
      ],
      name: 'Maria',
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_birth_date,
    };

    const mockResponse = { content: '{"name": null, "birthDate": "1990-03-15", "weightLossReason": null}' };
    jest.spyOn(mockLLM, 'invoke').mockResolvedValue(mockResponse as any);

    const result = await analyzeMessageNode(state);

    expect(result.birthDate).toBe('1990-03-15');
  });

  it('should extract weight loss reason from message', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [
        { role: 'user', content: 'Preciso fazer cirurgia e o médico exigiu perder peso' },
      ],
      name: 'Maria',
      birthDate: '1990-03-15',
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    const mockResponse = { content: '{"name": null, "birthDate": null, "weightLossReason": "Preciso fazer cirurgia e o médico exigiu perder peso"}' };
    jest.spyOn(mockLLM, 'invoke').mockResolvedValue(mockResponse as any);

    const result = await analyzeMessageNode(state);

    expect(result.weightLossReason).toBe('Preciso fazer cirurgia e o médico exigiu perder peso');
  });

  it('should preserve existing values when not extracted', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [
        { role: 'user', content: 'Olá' },
      ],
      name: 'Maria',
      birthDate: '1990-03-15',
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    const mockResponse = { content: '{"name": null, "birthDate": null, "weightLossReason": null}' };
    jest.spyOn(mockLLM, 'invoke').mockResolvedValue(mockResponse as any);

    const result = await analyzeMessageNode(state);

    expect(result.name).toBe('Maria');
    expect(result.birthDate).toBe('1990-03-15');
  });

  it('should parse JSON from response string', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [
        { role: 'user', content: 'Meu nome é João' },
      ],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const mockResponse = 'Here is the JSON: {"name": "João", "birthDate": null, "weightLossReason": null}';
    jest.spyOn(mockLLM, 'invoke').mockResolvedValue(mockResponse as any);

    const result = await analyzeMessageNode(state);

    expect(result.name).toBe('João');
  });

  it('should handle string response directly', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [
        { role: 'user', content: 'Meu nome é Pedro' },
      ],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const mockResponse = '{"name": "Pedro", "birthDate": null, "weightLossReason": null}';
    jest.spyOn(mockLLM, 'invoke').mockResolvedValue(mockResponse);

    const result = await analyzeMessageNode(state);

    expect(result.name).toBe('Pedro');
  });

  it('should handle response with content property', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [
        { role: 'user', content: 'Meu nome é Ana' },
      ],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const mockResponse = { content: '{"name": "Ana", "birthDate": null, "weightLossReason": null}' };
    jest.spyOn(mockLLM, 'invoke').mockResolvedValue(mockResponse as any);

    const result = await analyzeMessageNode(state);

    expect(result.name).toBe('Ana');
  });

  it('should return empty object on error', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [
        { role: 'user', content: 'Test' },
      ],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    jest.spyOn(mockLLM, 'invoke').mockRejectedValue(new Error('API Error'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await analyzeMessageNode(state);

    expect(result).toEqual({});
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error analyzing message:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('should return empty object when JSON parsing fails', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [
        { role: 'user', content: 'Test' },
      ],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const mockResponse = 'Invalid JSON response';
    jest.spyOn(mockLLM, 'invoke').mockResolvedValue(mockResponse);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await analyzeMessageNode(state);

    expect(result).toEqual({});
    consoleErrorSpy.mockRestore();
  });

  it('should include conversation context in prompt', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [
        { role: 'assistant', content: 'Olá! Qual é o seu nome?' },
        { role: 'user', content: 'Meu nome é Carlos' },
      ],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const mockResponse = { content: '{"name": "Carlos", "birthDate": null, "weightLossReason": null}' };
    jest.spyOn(mockLLM, 'invoke').mockResolvedValue(mockResponse as any);

    await analyzeMessageNode(state);

    const callArgs = (mockLLM.invoke as jest.Mock).mock.calls[0][0];
    expect(callArgs).toContain('Meu nome é Carlos');
    expect(callArgs).toContain('assistant: Olá! Qual é o seu nome?');
  });

  it('should include current state in prompt', async () => {
    const state: ConversationState = {
      phoneNumber: '5511999999999',
      messages: [
        { role: 'user', content: 'Test' },
      ],
      name: 'Maria',
      birthDate: '1990-01-01',
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    const mockResponse = { content: '{"name": null, "birthDate": null, "weightLossReason": null}' };
    jest.spyOn(mockLLM, 'invoke').mockResolvedValue(mockResponse as any);

    await analyzeMessageNode(state);

    const callArgs = (mockLLM.invoke as jest.Mock).mock.calls[0][0];
    expect(callArgs).toContain('Maria');
    expect(callArgs).toContain('1990-01-01');
    expect(callArgs).toContain('Etapa do funil');
  });
});
