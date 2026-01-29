import { ConversationState } from '../../state/conversation-state';
import { OpenAI } from '@langchain/openai';

export async function analyzeMessageNode(
  state: ConversationState,
): Promise<Partial<ConversationState>> {
  const llm = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.7,
  });

  const lastMessage = state.messages[state.messages.length - 1];
  const prompt = `Analise a mensagem do usuário e extraia as informações relevantes.
O usuário está em um fluxo para coletar: nome, data de nascimento e motivo para emagrecer.
A mensagem pode estar em português (ex.: "Meu nome é Maria", "15/03/1990", "Preciso fazer cirurgia").

Mensagem do usuário: "${lastMessage.content}"

Contexto da conversa:
${state.messages
  .slice(0, -1)
  .map((m) => `${m.role}: ${m.content}`)
  .join('\n')}

Estado atual:
- Nome: ${state.name || 'não coletado'}
- Data de nascimento: ${state.birthDate || 'não coletado'}
- Motivo para emagrecer: ${state.weightLossReason || 'não coletado'}
- Etapa do funil: ${state.funnelStep}

Retorne APENAS um objeto JSON com as chaves exatas:
- name: nome extraído (se houver na mensagem, senão null)
- birthDate: data de nascimento em YYYY-MM-DD (ex.: 1990-03-15; se houver, senão null)
- weightLossReason: motivo para emagrecer extraído (se houver, senão null)

Retorne SOMENTE JSON válido, sem outro texto.`;

  try {
    const response = await llm.invoke(prompt);
    const content = typeof response === 'string' ? response : (response as any).content?.toString() || String(response);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);
      return {
        name: extracted.name || state.name,
        birthDate: extracted.birthDate || state.birthDate,
        weightLossReason: extracted.weightLossReason || state.weightLossReason,
      };
    }
  } catch (error) {
    console.error('Error analyzing message:', error);
  }

  return {};
}
