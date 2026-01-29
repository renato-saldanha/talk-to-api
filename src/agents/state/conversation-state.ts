import { FunnelStep } from "@prisma/client";

export interface ConversationState {
  phoneNumber: string;
  messages: Array<{ role: string; content: string }>;
  name: string | null;
  birthDate: string | null;
  weightLossReason: string | null;
  qualified: boolean | null;
  funnelStep: FunnelStep;
  response?: string;
}
