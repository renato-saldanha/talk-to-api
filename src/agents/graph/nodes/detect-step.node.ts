import { ConversationState } from "../../state/conversation-state";
import { FunnelStep } from "@prisma/client";

export function detectStepNode(
  state: ConversationState,
): Partial<ConversationState> {
  if (state.qualified === true) {
    return { funnelStep: FunnelStep.qualified };
  }

  if (state.qualified === false) {
    return { funnelStep: FunnelStep.rejected };
  }

  if (!state.name) {
    return { funnelStep: FunnelStep.collect_name };
  }

  if (!state.birthDate) {
    return { funnelStep: FunnelStep.collect_birth_date };
  }

  if (!state.weightLossReason) {
    return { funnelStep: FunnelStep.collect_weight_loss_reason };
  }

  return { funnelStep: state.funnelStep };
}
