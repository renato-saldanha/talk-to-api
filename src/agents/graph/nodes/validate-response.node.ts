import { ConversationState } from "../../state/conversation-state";
import { FunnelStep } from "@prisma/client";

export function validateResponseNode(
  state: ConversationState,
): Partial<ConversationState> {
  const currentStep = state.funnelStep;

  if (currentStep === FunnelStep.collect_name) {
    if (state.name && state.name.trim().length > 0) {
      return { funnelStep: FunnelStep.collect_birth_date };
    }
  }

  if (currentStep === FunnelStep.collect_birth_date) {
    if (state.birthDate && state.birthDate.trim().length > 0) {
      return { funnelStep: FunnelStep.collect_weight_loss_reason };
    }
  }

  if (currentStep === FunnelStep.collect_weight_loss_reason) {
    if (state.weightLossReason && state.weightLossReason.trim().length > 0) {
      return {};
    }
  }

  return {};
}
