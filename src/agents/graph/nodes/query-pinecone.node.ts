import { ConversationState } from '../../state/conversation-state';
import { RagService } from '../../../services/rag.service';

export async function queryPineconeNode(
  state: ConversationState,
  ragService: RagService,
): Promise<Partial<ConversationState>> {
  if (
    !state.weightLossReason ||
    state.funnelStep !== 'collect_weight_loss_reason'
  ) {
    return {};
  }

  try {
    const isQualified = await ragService.isQualified(state.weightLossReason);
    return { qualified: isQualified };
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    return { qualified: false };
  }
}
