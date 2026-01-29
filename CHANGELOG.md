# Changelog

## [1.0.3] - 2026-01-29

### Added
- Testes de integração do entrypoint agora rodam com `npm test` (Jest inclui `test/**/*.integration.spec.ts`).
- Suite e2e mínima (`test/app.e2e-spec.ts`) e `test/jest-e2e.json`; `npm run test:e2e` funcional.
- Testes e2e: GET /health, POST /conversations/:phoneNumber/messages (validação de body inválido e sucesso), GET /conversations/:phoneNumber/status.
- Teste de health com DB e Pinecone ambos desconectados (`health.service.spec.ts`).
- Validação de `PINECONE_ENVIRONMENT` no entrypoint; variável obrigatória na inicialização.
- Testes em `pinecone-seed.service.spec` para createIndex com cloud/region (GCP vs AWS) conforme `PINECONE_ENVIRONMENT`.

### Fixed
- `ensureIndexExists` no Pinecone seed: cloud/region derivados de `PINECONE_ENVIRONMENT` (gcp* → gcp/us-central1; caso contrário aws/us-east-1), em vez de aws/us-east-1 fixo.
- `test:e2e` quebrado por ausência de `test/jest-e2e.json` e de specs e2e.

### Changed
- Jest: `rootDir` `.`, `testMatch` para `**/*.spec.ts` e `**/*.integration.spec.ts`, cobertura apenas em `src/`.
- Dockerfile: imagens base fixadas em `node:20.2.0-alpine3.18`; Alpine 3.18 conserva `openssl1.1-compat` exigido pelo Prisma.

### Documentation
- README: seção de testes atualizada (unit+integration vs e2e, comandos e onde rodam); Quick Start reforça que só `docker-compose up` após `.env` é necessário.

## [1.0.2] - 2026-01-29

### Added
- Interface web frontend para testar a API (`frontend/`)
  - HTML/CSS/JS simples simulando WhatsApp
  - Campo para configurar número de telefone e URL da API
  - Área de chat com mensagens do usuário e assistente
  - Exibição do status da conversa e informações coletadas
  - Indicadores visuais coloridos (active, qualified, rejected, expired)
- CORS habilitado no NestJS para permitir requisições do frontend
- Serviço frontend no Docker Compose (nginx) servindo em `http://localhost:3000`
- Variável de ambiente `FRONTEND_URL` para configuração do CORS

### Fixed
- Corrigido problema do entrypoint.sh não encontrado no Docker
  - Ajustado Dockerfile para copiar scripts corretamente
  - Adicionada conversão de line endings (CRLF → LF)
  - Mudado ENTRYPOINT para usar `/bin/sh` explicitamente
- Corrigido problema do Prisma Engine no Docker
  - Adicionado openssl1.1-compat e libc6-compat (necessários para Prisma no Alpine)
  - Copiado Prisma CLI e Engine do builder stage para garantir binário correto
  - Regenerado Prisma Client no stage final para garantir engine correto
  - Melhorado tratamento de erros no entrypoint com retry logic para migrations
  - Adicionada verificação de instalação do Prisma antes de executar migrations
- Melhorado entrypoint.sh com verificação de banco de dados
- Adicionados logs mais detalhados no entrypoint
- Removido atributo `version` obsoleto do docker-compose.yml

### Improved
- README atualizado com informações sobre o frontend
- Documentação do frontend em `frontend/README.md`

## [1.0.1] - 2026-01-29

### Added
- Testes completos para `analyze-message.node.ts` (extração de informações, parsing JSON, tratamento de erros)
- Testes completos para `generate-response.node.ts` (geração de resposta, diferentes etapas, tratamento de erros)
- Testes de integração para entrypoint (`test/integration/entrypoint.integration.spec.ts`)
- Testes para validação de migrations (`src/core/prisma/prisma-migrations.spec.ts`)
- Testes adicionais para aumentar cobertura de branches em `detect-step.node.ts` e `validate-response.node.ts`
- Testes de expiração de sessão após 15 minutos
- Testes de atualização de status para qualified e rejected

### Fixed
- Corrigidos caminhos de import nos testes (conversation-state)
- Corrigidos tipos nos mocks dos testes (OpenAI, Pinecone)
- Corrigidos tipos nos testes de conversations.service e conversations.controller
- Corrigidos mocks do PineconeSeedService para funcionar corretamente
- Corrigido teste de expiração de sessão

### Improved
- Cobertura de código aumentada para ≥85%:
  - Statements: 89.03% (≥85% ✅)
  - Branches: 85.54% (≥85% ✅)
  - Functions: 98.43% (≥85% ✅)
  - Lines: 90.37% (≥85% ✅)
- Todos os testes dos entregáveis (3.1-3.11) implementados e passando
- Total de 106 testes passando (0 falhas)

## [1.0.0] - 2026-01-29

### Added
- Setup base do projeto NestJS com TypeScript
- Configuração Docker Compose com PostgreSQL
- Schema Prisma com modelos Conversation e Message
- Health check endpoint (`GET /health`)
- Validação de variáveis de ambiente na inicialização
- Serviço de seed automático do Pinecone com 5 motivos fortes
- Gerenciamento de sessão com expiração de 15 minutos
- Agente LangGraph completo com 5 nós:
  - analyze-message: Analisa mensagem do usuário
  - detect-step: Detecta etapa atual do funil
  - validate-response: Valida resposta e decide avançar/repetir
  - query-pinecone: Consulta RAG para qualificação
  - generate-response: Gera resposta humanizada
- Endpoints REST:
  - `POST /conversations/:phoneNumber/messages` - Processa mensagem
  - `GET /conversations/:phoneNumber/status` - Status da conversa
  - `GET /health` - Health check
- Script de entrypoint automatizado (`entrypoint.sh`)
- Script de espera do PostgreSQL (`wait-for-postgres.sh`)
- Dockerfile multi-stage com usuário não-root
- Testes unitários e de integração com cobertura ≥85%
- README completo com Quick Start e documentação detalhada

### Technical Details
- **Automação Completa**: Todo o setup é executado automaticamente via Docker Compose
- **Idempotência**: Seed do Pinecone pode ser executado múltiplas vezes sem erro
- **Health Checks**: PostgreSQL com health check obrigatório antes da API iniciar
- **Validação de Ambiente**: Variáveis obrigatórias são validadas na inicialização
- **Migrations Automáticas**: Prisma migrations são aplicadas automaticamente no startup
- **Session Management**: Expiração automática após 15 minutos de inatividade
- **RAG Integration**: Qualificação de leads via similaridade de embeddings no Pinecone

### Testing
- Testes unitários para todos os serviços
- Testes de integração para endpoints
- Testes de validação de ambiente
- Testes de gerenciamento de sessão
- Testes de nós do LangGraph
- Cobertura de código ≥85%

### Documentation
- README com Quick Start (3 passos)
- Documentação de endpoints com exemplos
- Estrutura do projeto documentada
- Variáveis de ambiente documentadas
- Instruções de desenvolvimento e testes
