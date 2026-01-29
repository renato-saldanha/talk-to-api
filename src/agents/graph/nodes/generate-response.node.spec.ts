import { generateResponseNode } from "./generate-response.node";
import { ConversationState } from "../../state/conversation-state";
import { FunnelStep } from "@prisma/client";
import { OpenAI } from "@langchain/openai";

jest.mock("@langchain/openai");

describe("generateResponseNode", () => {
  const originalEnv = process.env;
  let mockLLM: jest.Mocked<OpenAI>;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: "sk-test",
      OPENAI_MODEL: "gpt-4o-mini",
    };

    mockLLM = {
      invoke: jest.fn(),
    } as any;

    (OpenAI as unknown as jest.Mock).mockImplementation(() => mockLLM);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should generate response for collect_name step", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const mockResponse = "Olá! Qual é o seu nome?";
    jest.spyOn(mockLLM, "invoke").mockResolvedValue(mockResponse);

    const result = await generateResponseNode(state);

    expect(result.response).toBe("Olá! Qual é o seu nome?");
    expect(mockLLM.invoke).toHaveBeenCalled();
    const callArgs = (mockLLM.invoke as jest.Mock).mock.calls[0][0];
    expect(callArgs).toContain("boas-vindas");
  });

  it("should generate response for collect_birth_date step", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [
        { role: "assistant", content: "Olá! Qual é o seu nome?" },
        { role: "user", content: "Maria" },
      ],
      name: "Maria",
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_birth_date,
    };

    const mockResponse = "Prazer, Maria! Qual é a sua data de nascimento?";
    jest.spyOn(mockLLM, "invoke").mockResolvedValue(mockResponse);

    const result = await generateResponseNode(state);

    expect(result.response).toBe(
      "Prazer, Maria! Qual é a sua data de nascimento?",
    );
    const callArgs = (mockLLM.invoke as jest.Mock).mock.calls[0][0];
    expect(callArgs).toContain("O nome do lead é");
    expect(callArgs).toContain("Maria");
  });

  it("should generate response for collect_weight_loss_reason step", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [
        { role: "assistant", content: "Qual é a sua data de nascimento?" },
        { role: "user", content: "1990-03-15" },
      ],
      name: "Maria",
      birthDate: "1990-03-15",
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    const mockResponse =
      "Qual é o principal motivo para você querer emagrecer?";
    jest.spyOn(mockLLM, "invoke").mockResolvedValue(mockResponse);

    const result = await generateResponseNode(state);

    expect(result.response).toBe(
      "Qual é o principal motivo para você querer emagrecer?",
    );
    const callArgs = (mockLLM.invoke as jest.Mock).mock.calls[0][0];
    expect(callArgs).toContain("Maria");
    expect(callArgs).toContain("1990-03-15");
  });

  it("should generate response for qualified step", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [{ role: "user", content: "Preciso fazer cirurgia" }],
      name: "Maria",
      birthDate: "1990-03-15",
      weightLossReason: "Preciso fazer cirurgia e o médico exigiu perder peso",
      qualified: true,
      funnelStep: FunnelStep.qualified,
    };

    const mockResponse =
      "Parabéns! Você foi qualificada. Vamos agendar uma avaliação gratuita?";
    jest.spyOn(mockLLM, "invoke").mockResolvedValue(mockResponse);

    const result = await generateResponseNode(state);

    expect(result.response).toBe(
      "Parabéns! Você foi qualificada. Vamos agendar uma avaliação gratuita?",
    );
    const callArgs = (mockLLM.invoke as jest.Mock).mock.calls[0][0];
    expect(callArgs).toContain("qualificado");
    expect(callArgs).toContain("Maria");
    expect(callArgs).toContain(
      "Preciso fazer cirurgia e o médico exigiu perder peso",
    );
  });

  it("should generate response for rejected step", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [
        { role: "user", content: "Quero emagrecer para ficar bonita" },
      ],
      name: "Maria",
      birthDate: "1990-03-15",
      weightLossReason: "Quero emagrecer para ficar bonita",
      qualified: false,
      funnelStep: FunnelStep.rejected,
    };

    const mockResponse =
      "Obrigada pelo interesse. Infelizmente não podemos ajudá-la no momento.";
    jest.spyOn(mockLLM, "invoke").mockResolvedValue(mockResponse);

    const result = await generateResponseNode(state);

    expect(result.response).toBe(
      "Obrigada pelo interesse. Infelizmente não podemos ajudá-la no momento.",
    );
    const callArgs = (mockLLM.invoke as jest.Mock).mock.calls[0][0];
    expect(callArgs).toContain("não atende aos critérios");
  });

  it("should handle string response directly", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const mockResponse = "Hello";
    jest.spyOn(mockLLM, "invoke").mockResolvedValue(mockResponse);

    const result = await generateResponseNode(state);

    expect(result.response).toBe("Hello");
  });

  it("should handle response with content property", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const mockResponse = { content: "Hello from content" };
    jest.spyOn(mockLLM, "invoke").mockResolvedValue(mockResponse as any);

    const result = await generateResponseNode(state);

    expect(result.response).toBe("Hello from content");
  });

  it("should handle response with toString method", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const mockResponse = { toString: () => "Hello from toString" };
    jest.spyOn(mockLLM, "invoke").mockResolvedValue(mockResponse as any);

    const result = await generateResponseNode(state);

    expect(result.response).toBe("Hello from toString");
  });

  it("should return error message on API error", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    jest.spyOn(mockLLM, "invoke").mockRejectedValue(new Error("API Error"));
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    const result = await generateResponseNode(state);

    expect(result.response).toBe(
      "Desculpe, ocorreu um erro. Por favor, tente novamente.",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error generating response:",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it("should trim response content", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const mockResponse = "  Hello  ";
    jest.spyOn(mockLLM, "invoke").mockResolvedValue(mockResponse);

    const result = await generateResponseNode(state);

    expect(result.response).toBe("Hello");
  });

  it("should include conversation history in prompt for qualified step", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [
        { role: "assistant", content: "Olá!" },
        { role: "user", content: "Olá" },
      ],
      name: "Maria",
      birthDate: "1990-03-15",
      weightLossReason: "Health",
      qualified: true,
      funnelStep: FunnelStep.qualified,
    };

    const mockResponse = "Response";
    jest.spyOn(mockLLM, "invoke").mockResolvedValue(mockResponse);

    await generateResponseNode(state);

    const callArgs = (mockLLM.invoke as jest.Mock).mock.calls[0][0];
    expect(callArgs).toContain("assistant: Olá!");
    expect(callArgs).toContain("user: Olá");
  });

  it("should use default prompt for unknown funnel step", async () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: "unknown" as FunnelStep,
    };

    const mockResponse = "Default response";
    jest.spyOn(mockLLM, "invoke").mockResolvedValue(mockResponse);

    const result = await generateResponseNode(state);

    expect(result.response).toBe("Default response");
    const callArgs = (mockLLM.invoke as jest.Mock).mock.calls[0][0];
    expect(callArgs).toContain("Continue a conversa");
  });
});
