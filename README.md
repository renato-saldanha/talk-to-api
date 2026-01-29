# API WhatsApp com LangGraph e RAG

API NestJS que processa mensagens WhatsApp usando LangGraph, extrai variáveis do funil de qualificação, qualifica leads via RAG (Pinecone) e gerencia expiração de sessão.

## Início rápido

1. Clone o repositório
2. Copie `.env.example` para `.env` e preencha as variáveis
3. Execute: `docker-compose up` (ou `docker-compose up --build` na primeira vez)

Pronto! A API estará disponível em `http://localhost:8000` e o frontend em `http://localhost:3000`. Nenhuma configuração manual é necessária após preencher o `.env`.

Tudo é executado automaticamente:

- PostgreSQL é iniciado
- Migrations são aplicadas
- Pinecone é populado com motivos fortes
- API inicia e fica pronta para uso
- Frontend é servido via nginx

## Stack

- **NestJS** – Framework Node.js
- **TypeScript** – Linguagem
- **PostgreSQL** – Banco de dados (Docker Compose)
- **Prisma** – ORM
- **LangGraph** – Agente de conversação
- **OpenAI** – LLM (gpt-4o-mini)
- **Pinecone** – Vector database para RAG

## Estrutura do projeto

```
src/
├── agents/              # Agente LangGraph, grafo e nós
│   ├── graph/           # Grafo do funil
│   │   ├── funnel-graph.ts
│   │   └── nodes/       # analyze-message, detect-step, validate-response, query-pinecone, generate-response
│   └── state/           # conversation-state
├── conversations/       # Controller, service e DTOs
├── core/                # Configuração, database (Prisma), env-validator
├── health/              # Health check
├── services/            # RAG, sessão, conversation, pinecone-seed
├── scripts/             # seed-pinecone (executado pelo entrypoint)
└── main.ts
```

## Endpoints

### POST /conversations/:phoneNumber/messages

Processa uma mensagem do usuário e retorna a resposta do agente.

**Requisição:**

```json
{
  "content": "Olá, meu nome é Maria"
}
```

**Resposta:**

```json
{
  "type": "text",
  "content": "Prazer, Maria! Qual é a sua data de nascimento?",
  "conversation": {
    "phoneNumber": "5511999999999",
    "status": "active",
    "funnelStep": "collect_birth_date",
    "variables": {
      "name": "Maria"
    }
  }
}
```

### GET /conversations/:phoneNumber/status

Retorna o status atual da conversa.

**Resposta:**

```json
{
  "phoneNumber": "5511999999999",
  "status": "active",
  "funnelStep": "collect_birth_date",
  "variables": {
    "name": "Maria",
    "birthDate": "1990-03-15",
    "weightLossReason": "Preciso fazer cirurgia"
  }
}
```

### GET /health

Verifica a saúde da API e as conexões com dependências.

**Resposta (serviços conectados):**

```json
{
  "status": "ok",
  "database": "connected",
  "pinecone": "connected"
}
```

Se PostgreSQL ou Pinecone estiverem indisponíveis, `status` será `"error"` e os respectivos campos `"disconnected"`.

## Variáveis de ambiente

Copie `.env.example` para `.env` e configure:

- `PORT` – Porta da API (padrão: 8000; usado pelo Docker)
- `DATABASE_URL` – URL de conexão PostgreSQL
- `OPENAI_API_KEY` – Chave da API OpenAI
- `OPENAI_MODEL` – Modelo OpenAI (padrão: gpt-4o-mini)
- `OPENAI_EMBEDDING_MODEL` – Modelo de embeddings (padrão: text-embedding-3-small)
- `PINECONE_API_KEY` – Chave da API Pinecone
- `PINECONE_INDEX_NAME` – Nome do índice Pinecone
- `PINECONE_ENVIRONMENT` – Ambiente Pinecone
- `SESSION_EXPIRY_MINUTES` – Minutos para expiração de sessão (padrão: 15)
- `RAG_QUALIFIED_SCORE_THRESHOLD` – Threshold para qualificação (padrão: 0.75)
- `SKIP_PINECONE_SEED` – Pular seed do Pinecone (0 ou 1, padrão: 0)
- `FRONTEND_URL` – URL do frontend para CORS (opcional; padrão: `http://localhost:3000`)

## Desenvolvimento

### Setup local

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Testes

```bash
# Testes unitários + integração (entrypoint, etc.)
npm test

# Com cobertura (mínimo 85%)
npm run test:cov

# Testes e2e (API com mocks; requer build)
npm run test:e2e

# Modo watch
npm run test:watch
```

