# JARVIS 2.0 — Arquitetura

## Visão Geral

O OpenClaw é o orquestrador principal. Ele recebe mensagens de todos os canais (Discord, WhatsApp, Telegram), decide qual modelo de IA usar, gerencia memória e contexto nativamente, e chama a API do JARVIS quando precisa de dados estruturados.

O JARVIS nessa versão é o **nome do agente OpenClaw** e também o **nome da skill** que expõe operações de banco de dados.

```
Usuário (Discord / WhatsApp / Telegram)
           ↓
    OpenClaw (agente "JARVIS")
    ├── Memória nativa SQLite (contexto, notas, fatos do usuário)
    ├── Obsidian Memory Wiki (base de conhecimento)
    ├── Modelo primário: Gemini 2.5 Flash
    ├── Fallback automático: OpenAI GPT-5.3 Codex → OpenAI GPT-5.5
    ├── Skills: ClawLink (Gmail, Calendar, Slack, GitHub)
    ├── Skills: searx-search (busca web)
    ├── Skills: browser (automação de navegador)
    └── Skill: jarvis-db → chama a JARVIS API
                    ↓
           JARVIS API (este projeto)
           REST sobre Node.js + Prisma
           PostgreSQL: Tasks, Reminders, Goals, UserFacts
```

## Responsabilidades

### OpenClaw (não precisa de código aqui)
- Receber e rotear mensagens de todos os canais
- Orquestrar modelos de IA com failover automático
- Gerenciar memória e contexto de conversas
- Agendar lembretes e crons nativamente
- Enviar mensagens de retorno (WhatsApp, Discord)
- Criar eventos no Google Calendar via ClawLink
- Pesquisar na web via searx-search

### JARVIS API (este projeto)
- Expor dados estruturados do PostgreSQL via REST
- Gerenciar: Tarefas (to-do list com prioridades)
- Gerenciar: Lembretes (com horários e recorrência)
- Gerenciar: Metas autônomas (com cron schedule)
- Gerenciar: Fatos do usuário (persistência longa duração)
- Autenticação por API key (`X-API-Key` header)

## Simplificações em relação ao JARVIS 1.0

| JARVIS 1.0 | JARVIS 2.0 |
|---|---|
| GeminiService + ReAct loop | OpenClaw orquestra modelos |
| EmbeddingService + pgvector | OpenClaw SQLite + busca nativa |
| MemoryService (conversas) | OpenClaw session management |
| ObsidianService | OpenClaw Memory Wiki |
| DiscordPlugin (Discord.js) | OpenClaw canal Discord nativo |
| reminderScheduler (node-cron) | OpenClaw cron nativo (`--at`) |
| goalScheduler (node-cron) | OpenClaw cron nativo |
| UserFactService (extração Gemini) | OpenClaw memória nativa |
| AgentService (8-step ReAct) | OpenClaw agent loop nativo |

## Stack do JARVIS API

- **Runtime:** Node.js 22 + TypeScript
- **Framework:** Hono (`@hono/node-server`)
- **ORM:** Prisma 7 com `@prisma/adapter-pg`
- **Banco:** PostgreSQL 16
- **Logger:** Pino
- **Validação:** Zod
- **Container:** Docker (Alpine)

## Autenticação

Todas as rotas da API exigem o header:
```
X-API-Key: {JARVIS_API_KEY}
```

Definido em `.env`. A skill `jarvis-db` no OpenClaw injeta essa key automaticamente via variável de ambiente configurada no skill.

## Endpoints da API

```
GET  /health                    — health check
GET  /tasks                     — listar tarefas pendentes
POST /tasks                     — criar tarefa
PATCH /tasks/:id/complete        — concluir tarefa
PATCH /tasks/:id                 — atualizar tarefa (prioridade, prazo, título)
DELETE /tasks/:id                — apagar tarefa
DELETE /tasks                    — apagar todas as tarefas pendentes

GET  /reminders                 — listar lembretes pendentes
POST /reminders                 — criar lembrete
DELETE /reminders/:id           — cancelar lembrete

GET  /goals                     — listar metas ativas
POST /goals                     — criar meta
PATCH /goals/:id/pause          — pausar meta

GET  /facts                     — listar fatos do usuário
POST /facts                     — salvar fato
```

## Skill jarvis-db no OpenClaw

Localização: `~/.openclaw/workspace/skills/jarvis-db/skill.md`

Ensina o agente OpenClaw a chamar cada endpoint acima com os parâmetros corretos.
O arquivo `skill.md` já existe em `skills/jarvis-db/skill.md` neste repositório.

## Fluxo de um lembrete

1. Usuário: "Me lembra de comprar leite amanhã às 10h"
2. OpenClaw: entende a intenção
3. OpenClaw: chama `jarvis-db` → `POST /reminders {"title": "Comprar leite", "remindAt": "2026-06-29T10:00:00"}`
4. JARVIS API: salva no PostgreSQL
5. OpenClaw: registra cron nativo `--at 2026-06-29T10:00`
6. No horário: OpenClaw dispara → envia WhatsApp ao usuário

## Fluxo de um evento no Calendar

1. Usuário: "Adiciona reunião de trabalho sexta às 14h no meu calendário"
2. OpenClaw: entende a intenção
3. OpenClaw: chama ClawLink → `google-calendar` → cria evento
4. OpenClaw: confirma ao usuário via canal de origem
