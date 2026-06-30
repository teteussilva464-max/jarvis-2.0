# Contexto do Projeto — JARVIS 2.0

JARVIS 2.0 é a segunda geração do assistente pessoal autônomo do Matheus. É um substituto completo do JARVIS 1.0, não uma extensão.

## Missão

Ser um agente pessoal autônomo real: proativo, multi-canal, capaz de controlar a casa, gerenciar agenda, e nunca dizer "não posso".

## Arquitetura

O JARVIS 2.0 é dividido em duas partes:

**OpenClaw** — orquestrador principal (externo, não está neste repositório)
- Loop ReAct nativo (raciocínio multi-step)
- Memória de conversas (SQLite + vector)
- Failover automático de modelos (Gemini → OpenAI → Claude)
- Multi-canal nativo (Discord, WhatsApp, Telegram)
- Cron scheduler nativo
- Skills extensíveis

**JARVIS API** — este repositório
- API REST leve (Hono + Node.js + TypeScript)
- Banco de dados estruturado (PostgreSQL via Prisma)
- Expõe: Tasks, Reminders, Goals, UserFacts
- Autenticado via `X-API-Key`
- Roda na porta 3001

## O que este repositório NÃO faz

- Não gerencia conversas ou sessões
- Não chama Gemini, OpenAI ou Claude diretamente
- Não conecta ao Discord ou WhatsApp
- Não tem scheduler próprio (cron é do OpenClaw)
- Não tem memória semântica (é do OpenClaw)
- Não implementa loop de raciocínio

Tudo isso é responsabilidade do OpenClaw.

## Por que separar assim

O JARVIS 1.0 acumulou responsabilidades demais: orquestrava IA, gerenciava canais, fazia embeddings, rodava cron, e guardava dados — tudo no mesmo serviço Node.js. Isso gerou:
- Erros 503 frequentes do Gemini sem fallback
- Embeddings 404 (pgvector instável)
- Código complexo e difícil de evoluir
- Um único canal (Discord)

O 2.0 delega complexidade ao OpenClaw e mantém o JARVIS como um serviço simples e estável: só dados.

## Usuário

- **Nome:** Matheus
- **Idioma:** Português brasileiro
- **Fuso horário:** America/Sao_Paulo
- **Dispositivos Tuya:** luzes, tomadas (configurar após teste TuyaClaw)
- **Serviços:** Gmail, Google Calendar, GitHub, Notion, Slack (via ClawLink)

## Estado atual

Scaffold criado. Veja [`docs/TASKS.md`](TASKS.md) para o que falta implementar.
