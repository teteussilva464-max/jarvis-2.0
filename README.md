# JARVIS 2.0

**Just A Rather Very Intelligent System** — segunda geração do assistente pessoal autônomo do Matheus.

## O que mudou

| JARVIS 1.0 | JARVIS 2.0 |
|------------|------------|
| Node.js + Discord.js + Gemini (ReAct loop próprio) | OpenClaw como orquestrador (loop nativo) |
| Embedding com pgvector (instável) | Memória nativa SQLite + vector do OpenClaw |
| Um único canal (Discord) | Multi-canal: Discord, WhatsApp, Telegram |
| Gemini fixo (503 frequente) | Failover automático: Gemini → OpenAI → Claude |
| Cron manual via AgentService | Cron nativo do OpenClaw |
| ~2.000 linhas TypeScript de infraestrutura | API REST leve (~500 linhas) |

## Arquitetura resumida

```
Usuário (Discord / WhatsApp / Telegram)
           │
           ▼
       OpenClaw  ← orquestrador principal
           │
    ┌──────┴──────────────────┐
    │                         │
skills/jarvis-db        skills/smart-home
  (este projeto)          (TuyaClaw)
    │
    ▼
Hono REST API (porta 3001)
    │
    ▼
PostgreSQL (Tasks, Reminders, Goals, UserFacts)
```

A documentação completa está em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Pré-requisitos

- [OpenClaw](https://openclaw.ai) instalado e configurado
- Docker + Docker Compose
- Node.js 22+ (apenas para desenvolvimento local)

## Quick Start

```bash
# 1. Clone e configure variáveis
cp .env.example .env
# Edite .env com suas credenciais

# 2. Suba a API e o banco
docker compose up -d

# 3. Execute as migrations e seed
docker compose exec jarvis-api npm run prisma:deploy
docker compose exec jarvis-api npm run prisma:seed

# 4. Configure o agente no OpenClaw
# Copie agent/jarvis.md para ~/.openclaw/workspace/agents/jarvis/agent.md
# Copie a pasta skills/ para ~/.openclaw/workspace/skills/

# 5. Reinicie o OpenClaw
openclaw restart
```

Guia completo em [`docs/SETUP.md`](docs/SETUP.md).

## Skills disponíveis

| Skill | Função |
|-------|--------|
| `jarvis-db` | CRUD de Tasks, Reminders, Goals e UserFacts (PostgreSQL) |
| `smart-home` | Controle de dispositivos Tuya via TuyaClaw |
| `clawlink` | Gmail, Google Calendar, GitHub, Notion, Slack |

## Desenvolvimento local

```bash
npm install
npm run prisma:generate
npm run dev        # servidor com hot-reload em :3001
npm run lint       # verifica TypeScript
```
