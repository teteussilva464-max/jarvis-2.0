# Arquitetura de Skills — JARVIS 2.0

No JARVIS 2.0, o conceito de "plugin" do 1.0 foi substituído por "skill" do OpenClaw.

## Ideia central

O JARVIS 2.0 não gerencia canais nem integrações externas diretamente. O OpenClaw é o orquestrador que:
- Recebe mensagens de canais (Discord, WhatsApp, Telegram)
- Raciocina com modelos de IA (loop ReAct nativo)
- Chama skills para executar ações específicas
- Retorna respostas ao usuário no canal original

As skills são arquivos `.md` que ensinam o OpenClaw como usar um serviço externo.

---

## Skills deste projeto

### `jarvis-db` — Dados estruturados

**Localização:** `skills/jarvis-db/skill.md`

Ensina o OpenClaw a chamar a JARVIS API REST para gerenciar Tasks, Reminders, Goals e UserFacts no PostgreSQL.

**Quando o OpenClaw usa:**
- Usuário pede para criar/listar/completar tarefas
- Usuário pede para criar/cancelar lembretes
- Usuário pede para criar metas agendadas
- Usuário compartilha informação sobre si mesmo ("prefiro respostas curtas")

**Configuração necessária:**
```
JARVIS_API_URL=http://localhost:3001
JARVIS_API_KEY=<chave gerada no .env>
```

---

### `smart-home` — Controle da casa inteligente

**Localização:** `skills/smart-home/skill.md`

Ensina o OpenClaw a controlar dispositivos Tuya via TuyaClaw.

**Status:** Pendente teste do usuário com TuyaClaw.

**Quando o OpenClaw usa:**
- Usuário pede para ligar/desligar dispositivos
- Usuário pede cenas ("modo sono", "modo filme")
- Usuário pergunta sobre estado da casa

**Configuração necessária:**
```
TUYA_CLIENT_ID=...
TUYA_CLIENT_SECRET=...
TUYA_REGION=us
```

---

### `clawlink` — Integrações externas

**Localização:** `skills/clawlink/skill.md`

Ensina o OpenClaw a usar o ClawLink para Gmail, Google Calendar, GitHub, Notion e Slack.

**Quando o OpenClaw usa:**
- Usuário pede para ler/enviar emails
- Usuário pergunta sobre agenda
- Usuário pede para criar issue no GitHub
- Usuário pede para documentar algo no Notion
- Usuário pede para avisar no Slack

**Configuração necessária:** Autorizar cada serviço via OAuth no Dashboard OpenClaw > Connections.

---

## Como adicionar uma nova skill

1. Crie uma pasta em `skills/<nome-da-skill>/`
2. Crie `skills/<nome-da-skill>/skill.md` com:

```yaml
---
name: nome-da-skill
version: 1.0.0
description: Descrição clara de quando usar esta skill
model-visible: true
eligible: true
---

# Documentação da skill

## Quando usar
...

## Comandos disponíveis
...

## Exemplos
...
```

3. Copie para `~/.openclaw/workspace/skills/<nome-da-skill>/`
4. Reinicie o OpenClaw: `openclaw restart`
5. Registre a decisão de adicionar a skill em `docs/DECISIONS.md`

---

## Canais (gerenciados pelo OpenClaw, não pelo JARVIS)

| Canal | Como configurar |
|-------|----------------|
| Discord | Dashboard OpenClaw > Channels > Discord > adicionar bot token |
| WhatsApp | Dashboard OpenClaw > Channels > WhatsApp > escanear QR code |
| Telegram | Dashboard OpenClaw > Channels > Telegram > adicionar bot token |

**Importante:** Nunca implemente um canal diretamente neste repositório. Todos os canais de mensagem são responsabilidade do OpenClaw.

---

## Diferença em relação ao JARVIS 1.0

| JARVIS 1.0 | JARVIS 2.0 |
|-----------|------------|
| `src/plugins/discord/DiscordPlugin.ts` | Canal configurado no OpenClaw |
| `IntegrationPlugin` interface | Skill `.md` no OpenClaw |
| Plugin implementa `chat.inbound` | OpenClaw recebe mensagem nativamente |
| Plugin entrega resposta no canal | OpenClaw entrega resposta nativamente |
| Cada canal = código TypeScript novo | Cada canal = configuração no dashboard |
