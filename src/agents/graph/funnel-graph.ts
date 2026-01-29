import { StateGraph, END, START } from "@langchain/langgraph";
import { ConversationState } from "../state/conversation-state";
import { analyzeMessageNode } from "./nodes/analyze-message.node";
import { detectStepNode } from "./nodes/detect-step.node";
import { validateResponseNode } from "./nodes/validate-response.node";
import { queryPineconeNode } from "./nodes/query-pinecone.node";
import { generateResponseNode } from "./nodes/generate-response.node";
import { RagService } from "../../services/rag.service";

export function createFunnelGraph(ragService: RagService) {
  const workflow = new StateGraph<ConversationState>({
    channels: {
      phoneNumber: {
        reducer: (x: string, y: string) => y ?? x,
        default: () => "",
      },
      messages: {
        reducer: (x: Array<any>, y: Array<any>) => y ?? x,
        default: () => [],
      },
      name: {
        reducer: (x: string | null, y: string | null) => y ?? x,
        default: () => null,
      },
      birthDate: {
        reducer: (x: string | null, y: string | null) => y ?? x,
        default: () => null,
      },
      weightLossReason: {
        reducer: (x: string | null, y: string | null) => y ?? x,
        default: () => null,
      },
      qualified: {
        reducer: (x: boolean | null, y: boolean | null) => y ?? x,
        default: () => null,
      },
      funnelStep: {
        reducer: (x: any, y: any) => y ?? x,
        default: () => "collect_name" as any,
      },
      response: {
        reducer: (x: string | undefined, y: string | undefined) => y ?? x,
        default: () => undefined,
      },
    },
  } as any);

  workflow.addNode("analyze", async (state: ConversationState) => {
    const result = await analyzeMessageNode(state);
    return { ...state, ...result };
  });

  workflow.addNode("detect", (state: ConversationState) => {
    const result = detectStepNode(state);
    return { ...state, ...result };
  });

  workflow.addNode("validate", (state: ConversationState) => {
    const result = validateResponseNode(state);
    return { ...state, ...result };
  });

  workflow.addNode("queryPinecone", async (state: ConversationState) => {
    const result = await queryPineconeNode(state, ragService);
    return { ...state, ...result };
  });

  workflow.addNode("generate", async (state: ConversationState) => {
    const result = await generateResponseNode(state);
    return { ...state, ...result };
  });

  (workflow as any).addEdge(START, "analyze");
  (workflow as any).addEdge("analyze", "detect");
  (workflow as any).addEdge("detect", "validate");

  (workflow as any).addConditionalEdges(
    "validate",
    (state: ConversationState) => {
      if (
        state.funnelStep === "collect_weight_loss_reason" &&
        state.weightLossReason
      ) {
        return "queryPinecone";
      }
      return "generate";
    },
  );

  (workflow as any).addEdge("queryPinecone", "detect");
  (workflow as any).addEdge("generate", END);

  return (workflow as any).compile();
}