- `npm test` executa testes em `**/*.spec.ts` e `**/*.integration.spec.ts`.
- `npm run test:e2e` executa `test/**/*.e2e-spec.ts` (config em `test/jest-e2e.json`).

### Migrations

```bash
# Criar nova migration
npx prisma migrate dev

# Aplicar migrations (produção)
npx prisma migrate deploy
```

## Fluxo do funil

Conforme o PoC Take Home, a conversa segue em português:

1. **collect_name** – Coleta o nome do usuário  
   - Ex.: Cliente: "Oi" → IA: "Olá! Bem-vindo à clínica. Qual é o seu nome?"  
   - Cliente: "Maria" → IA: "Prazer, Maria! Qual é a sua data de nascimento?"
2. **collect_birth_date** – Coleta a data de nascimento  
   - Ex.: Cliente: "15/03/1990" → IA: "Obrigada! Qual o principal motivo que te faz querer emagrecer?"
3. **collect_weight_loss_reason** – Coleta o motivo para emagrecer  
   - Motivo forte (alta similaridade no RAG) → **qualified**  
   - Motivo fraco (baixa similaridade) → **rejected**
4. **qualified** – Lead qualificado (motivo forte encontrado via RAG)  
   - Ex.: "Entendo, Maria. Sua saúde é prioridade! Vamos agendar uma avaliação gratuita."
5. **rejected** – Lead rejeitado (motivo fraco)  
   - Ex.: "Obrigada pelo contato, Maria! Infelizmente não conseguimos atender sua necessidade no momento."

## Gerenciamento de sessão

- Sessões expiram após 15 minutos sem atividade
- Status pode transicionar: `active` → `expired` | `qualified` | `rejected`
- `lastActivity` é atualizado automaticamente a cada mensagem

## RAG e qualificação

O sistema usa RAG (Retrieval Augmented Generation) com Pinecone para qualificar leads:

- Motivos fortes são armazenados no Pinecone
- Quando o usuário fornece um motivo, o sistema busca motivos similares
- Se a similaridade for ≥ 0,75, o lead é qualificado
- Caso contrário, o lead é rejeitado

**Motivos fortes pré-cadastrados (conforme PoC):**

- "Preciso fazer cirurgia e o médico exigiu perder peso"
- "Minha saúde está em risco, pressão alta e diabetes"
- "Quero engravidar mas o médico disse que preciso emagrecer"
- "Tenho dor nas articulações por causa do peso"
- "Meu colesterol está altíssimo e estou com medo de infarto"

## Docker

### Build

```bash
docker-compose build
```

### Executar

```bash
docker-compose up
# ou, na primeira vez: docker-compose up --build
```

### Logs

```bash
docker-compose logs -f api
```

### Parar

```bash
docker-compose down
```

### Limpar volumes

```bash
docker-compose down -v
```

## Frontend

Uma interface web simples está disponível para testar a API:

- **URL**: `http://localhost:3000`
- **Funcionalidades**:
  - Campo para configurar número de telefone
  - Área de chat que simula conversas WhatsApp
  - Exibição do status da conversa e informações coletadas
  - Indicadores visuais para diferentes status (active, qualified, rejected, expired)

### Testar pelo frontend

1. Com o projeto rodando (`docker-compose up`), abra `http://localhost:3000` no navegador.
2. Configure o número de telefone (padrão: 5511999999999) e a URL da API (padrão: http://localhost:8000).
3. Clique em **Verificar Status** para ver o status atual da conversa (ou "-" se ainda não houver conversa).
4. Digite uma mensagem no campo de texto e clique em **Enviar** (ou pressione Enter).
5. Siga o fluxo do funil: a IA pede nome → data de nascimento → motivo para emagrecer. Motivos fortes (ex.: "Preciso fazer cirurgia e o médico exigiu perder peso") levam a **qualified**; motivos fracos (ex.: "Quero ficar bonita") levam a **rejected**.

Para mais detalhes e opções de servidor local, consulte [frontend/README.md](frontend/README.md).

## Automação

O sistema é totalmente automatizado:

1. **Entrypoint** (`entrypoint.sh`) executa:
   - Aguarda PostgreSQL estar pronto
   - Valida variáveis de ambiente
   - Gera Prisma Client
   - Aplica migrations
   - Popula Pinecone (se necessário)
   - Inicia servidor NestJS

2. **Docker Compose** garante:
   - PostgreSQL inicia primeiro com health check
   - API aguarda PostgreSQL estar saudável
   - Frontend é servido via nginx
   - Dependências são resolvidas automaticamente

## Licença

MIT
