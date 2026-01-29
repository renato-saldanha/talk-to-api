# Frontend - WhatsApp API Test Interface

Interface web simples para testar a API de conversas WhatsApp.

## Funcionalidades

- Campo para configurar número de telefone
- Campo para configurar URL da API
- Área de chat que simula conversas WhatsApp
- Exibição do status da conversa (active, qualified, rejected, expired)
- Exibição das informações coletadas (nome, data de nascimento, motivo)
- Indicadores visuais coloridos para diferentes status
- Atualização automática do status após cada mensagem

## Como Usar

### Opção 1: Servir via Docker Compose (Recomendado)

O frontend está configurado no `docker-compose.yml` e será servido automaticamente em `http://localhost:3000` quando você executar:

```bash
docker-compose up
```

### Opção 2: Servir Localmente

Você pode servir o frontend localmente usando qualquer servidor HTTP simples:

#### Python
```bash
cd frontend
python -m http.server 3000
```

#### Node.js (http-server)
```bash
cd frontend
npx http-server -p 3000
```

#### PHP
```bash
cd frontend
php -S localhost:3000
```

## Configuração

1. Abra `http://localhost:3000` no navegador
2. Configure o número de telefone (padrão: 5511999999999)
3. Configure a URL da API (padrão: http://localhost:8000)
4. Clique em "Verificar Status" para ver o status atual da conversa
5. Digite uma mensagem e clique em "Enviar" ou pressione Enter

## Status da Conversa

- **Active** (Verde): Conversa ativa, aguardando informações
- **Qualified** (Azul): Lead qualificado com motivo forte
- **Rejected** (Vermelho): Lead rejeitado com motivo fraco
- **Expired** (Cinza): Conversa expirada (15 minutos sem atividade)

## Fluxo de Teste

1. Envie uma mensagem inicial (ex: "Olá")
2. O sistema pedirá seu nome
3. Envie seu nome
4. O sistema pedirá sua data de nascimento
5. Envie sua data de nascimento (formato: YYYY-MM-DD ou DD/MM/YYYY)
6. O sistema pedirá o motivo para emagrecer
7. Envie um motivo:
   - **Motivo forte** (ex: "Preciso fazer cirurgia e o médico exigiu perder peso") → Qualified
   - **Motivo fraco** (ex: "Quero ficar bonita") → Rejected

## Notas

- Certifique-se de que a API está rodando e o CORS está habilitado
- O frontend faz requisições para a API configurada
- Erros são exibidos na área de chat
- O status é atualizado automaticamente após cada mensagem
