import { ConversationState } from '../../state/conversation-state';
import { FunnelStep } from '@prisma/client';
import { OpenAI } from '@langchain/openai';

export async function generateResponseNode(
  state: ConversationState,
): Promise<Partial<ConversationState>> {
  const llm = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.8,
  });

  const conversationHistory = state.messages
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  let prompt = '';

  const langRule = 'Responda SEMPRE em português do Brasil.';

  if (state.funnelStep === FunnelStep.qualified) {
    prompt = `Você é um assistente amigável de uma clínica de saúde. O lead foi qualificado com base no motivo forte para emagrecer.

Histórico da conversa:
${conversationHistory}

Dados do lead:
- Nome: ${state.name}
- Data de nascimento: ${state.birthDate}
- Motivo para emagrecer: ${state.weightLossReason}

Gere uma resposta acolhedora e empática, parabenizando e oferecendo agendar uma avaliação gratuita. Seja profissional e amigável. Máximo 2-3 frases. ${langRule}`;
  } else if (state.funnelStep === FunnelStep.rejected) {
    prompt = `Você é um assistente amigável de uma clínica de saúde. O lead não atende aos critérios de qualificação.

Histórico da conversa:
${conversationHistory}

Dados do lead:
- Nome: ${state.name}
- Data de nascimento: ${state.birthDate}
- Motivo para emagrecer: ${state.weightLossReason}

Gere uma resposta educada e respeitosa explicando que não é possível atendê-los no momento. Seja gentil e profissional. Máximo 2-3 frases. ${langRule}`;
  } else if (state.funnelStep === FunnelStep.collect_name) {
    prompt = `Você é um assistente amigável de uma clínica de saúde, dando as boas-vindas a um novo lead. Peça o nome de forma acolhedora. Ex.: "Olá! Bem-vindo à clínica. Qual é o seu nome?" Mantenha breve (1-2 frases). ${langRule}`;
  } else if (state.funnelStep === FunnelStep.collect_birth_date) {
    prompt = `Você é um assistente amigável de uma clínica de saúde. O nome do lead é ${state.name}. Peça a data de nascimento de forma amigável. Ex.: "Prazer, ${state.name}! Qual é a sua data de nascimento?" Mantenha breve (1-2 frases). ${langRule}`;
  } else if (state.funnelStep === FunnelStep.collect_weight_loss_reason) {
    prompt = `Você é um assistente amigável de uma clínica de saúde. O lead se chama ${state.name} e nasceu em ${state.birthDate}. Peça o principal motivo para querer emagrecer. Seja empático e encorajador. Ex.: "Obrigada! Qual o principal motivo que te faz querer emagrecer?" Mantenha breve (1-2 frases). ${langRule}`;
  } else {
    prompt = `Você é um assistente amigável de uma clínica de saúde. Continue a conversa de forma natural. Mantenha breve e profissional. ${langRule}`;
  }

  try {
    const response = await llm.invoke(prompt);
    const content = typeof response === 'string' ? response : (response as any).content?.toString() || String(response);
    return { response: content.trim() };
  } catch (error) {
    console.error('Error generating response:', error);
    return { response: 'Desculpe, ocorreu um erro. Por favor, tente novamente.' };
  }
}
