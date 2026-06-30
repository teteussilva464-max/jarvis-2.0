# Migração JARVIS 1.0 → 2.0

## O que muda

O JARVIS 2.0 não é uma atualização — é uma substituição de arquitetura. O JARVIS 1.0 pode ser desligado completamente após a migração.

| Componente | JARVIS 1.0 | JARVIS 2.0 |
|-----------|------------|------------|
| Loop de raciocínio | Código TypeScript próprio (AgentService) | OpenClaw nativo |
| Memória de conversas | Tabela `Conversation` no PostgreSQL | SQLite + vector do OpenClaw |
| Memória de fatos | Tabela `AiLog` + embedding | UserFacts via API REST |
| Canal Discord | discord.js v14 | OpenClaw (nativo) |
| Canal WhatsApp | ❌ não tinha | OpenClaw (nativo) |
| Modelo de IA | Gemini fixo (503 frequente) | Gemini → OpenAI → Claude (failover) |
| Agendamento | Código manual no AgentService | Cron nativo do OpenClaw |
| Embedding | pgvector instável (404) | Vector nativo do OpenClaw |
| Porta | 3000 | 3001 |

## O que é preservado

### Dados do PostgreSQL

As tabelas `Task`, `Reminder`, `Goal` e `UserFact` têm estrutura compatível com o JARVIS 2.0. Execute a migration de dados abaixo para transferi-los.

As tabelas `Conversation`, `Note`, `AiLog` e `User` (versão 1.0) **não são migradas** — o OpenClaw assume a memória de conversas.

## Passo a passo de migração

### 1. Instalar e testar o JARVIS 2.0 em paralelo

Suba o JARVIS 2.0 na porta 3001 sem desligar o 1.0:

```bash
cd Jarvis_2.0
docker compose up -d
```

Teste que a API responde:
```bash
curl http://localhost:3001/health
```

### 2. Migrar dados

Execute o script de migração no banco do JARVIS 1.0:

```sql
-- Conecte ao banco do JARVIS 2.0 e rode:

-- Migrar Tasks
INSERT INTO "Task" (id, "userId", title, description, status, priority, "dueDate", "completedAt", "createdAt", "updatedAt")
SELECT
  id,
  'user_default',
  title,
  description,
  status::"TaskStatus",
  COALESCE(priority::"TaskPriority", 'medium'),
  "dueDate",
  "completedAt",
  "createdAt",
  "updatedAt"
FROM dblink('host=localhost dbname=jarvis_db user=jarvis password=SENHA', 
  'SELECT id, title, description, status, priority, "dueDate", "completedAt", "createdAt", "updatedAt" FROM "Task"')
AS t(id text, title text, description text, status text, priority text, "dueDate" timestamptz, "completedAt" timestamptz, "createdAt" timestamptz, "updatedAt" timestamptz)
ON CONFLICT (id) DO NOTHING;

-- Migrar Reminders
INSERT INTO "Reminder" (id, "userId", title, message, "remindAt", recurrence, status, "createdAt", "updatedAt")
SELECT
  id,
  'user_default',
  title,
  title,
  "remindAt",
  recurrence,
  status::"ReminderStatus",
  "createdAt",
  "updatedAt"
FROM dblink('host=localhost dbname=jarvis_db user=jarvis password=SENHA',
  'SELECT id, title, "remindAt", recurrence, status, "createdAt", "updatedAt" FROM "Reminder"')
AS r(id text, title text, "remindAt" timestamptz, recurrence text, status text, "createdAt" timestamptz, "updatedAt" timestamptz)
ON CONFLICT (id) DO NOTHING;

-- Migrar UserFacts
INSERT INTO "UserFact" (id, "userId", category, fact, confidence, "createdAt", "updatedAt")
SELECT
  id,
  'user_default',
  COALESCE(category, 'other'),
  fact,
  COALESCE(confidence, 0.7),
  "createdAt",
  "updatedAt"
FROM dblink('host=localhost dbname=jarvis_db user=jarvis password=SENHA',
  'SELECT id, category, fact, confidence, "createdAt", "updatedAt" FROM "UserFact"')
AS f(id text, category text, fact text, confidence float, "createdAt" timestamptz, "updatedAt" timestamptz)
ON CONFLICT (id) DO NOTHING;
```

> **Nota:** Ajuste `host`, `dbname`, `user` e `password` para os valores do seu ambiente do JARVIS 1.0.

### 3. Verificar dados migrados

```bash
curl http://localhost:3001/tasks -H "X-API-Key: SUA_API_KEY"
curl http://localhost:3001/reminders -H "X-API-Key: SUA_API_KEY"
curl http://localhost:3001/facts -H "X-API-Key: SUA_API_KEY"
```

### 4. Configurar o OpenClaw

Siga o [Guia de Instalação](SETUP.md) a partir do Passo 5.

### 5. Testar o JARVIS 2.0 por alguns dias

Rode os dois em paralelo. Valide que:
- [ ] Mensagens no Discord chegam ao JARVIS 2.0
- [ ] Criação de tasks funciona
- [ ] Lembretes disparam no horário correto
- [ ] Smart home responde (se configurado)
- [ ] Integração com Calendar/Gmail funciona

### 6. Desligar o JARVIS 1.0

Quando estiver satisfeito com o 2.0:

```bash
cd Jarvis  # pasta do JARVIS 1.0
docker compose down
```

O banco do JARVIS 1.0 pode ser mantido como backup por um período antes de deletar.

## Variáveis de ambiente que mudam

| JARVIS 1.0 | JARVIS 2.0 | Observação |
|-----------|------------|------------|
| `DISCORD_TOKEN` | configurado no OpenClaw | não vai mais no .env |
| `GEMINI_API_KEY` | configurado no OpenClaw | não vai mais no .env |
| `OPENAI_API_KEY` | configurado no OpenClaw | não vai mais no .env |
| `DATABASE_URL` | `DATABASE_URL` | banco diferente (jarvis2_db) |
| `PORT=3000` | `PORT=3001` | portas diferentes durante migração |
| — | `JARVIS_API_KEY` | novo: autenticação da REST API |
| — | `DEFAULT_USER_ID` | novo: id do usuário padrão |

## Rollback

Se algo der errado, o JARVIS 1.0 continua rodando independentemente. Simplesmente pare o JARVIS 2.0:

```bash
cd Jarvis_2.0
docker compose down
```

O JARVIS 1.0 não foi tocado.
