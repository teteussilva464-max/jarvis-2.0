# JARVIS 2.0 — TARESAs para o Codex

> **Contexto:** JARVIS 2.0 é uma API REST leve em TypeScript/Hono que expõe dados estruturados (Tasks, Reminders, Goals, UserFacts) armazenados em PostgreSQL via Prisma. O OpenClaw é o orquestrador principal — ele usa a skill `jarvis-db` para chamar essa API.
>
> **Scaffold já criado (não mexa):**
> - `prisma/schema.prisma` — schema completo do banco
> - `package.json` — dependências (Hono, Prisma, pg, pino, zod, dotenv)
> - `tsconfig.json` — configuração TypeScript NodeNext
> - `skills/jarvis-db/skill.md` — documentação da skill para o OpenClaw
> - `.env.example` — variáveis de ambiente necessárias
> - `docs/ARCHITECTURE.md` — descrição completa da arquitetura
>
> **Sua missão:** implementar os arquivos TypeScript e de infraestrutura listados abaixo.

---

## TAREFA 1 — [Concluido] Configuração do cliente Prisma e logger

**Arquivo:** `src/lib/db.ts`

Crie e exporte um `PrismaClient` singleton usando o adapter de pg (`@prisma/adapter-pg`). Leia `DATABASE_URL` do environment. Exporte como `export const prisma`.

**Arquivo:** `src/lib/logger.ts`

Crie e exporte um logger Pino. Em `NODE_ENV=production` use JSON puro; caso contrário use `pino-pretty`. Leia `LOG_LEVEL` do environment (default `info`). Exporte como `export const logger`.

---

## TAREFA 2 — [Concluido] Middleware de autenticação

**Arquivo:** `src/middleware/auth.ts`

Crie um middleware Hono que:
1. Lê o header `X-API-Key` da requisição.
2. Compara com `process.env.JARVIS_API_KEY`.
3. Se ausente ou inválido, retorna `401 { ok: false, error: "Unauthorized" }`.
4. Se válido, chama `next()`.

Exporte como `export const authMiddleware`.

---

## TAREFA 3 — [Concluido] Rota de Tasks

**Arquivo:** `src/routes/tasks.ts`

Crie um `Hono` router com os seguintes endpoints. Use `zod` para validar bodies. Em caso de erro de validação retorne `400`. Em caso de Task não encontrada retorne `404`. Logue erros inesperados com o logger e retorne `500`.

| Método | Caminho | Comportamento |
|--------|---------|--------------|
| `GET` | `/tasks` | Lista tasks com `status = pending` do userId padrão. Aceita query param `?search=` para filtrar por `title` (case-insensitive, `contains`). Retorna array. |
| `POST` | `/tasks` | Cria uma task. Body: `{ title: string, priority?: "low"\|"medium"\|"high"\|"urgent", dueDate?: string (ISO8601), description?: string }`. Retorna a task criada. |
| `POST` | `/tasks/batch` | Cria múltiplas tasks de uma vez. Body: `{ titles: string[] }`. Usa `prisma.task.createMany`. Retorna array com as tasks criadas (ids e titles). Priority padrão `medium`. |
| `PATCH` | `/tasks/:id` | Atualiza campos opcionais: `title`, `priority`, `dueDate`, `description`. Retorna task atualizada. |
| `PATCH` | `/tasks/:id/complete` | Define `status = completed` e `completedAt = new Date()`. Retorna task atualizada. |
| `DELETE` | `/tasks/:id` | Deleta uma task pelo id. Retorna `{ ok: true }`. |
| `DELETE` | `/tasks` | Deleta todas as tasks com `status = pending` do userId padrão. Retorna `{ deleted: number }`. |

**Nota sobre userId:** Por enquanto use um userId fixo lido de `process.env.DEFAULT_USER_ID`. Adicione `DEFAULT_USER_ID` ao `.env.example` com valor `user_default`.

---

## TAREFA 4 — [Concluido] Rota de Reminders

**Arquivo:** `src/routes/reminders.ts`

Crie um `Hono` router com os seguintes endpoints:

| Método | Caminho | Comportamento |
|--------|---------|--------------|
| `GET` | `/reminders` | Lista reminders com `status = pending` do userId padrão, ordenados por `remindAt` ASC. |
| `POST` | `/reminders` | Cria um reminder. Body: `{ title: string, message?: string, remindAt: string (ISO8601, required), recurrence?: "daily"\|"weekly"\|"monthly" }`. Se `message` não fornecido, use `title` como message. Retorna o reminder criado. |
| `DELETE` | `/reminders/:id` | Define `status = cancelled`. Retorna `{ ok: true }`. |

---

## TAREFA 5 — [Concluido] Rota de Goals

**Arquivo:** `src/routes/goals.ts`

Crie um `Hono` router com os seguintes endpoints:

| Método | Caminho | Comportamento |
|--------|---------|--------------|
| `GET` | `/goals` | Lista goals com `status = active` do userId padrão. |
| `POST` | `/goals` | Cria um goal. Body: `{ title: string, description: string, schedule?: string (cron), triggerAt?: string (ISO8601) }`. Pelo menos um de `schedule` ou `triggerAt` deve estar presente (valide com zod `.refine()`). Retorna o goal criado. |
| `PATCH` | `/goals/:id/pause` | Define `status = paused`. Retorna `{ id, status: "paused" }`. |

---

## TAREFA 6 — [Concluido] Rota de UserFacts

**Arquivo:** `src/routes/facts.ts`

Crie um `Hono` router com os seguintes endpoints:

| Método | Caminho | Comportamento |
|--------|---------|--------------|
| `GET` | `/facts` | Lista todos os facts do userId padrão, ordenados por `createdAt` DESC. |
| `POST` | `/facts` | Cria um fact. Body: `{ category: "preference"\|"identity"\|"routine"\|"work"\|"project"\|"other", fact: string, confidence?: number (0.0-1.0, default 0.7) }`. Retorna o fact criado. |
| `DELETE` | `/facts/:id` | Deleta um fact pelo id. Retorna `{ ok: true }`. |

---

## TAREFA 7 — [Concluido] Entry point da aplicação

**Arquivo:** `src/index.ts`

Monte a aplicação Hono completa:

1. Carregue variáveis de ambiente com `dotenv/config`.
2. Crie app Hono com middleware global de logging (log método + path de cada request, com duração em ms).
3. Aplique `authMiddleware` em todas as rotas.
4. Monte os routers:
   - `/tasks` → router de tasks
   - `/reminders` → router de reminders
   - `/goals` → router de goals
   - `/facts` → router de facts
5. Adicione rota `GET /health` que retorna `{ ok: true, version: "2.0.0", timestamp: new Date().toISOString() }` **sem** autenticação (health check não deve exigir API key).
6. Handler global de erro: retorne `500 { ok: false, error: "Internal server error" }` e logue o erro.
7. Suba o servidor com `@hono/node-server` na porta `process.env.PORT ?? 3001`.
8. Logue `JARVIS 2.0 API listening on port {PORT}` ao iniciar.

---

## TAREFA 8 — [Concluido] Docker

**Arquivo:** `Dockerfile`

Multi-stage build:

```
Stage build: node:22-alpine
  - WORKDIR /app
  - Copie package*.json e instale dependências (npm ci)
  - Copie prisma/ e gere o client (npx prisma generate)
  - Copie src/ e compile (npm run build)

Stage runner: node:22-alpine
  - WORKDIR /app
  - ENV NODE_ENV=production
  - Crie usuário não-root: addgroup -g 1001 -S nodejs && adduser -S jarvis -u 1001
  - Copie node_modules, dist/, prisma/ do stage build
  - Copie package*.json
  - USER jarvis
  - EXPOSE 3001
  - CMD ["npm", "start"]
```

**Arquivo:** `docker-compose.yml`

Defina dois serviços:

**`postgres`**
- Image: `postgres:16-alpine`
- Env: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (lidos de arquivo `.env`)
- Volume nomeado `postgres_data` em `/var/lib/postgresql/data`
- Healthcheck: `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}`

**`jarvis-api`**
- Build: `.`
- Porta: `3001:3001`
- Depende de `postgres` com `condition: service_healthy`
- `env_file: .env`
- Restart: `unless-stopped`

---

## TAREFA 9 — [Concluido] Script de seed do banco

**Arquivo:** `prisma/seed.ts`

Crie o usuário padrão no banco se não existir:

```ts
await prisma.user.upsert({
  where: { id: process.env.DEFAULT_USER_ID ?? "user_default" },
  update: {},
  create: {
    id: process.env.DEFAULT_USER_ID ?? "user_default",
    name: "Matheus",
    preferredName: "Matheus",
    timezone: "America/Sao_Paulo",
  },
});
```

Adicione o script `"prisma": { "seed": "tsx prisma/seed.ts" }` ao `package.json`.

---

## TAREFA 10 — [Concluido] Configurar datasource do Prisma 7

**Arquivos:** `prisma/schema.prisma`, `prisma.config.ts`

A datasource `db` permanece no schema sem `url`, porque o Prisma 7.8.0 rejeita `url` em `schema.prisma`. A URL do banco foi configurada em `prisma.config.ts`:

```ts
datasource: {
  url: process.env.DATABASE_URL ?? "postgresql://jarvis:trocar_para_senha_forte@localhost:5432/jarvis2_db"
}
```

Sem isso o `prisma generate` e `prisma migrate` falham no Prisma 7.

---

## Ordem de execução sugerida para o Codex

1. TAREFA 10 (fix schema — pré-requisito de tudo)
2. TAREFA 1 (db + logger — pré-requisito das rotas)
3. TAREFA 2 (auth middleware)
4. TARESAs 3, 4, 5, 6 (rotas — podem ser feitas em paralelo)
5. TAREFA 7 (entry point — monta tudo)
6. TAREFA 8 (Docker)
7. TAREFA 9 (seed)

Após implementar, rode `npm run lint` para checar erros de TypeScript.

---

## TAREFA 11 — [Concluido] Remover `prisma/migrations/` do `.gitignore`

**Arquivo:** `.gitignore`

Remova a linha `prisma/migrations/` do `.gitignore`.

**Motivo:** Migrations do Prisma devem ser versionadas no git — são a fonte da verdade do schema do banco. Ignorá-las impede que `prisma migrate deploy` funcione corretamente em qualquer ambiente além da máquina onde foram geradas.

Não altere nenhuma outra linha do `.gitignore`.

---

## TAREFA 12 — [Concluido] Validação de variáveis de ambiente no startup

**Arquivo:** `src/index.ts`

Logo após o bloco de imports (antes da criação do `app`), adicione uma verificação que aborta o processo se variáveis obrigatórias não estiverem definidas:

```ts
const requiredEnvVars = ["JARVIS_API_KEY", "DATABASE_URL", "DEFAULT_USER_ID"] as const;
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    // usa console.error aqui porque logger pode não estar inicializado ainda
    console.error(`[JARVIS] Variável de ambiente obrigatória não definida: ${key}`);
    process.exit(1);
  }
}
```

**Motivo:** Sem essa verificação, o servidor sobe silenciosamente com configuração inválida — ex: sem `JARVIS_API_KEY`, todas as requisições retornam 401 sem aviso; sem `DATABASE_URL`, o erro só aparece na primeira query.

---

## TAREFA 13 — [Concluido] Graceful shutdown

**Arquivo:** `src/index.ts`

Após a chamada `serve(...)`, adicione handlers de sinal para fechar conexões corretamente antes de encerrar:

```ts
const shutdown = async () => {
  logger.info("Encerrando JARVIS API...");
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

Importe `prisma` de `"./lib/db.js"` no `src/index.ts` (já está indiretamente disponível via rotas, mas precisa ser importado explicitamente aqui).

**Motivo:** Sem isso, o `pg.Pool` e o `PrismaClient` não fecham as conexões ao encerrar o processo. Reinicializações frequentes em desenvolvimento causam acúmulo de conexões abertas no PostgreSQL.

---

## TAREFA 14 — [Concluido] Health check com verificação de banco

**Arquivo:** `src/index.ts`

Substitua o handler atual do `/health` por uma versão que verifica conectividade com o banco:

```ts
app.get("/health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ ok: true, version: "2.0.0", timestamp: new Date().toISOString() });
  } catch {
    return c.json({ ok: false, error: "Database unavailable" }, 503);
  }
});
```

Importe `prisma` de `"./lib/db.js"` (necessário também para a TAREFA 13).

**Motivo:** O health check atual sempre retorna `200 ok: true` mesmo com o banco down. Isso mascara falhas reais.

---

## TAREFA 15 — [Concluido] Comparação da API Key resistente a timing attack

**Arquivo:** `src/middleware/auth.ts`

Substitua a comparação direta de strings por `crypto.timingSafeEqual`:

```ts
import type { MiddlewareHandler } from "hono";
import { timingSafeEqual, createHash } from "node:crypto";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const apiKey = c.req.header("X-API-Key");
  const expectedKey = process.env.JARVIS_API_KEY;

  if (!apiKey || !expectedKey) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  const provided = createHash("sha256").update(apiKey).digest();
  const expected = createHash("sha256").update(expectedKey).digest();

  if (!timingSafeEqual(provided, expected)) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  await next();
};
```

**Motivo:** A comparação `!==` não é constant-time — um atacante pode medir diferenças de tempo de resposta para deduzir a chave caractere por caractere. Fazer o hash das duas strings antes de comparar garante que `timingSafeEqual` compara buffers de tamanho fixo.

---

## TAREFA 16 — [Concluido] Limite de tamanho do body das requisições

**Arquivo:** `src/index.ts`

Adicione o middleware `bodyLimit` do Hono logo após o middleware de logging global (antes do `/health` e do `authMiddleware`):

```ts
import { bodyLimit } from "hono/body-limit";

// após o middleware de logging:
app.use(bodyLimit({ maxSize: 50 * 1024 })); // 50 KB
```

Se o body exceder 50 KB, o Hono retorna automaticamente `413 Content Too Large`.

**Motivo:** Sem limite, um cliente pode enviar payloads enormes e esgotar a memória do processo Node.js.

---

## TAREFA 17 — [Concluido] Endpoints POST retornam 201 Created

**Arquivos:** `src/routes/tasks.ts`, `src/routes/reminders.ts`, `src/routes/goals.ts`, `src/routes/facts.ts`

Em cada rota `POST` que cria um recurso, adicione o status `201` no `c.json(...)`:

- `src/routes/tasks.ts` — `POST /` (criar task): `return c.json(task, 201)`
- `src/routes/tasks.ts` — `POST /batch` (batch): `return c.json(tasks.map(...), 201)`
- `src/routes/reminders.ts` — `POST /` (criar reminder): `return c.json(reminder, 201)`
- `src/routes/goals.ts` — `POST /` (criar goal): `return c.json(goal, 201)`
- `src/routes/facts.ts` — `POST /` (criar fact): `return c.json(fact, 201)`

Não altere nenhum outro handler. GETs, PATCHs e DELETEs permanecem sem código de status explícito (implicitamente 200).

**Motivo:** Por convenção REST, criação de recursos retorna `201 Created`, não `200 OK`. A skill `jarvis-db` no OpenClaw pode depender do status correto para interpretar respostas.

---

## Ordem de execução sugerida para as novas TARESAs

As TARESAs 11–17 são independentes entre si e podem ser executadas em qualquer ordem. Sugestão:

1. TAREFA 11 (`.gitignore` — sem código TypeScript, só configuração)
2. TAREFA 12 (startup validation)
3. TAREFA 13 + 14 juntas (ambas modificam `src/index.ts` e precisam do import de `prisma`)
4. TAREFA 15 (auth middleware — arquivo isolado)
5. TAREFA 16 (body limit — uma linha em `src/index.ts`)
6. TAREFA 17 (status 201 — alterações simples em 4 arquivos de rota)

Após cada implementação, rode `npm run lint` para checar erros de TypeScript.

---

## TAREFA 18 — [Concluido] Script de instalação das skills no OpenClaw

**Arquivo:** `scripts/install-openclaw-skills.ts`

Crie um script TypeScript executável com `tsx` que instala automaticamente as skills e o agente JARVIS no workspace do OpenClaw.

### O que o script deve fazer:

1. Ler a variável `OPENCLAW_WORKSPACE` do `.env` (default: `~/.openclaw/workspace`).
2. Criar os diretórios de destino se não existirem:
   - `{workspace}/agents/jarvis/`
   - `{workspace}/skills/jarvis-db/`
   - `{workspace}/skills/smart-home/`
   - `{workspace}/skills/clawlink/`
3. Copiar os arquivos:
   - `agent/jarvis.md` → `{workspace}/agents/jarvis/agent.md`
   - `skills/jarvis-db/skill.md` → `{workspace}/skills/jarvis-db/skill.md`
   - `skills/smart-home/skill.md` → `{workspace}/skills/smart-home/skill.md`
   - `skills/clawlink/skill.md` → `{workspace}/skills/clawlink/skill.md`
4. Substituir no `skills/jarvis-db/skill.md` copiado:
   - `{JARVIS_API_URL}` → valor de `process.env.JARVIS_API_URL ?? "http://localhost:3001"`
   - `{JARVIS_API_KEY}` → valor de `process.env.JARVIS_API_KEY`
5. Imprimir ao final quais arquivos foram copiados e o caminho de destino.

### Implementação com `node:fs` e `node:path`:

```ts
import "dotenv/config";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const workspace = process.env.OPENCLAW_WORKSPACE
  ?? join(homedir(), ".openclaw", "workspace");

// ... lógica de cópia e substituição
```

Use `mkdirSync` com `{ recursive: true }` para criar diretórios.
Use `readFileSync` + `replace` + `writeFileSync` para substituir as variáveis no skill.md do jarvis-db.

### Adicionar ao `package.json`:

```json
"scripts": {
  "install:skills": "tsx scripts/install-openclaw-skills.ts"
}
```

### Adicionar ao `.env.example`:

```
# Caminho do workspace do OpenClaw (default: ~/.openclaw/workspace)
OPENCLAW_WORKSPACE=
```

**Motivo:** O HANDOFF.md lista como pendência "Copiar agent/jarvis.md e skills/ para o OpenClaw". Esse script automatiza esse passo e injeta as credenciais corretas no skill.md, eliminando erro manual.

**Rodar com:**
```bash
npm run install:skills
```

---

## TAREFA 19 — [Concluido] Fechar servidor HTTP no graceful shutdown

**Arquivo:** `src/index.ts`

O `serve()` do `@hono/node-server` retorna um objeto com método `.close()`. Atualmente o shutdown desconecta o Prisma mas não para o servidor de aceitar novas requisições — conexões recebidas nesse intervalo receberiam erro 500.

Altere o trecho de inicialização e shutdown para capturar o servidor:

```ts
// Substituir a chamada serve(...) atual por:
const server = serve(
  { fetch: app.fetch, port },
  () => {
    logger.info(`JARVIS 2.0 API listening on port ${port}`);
  }
);

const shutdown = async () => {
  logger.info("Encerrando JARVIS API...");
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

**Não altere nenhum outro trecho.** Apenas capture o retorno de `serve()` e chame `server.close()` antes de `prisma.$disconnect()`.

**Motivo:** Sem `server.close()`, o servidor continua aceitando novas requisições enquanto o pool de conexões do Prisma já está fechado. As requisições recebidas nesse intervalo falhariam com 500.

---

## TAREFA 20 — [Concluido] Adicionar skill `whatsapp` ao script de instalação

**Arquivo:** `scripts/install-openclaw-skills.ts`

A skill `skills/whatsapp/skill.md` foi criada para integração com Evolution API. O script de instalação atual só copia `jarvis-db`, `smart-home` e `clawlink`. Adicionar a cópia da skill `whatsapp`.

### Mudança necessária

No array `copies`, adicionar o item:

```ts
{
  source: join(projectRoot, "skills", "whatsapp", "skill.md"),
  destination: join(workspace, "skills", "whatsapp", "skill.md")
}
```

O arquivo destino é `{workspace}/skills/whatsapp/skill.md`. Não precisa de substituição de variáveis (a skill usa placeholders que o OpenClaw resolve em runtime a partir do `.env`).

### Resultado esperado ao rodar `npm run install:skills`

```
Skills e agente JARVIS instalados no OpenClaw:
- C:\Users\matth\.openclaw\workspace\agents\jarvis\agent.md
- C:\Users\matth\.openclaw\workspace\skills\jarvis-db\skill.md
- C:\Users\matth\.openclaw\workspace\skills\smart-home\skill.md
- C:\Users\matth\.openclaw\workspace\skills\clawlink\skill.md
- C:\Users\matth\.openclaw\workspace\skills\whatsapp\skill.md
```

**Não altere nenhuma outra parte do script.**

**Motivo:** Sem essa adição, o `npm run install:skills` não instala a skill de WhatsApp no workspace do OpenClaw e o agente JARVIS não tem acesso à documentação da skill.

---

## TAREFA 21 — [Concluido] Skills zero-config do ClaHHub (weather, news, data-analysis, language-learning, automation-workflows, skill-creator)

**Contexto:** Matheus é Data Analyst e Dev Full-stack. Instalar seis skills do ClaHHub sem API key adicional. São operações de CLI puro no OpenClaw. Prioridade: data-analysis e automation-workflows para o contexto de trabalho; weather/news para uso pessoal; language-learning e skill-creator como bônus.

### Comandos a executar (nessa ordem — da mais usada para a menos)

```bash
openclaw skills install @ivangdavila/data-analysis
openclaw skills install @jk-0001/automation-workflows
openclaw skills install @steipete/weather
openclaw skills install @joargp/news-summary
openclaw skills install @chipagosfinest/language-learning
openclaw skills install @chindden/skill-creator
```

### Após instalar

1. Confirmar instalação:
```bash
openclaw skills list --json
```

2. Atualizar `agent/jarvis.md` — adicionar as novas skills à tabela de Skills Disponíveis:

```markdown
| `data-analysis` | análise de dados, SQL, Python, KPIs, dashboards, relatórios, cohort, A/B test |
| `automation-workflows` | automação de processos, Zapier/Make/n8n, pipelines, integrações |
| `weather` | clima atual, previsão do tempo, temperatura |
| `news-summary` | resumo de notícias, briefing diário, acontecimentos |
| `language-learning` | aprender idioma, praticar conversação, vocabulário |
| `skill-creator` | criar nova skill para OpenClaw, empacotar skill |
```

3. Rodar `npm run install:skills` para propagar o agent.md atualizado.

4. Fazer smoke test das mais críticas:
```bash
openclaw agent --agent jarvis --session-key agent:jarvis:smoke-data \
  --message "Me explica como faria uma análise de cohort em SQL" --timeout 90 --json

openclaw agent --agent jarvis --session-key agent:jarvis:smoke-weather \
  --message "Qual o clima agora em São Paulo?" --timeout 60 --json
```

5. Atualizar `docs/HANDOFF.md` com resultado.

**Motivo:** Data-analysis é essencial para o trabalho diário de Matheus como Data Analyst. Automation-workflows é relevante para Dev Full-stack automatizar processos repetitivos. As demais complementam uso pessoal e produtividade.

---

## TAREFA 22 — [Concluido] Verificar e instalar tuya-smart-control (avaliar conflito com smart-home)

**Contexto:** O ClaHHub tem a skill `@gaosq856/tuya-smart-control` que usa `TUYA_API_KEY` direto na REST API Tuya. O projeto já tem `skills/smart-home/skill.md` que documenta o TuyaClaw (`TUYA_CLIENT_ID` + `TUYA_CLIENT_SECRET`). Antes de instalar, verificar se as credenciais são compatíveis.

### Investigação necessária

1. Verificar o formato de `TUYA_API_KEY` que a skill espera:
```bash
openclaw skills inspect @gaosq856/tuya-smart-control --json 2>/dev/null || \
  openclaw skills install @gaosq856/tuya-smart-control --dry-run 2>&1
```

2. Verificar se `TUYA_CLIENT_ID` do `.env` pode ser usado como `TUYA_API_KEY` ou se são credenciais diferentes (checar docs Tuya IoT Cloud).

### Se as credenciais forem compatíveis

```bash
openclaw skills install @gaosq856/tuya-smart-control
```

Configurar a variável se necessário:
```bash
openclaw config set env.TUYA_API_KEY "$(grep TUYA_CLIENT_ID .env | cut -d= -f2)"
```

### Se houver conflito

Manter a `skills/smart-home/skill.md` existente como documentação primária e **não instalar** a skill do ClaHHub. Registrar decisão em `docs/DECISIONS.md`.

### Atualizar HANDOFF.md com resultado.

**Motivo:** Duplicar skills de smart home com credenciais diferentes pode causar conflito ou confusão no agente. Precisa investigar antes de instalar.

---

## TAREFA 23 — Setup e instalação da proactive-agent

**Contexto:** A skill `@halthelobster/proactive-agent` transforma o JARVIS em um agente proativo com memória persistente usando WAL Protocol. É a skill de maior impacto mas requer criação de arquivos de setup.

### Passo 1 — Instalar a skill

```bash
openclaw skills install @halthelobster/proactive-agent
```

### Passo 2 — Criar arquivos de onboarding no diretório do agente

Criar os seguintes arquivos em `C:\Users\matth\.openclaw\agents\jarvis\agent\`:

**`ONBOARDING.md`** — perfil do usuário:
```markdown
# Onboarding — Matheus

## Quem sou
Nome: Matheus. Brasil, fuso America/Sao_Paulo (UTC-3).
Trabalho como Data Analyst e Dev Full-stack na minha empresa.

## Uso do JARVIS
- **Trabalho**: análise de dados (SQL, Python, dashboards), desenvolvimento full-stack (APIs, frontend, backend), automação de workflows, code review e debugging
- **Pessoal**: lembretes, tarefas, controle smart home, clima, notícias

## Preferências de comunicação
- Respostas curtas e diretas, sem enrolação
- Tom informal e descontraído — como um colega técnico competente
- Sem prefixos genéricos ("Claro!", "Entendido!")
- Português brasileiro sempre
- Em código: sem comentários óbvios, nomes de variáveis claros

## Habilidades do usuário (não explicar o básico)
- SQL avançado, Python (pandas, numpy, visualização)
- JavaScript/TypeScript, Node.js, REST APIs
- Docker, Git, conceitos de dados e analytics
- Familiarizado com OpenClaw e JARVIS 2.0

## Projetos ativos
- JARVIS 2.0 (esta API + OpenClaw — assistente pessoal)
- Projetos da empresa (dev full-stack + analytics)
- Smart home com dispositivos Tuya
```

**`SOUL.md`** — princípios do agente:
```markdown
# SOUL — Princípios do JARVIS

- Resolve, não declina
- Antecipa — age antes de ser pedido
- Aprende com cada interação
- Memória persistente: sempre salva preferências importantes como UserFacts
- Autonomia total dentro dos limites éticos
```

**`USER.md`** — fatos do usuário (inicializar vazio, será populado dinamicamente):
```markdown
# USER — Fatos sobre Matheus

(Populado automaticamente conforme o JARVIS aprende sobre o usuário)
```

**`MEMORY.md`** e **`SESSION-STATE.md`** — inicializar vazios (o agente popula automaticamente).

### Passo 3 — Smoke test
```bash
openclaw agent --agent jarvis --session-key agent:jarvis:smoke-proactive \
  --message "Olá JARVIS, como você funciona?" --timeout 120 --json
```

### Passo 4 — Atualizar `docs/HANDOFF.md`

**Motivo:** O proactive-agent adiciona WAL Protocol (captura decisões antes de responder), Working Buffer (registra trocas próximas do limite de contexto) e Compaction Recovery (recupera contexto após truncagem). Impacto direto na qualidade das respostas em conversas longas.

---

## TAREFA 24 — [Concluido] Subagentes especializados: JARVIS-CODER e JARVIS-ANALYST

**Contexto:** Matheus é Data Analyst e Dev Full-stack. Para tarefas de trabalho (código, SQL, análise de dados), o JARVIS precisa delegar a subagentes especializados com o modelo certo para cada função. Isso libera o agente principal para continuar a conversa enquanto o subagente trabalha.

### Arquitetura alvo

```
JARVIS (orquestrador — google/gemini-2.5-flash)
    ├── Chat, clima, lembretes, notícias → resolve direto
    ├── Código, debugging, full-stack → spawna JARVIS-CODER (openai/gpt-5.3-codex)
    └── SQL, análise de dados, relatórios → spawna JARVIS-ANALYST (google/gemini-2.5-flash, contexto longo)
```

### Passo 1 — Instalar agent-team-orchestration

```bash
openclaw skills install @arminnaimi/agent-team-orchestration
```

### Passo 2 — Criar configuração do agente JARVIS-CODER no OpenClaw

```bash
openclaw config set agents.list[2].id "jarvis-coder"
openclaw config set agents.list[2].name "jarvis-coder"
openclaw config set agents.list[2].workspace "C:\\Users\\matth\\.openclaw\\workspace"
openclaw config set agents.list[2].model.primary "openai/gpt-5.3-codex"
openclaw config set agents.list[2].model.fallbacks[0] "openai/gpt-5.5"
openclaw config set agents.list[2].model.fallbacks[1] "google/gemini-2.5-flash"
openclaw config set agents.list[2].contextTokens 16000
openclaw config set agents.list[2].tools.profile "coding"
```

### Passo 3 — Criar configuração do agente JARVIS-ANALYST

```bash
openclaw config set agents.list[3].id "jarvis-analyst"
openclaw config set agents.list[3].name "jarvis-analyst"
openclaw config set agents.list[3].workspace "C:\\Users\\matth\\.openclaw\\workspace"
openclaw config set agents.list[3].model.primary "google/gemini-2.5-flash"
openclaw config set agents.list[3].model.fallbacks[0] "openai/gpt-5.5"
openclaw config set agents.list[3].contextTokens 32000
openclaw config set agents.list[3].tools.profile "coding"
```

### Passo 4 — Criar agent.md para cada subagente

Criar `C:\Users\matth\.openclaw\workspace\agents\jarvis-coder\agent.md`:

```markdown
---
name: JARVIS-CODER
version: 1.0.0
description: Subagente especializado em código — geração, debugging, review e arquitetura full-stack. Spawned pelo JARVIS principal para tarefas de desenvolvimento.
language: pt-BR
model-primary: openai/gpt-5.3-codex
model-fallback:
  - openai/gpt-5.5
  - google/gemini-2.5-flash
---

# JARVIS-CODER

Você é o subagente de código do JARVIS. Especializado em desenvolvimento full-stack (TypeScript, Node.js, Python, SQL, APIs REST, Docker).

**Matheus é Dev experiente — não explique o básico. Vá direto ao código.**

- Sem comentários óbvios no código
- Prefira soluções diretas sem over-engineering
- Quando tiver múltiplas opções, recomende uma com o trade-off principal
- Retorne o resultado ao agente principal ao finalizar
```

Criar `C:\Users\matth\.openclaw\workspace\agents\jarvis-analyst\agent.md`:

```markdown
---
name: JARVIS-ANALYST
version: 1.0.0
description: Subagente especializado em análise de dados — SQL, Python, KPIs, dashboards, relatórios e insights. Spawned pelo JARVIS principal para tarefas analíticas.
language: pt-BR
model-primary: google/gemini-2.5-flash
model-fallback:
  - openai/gpt-5.5
---

# JARVIS-ANALYST

Você é o subagente de dados do JARVIS. Especializado em análise de dados (SQL avançado, Python/pandas, KPIs, cohort analysis, A/B testing, dashboards).

**Matheus é Data Analyst experiente — não explique conceitos básicos.**

- Foque em insights acionáveis, não em métricas por métricas
- Sempre defina qual decisão a análise vai impactar antes de executar
- Prefira queries otimizadas e código limpo
- Retorne o resultado ao agente principal ao finalizar
```

### Passo 5 — Atualizar `agent/jarvis.md` com instruções de delegação

Adicionar seção ao `agent/jarvis.md`:

```markdown
## Delegação para Subagentes

Para tarefas de trabalho técnico, spawne o subagente especializado em vez de resolver direto:

| Tarefa | Subagente | Quando usar |
|---|---|---|
| Código, debugging, full-stack, API | `jarvis-coder` | "cria uma função", "corrige esse bug", "como implementar X" |
| SQL, análise de dados, KPIs, relatório | `jarvis-analyst` | "analisa esse dataset", "escreve uma query", "me dá insights sobre X" |

Chat, clima, lembretes e tarefas simples: resolve direto sem spawnar.
```

### Passo 6 — Reiniciar gateway e smoke test

```bash
openclaw gateway restart

openclaw agent --agent jarvis --session-key agent:jarvis:smoke-coder \
  --message "Preciso de uma função TypeScript que valida CPF. Me passa o código." \
  --timeout 120 --json

openclaw agent --agent jarvis --session-key agent:jarvis:smoke-analyst \
  --message "Como eu faria uma análise de retenção de usuários em SQL?" \
  --timeout 120 --json
```

### Passo 7 — Atualizar `docs/HANDOFF.md` e `npm run install:skills`

**Motivo:** Com subagentes especializados, JARVIS usa o modelo certo para cada tarefa (GPT-Codex para código, Gemini para dados) sem bloquear a conversa principal. Matheus pode pedir uma análise de dados e continuar falando enquanto o JARVIS-ANALYST trabalha em paralelo. É a diferença entre um assistente genérico e um time de especialistas.

---

## TAREFA 25 — Subagente JARVIS-DESIGNER para trabalhos freelancer de design

**Contexto:** Matheus faz trabalhos freelancer de branding e landing pages. Tem background de web developer, então é forte em HTML/CSS e estrutura, mas não é especialista em brand design. O ClaHHub tem duas skills diretamente relevantes: `SuperDesign` (guidelines de UI para landing pages e dashboards) e `UI/UX Pro Max` (design intelligence para interfaces polidas). Também há `Nano Banana Pro` para geração de imagens (mockups, moodboards, logos conceituais).

### Arquitetura alvo

```
JARVIS (orquestrador)
    └── Design, branding, landing page, UI/UX → spawna JARVIS-DESIGNER (google/gemini-2.5-flash)
```

### Passo 1 — Instalar as skills de design do ClaHHub

```bash
openclaw skills install @nicnocquee/superdesign
openclaw skills install @clawdbot/ui-ux-pro-max
openclaw skills install @clawdbot/nano-banana-pro
```

Se algum slug estiver errado, buscar com:
```bash
openclaw skills search "superdesign"
openclaw skills search "ui ux pro max"
openclaw skills search "nano banana"
```

Confirmar instalação:
```bash
openclaw skills list --json | grep -E "superdesign|ui-ux|nano-banana"
```

### Passo 2 — Criar configuração do agente JARVIS-DESIGNER no OpenClaw

```bash
openclaw config set agents.list[4].id "jarvis-designer"
openclaw config set agents.list[4].name "jarvis-designer"
openclaw config set agents.list[4].workspace "C:\\Users\\matth\\.openclaw\\workspace"
openclaw config set agents.list[4].model.primary "google/gemini-2.5-flash"
openclaw config set agents.list[4].model.fallbacks[0] "openai/gpt-5.5"
openclaw config set agents.list[4].contextTokens 16000
```

### Passo 3 — Criar agent.md do JARVIS-DESIGNER

Criar `C:\Users\matth\.openclaw\workspace\agents\jarvis-designer\agent.md`:

```markdown
---
name: JARVIS-DESIGNER
version: 1.0.0
description: Subagente especializado em design freelancer — branding, landing pages, UI/UX e identidade visual. Spawned pelo JARVIS principal para projetos de design.
language: pt-BR
model-primary: google/gemini-2.5-flash
model-fallback:
  - openai/gpt-5.5
---

# JARVIS-DESIGNER

Você é o subagente de design do JARVIS. Especializado em projetos freelancer: branding, landing pages, identidade visual e UI/UX.

**Matheus tem background de web developer (HTML/CSS/JS) — foque em outputs práticos que ele consiga implementar diretamente.**

## Foco de atuação

- **Landing pages**: estrutura de conversão (hero, prova social, CTA, FAQ), hierarquia visual, copywriting direto
- **Branding básico**: paleta de cores (com hex), tipografia (Google Fonts prioritariamente), mood board conceitual
- **UI/UX**: feedback sobre layouts, acessibilidade básica, consistência visual
- **Geração de imagens**: mockups conceituais, logos vetorizados (SVG quando possível), variações de cor

## Comportamento

- Sempre entregue valores concretos: hex de cores, nomes de fontes, tamanhos em px/rem
- Para landing pages: entregue estrutura HTML/CSS quando fizer sentido (Matheus sabe implementar)
- Para branding: apresente 2-3 direções conceituais antes de aprofundar em uma
- Para imagens: use `nano-banana-pro` para gerar mockups; descreva o prompt usado
- Use `superdesign` para guidelines de UI e `ui-ux-pro-max` para validação de decisões de design
- Retorne o resultado ao agente principal ao finalizar

## Entregáveis padrão por tipo de pedido

| Pedido | Entrega mínima |
|---|---|
| Paleta de cores | 5 cores (primary, secondary, accent, background, text) com hex e uso |
| Tipografia | Heading + body font, tamanhos para h1/h2/h3/p, peso |
| Landing page | Seções mapeadas + copy sugerido para hero + CTA |
| Logo conceitual | Descrição + geração via nano-banana-pro |
| UI review | Lista de problemas + sugestão de fix para cada um |
```

### Passo 4 — Atualizar `agent/jarvis.md` com delegação para JARVIS-DESIGNER

Na seção `## Delegação para Subagentes` (criada na TAREFA 24), adicionar a linha:

```markdown
| Design, branding, landing page, logo, UI review | `jarvis-designer` | "cria uma paleta", "preciso de uma landing page", "revisa esse layout", "faz um logo" |
```

### Passo 5 — Atualizar skills table em `agent/jarvis.md`

Adicionar as novas skills instaladas à tabela de Skills Disponíveis:

```markdown
| `superdesign` | guidelines de UI, padrões de design para landing pages e dashboards |
| `ui-ux-pro-max` | design intelligence, validação de decisões de UI/UX |
| `nano-banana-pro` | geração e edição de imagens (mockups, logos, moodboards) |
```

### Passo 6 — Rodar `npm run install:skills` e smoke test

```bash
npm run install:skills

openclaw gateway restart

openclaw agent --agent jarvis --session-key agent:jarvis:smoke-designer \
  --message "Matheus aqui. Tenho um cliente de consultoria financeira e preciso de uma identidade visual básica: paleta de cores e tipografia. Público B2B, tom profissional e sóbrio." \
  --timeout 180 --json
```

### Passo 7 — Atualizar `docs/HANDOFF.md`

**Motivo:** Matheus faz freelancer de branding e landing pages mas não é especialista em brand design — ele se descreve como "me arrisco por entender um pouco de web designer". O JARVIS-DESIGNER preenche essa lacuna: entrega paletas, tipografias, estrutura de landing page e mockups conceituais que ele pode implementar diretamente com o conhecimento técnico que já tem. As skills `SuperDesign` e `UI/UX Pro Max` do ClaHHub são exatamente a camada de design intelligence que faltava.

---

## TAREFA 26 — Skills complementares: Github, Excel, Powerpoint, Word, Agent Browser, Evolver, Humanizer, Deep Research Pro

**Contexto:** Após revisão completa das 93 skills do ClaHHub cruzada com o stack atual, oito skills preenchem gaps reais nos subagentes e no JARVIS principal. Nenhuma duplica o que já está instalado ou planejado.

### Mapeamento de valor por subagente

| Skill | Subagente beneficiado | Gap preenchido |
|---|---|---|
| `github` | JARVIS-CODER | gh CLI nativo: PRs, issues, code review, CI runs — o clawlink faz GitHub básico via API, isso é shell-level completo |
| `excel-xlsx` | JARVIS-ANALYST | Exportar análises para planilhas com fórmulas, tipos, formatação — fluxo obrigatório para Data Analyst |
| `powerpoint-pptx` | ANALYST + DESIGNER | Decks de dados (ANALYST) e pitches visuais para clientes (DESIGNER) |
| `word-docx` | DESIGNER + ANALYST | Propostas de cliente, briefs criativos, relatórios em formato que qualquer cliente abre |
| `agent-browser` | JARVIS-DESIGNER | Headless browser otimizado para agentes — navega sites de referência, captura layout de concorrente, inspeciona landing pages ao vivo |
| `evolver` | JARVIS (todos) | Motor de auto-evolução: analisa histórico de sessões para identificar padrões de falha e reescrever protocolos do próprio agente |
| `humanizer` | JARVIS principal | Remove marcadores de escrita IA antes de enviar — output mais natural, sem construções artificiais |
| `deep-research-pro` | ANALYST + principal | Pesquisa multi-fonte com citações estruturadas, upgrade real sobre Tavily + busca simples |

### Passo 1 — Instalar as 8 skills

```bash
openclaw skills install @clawdbot/github
openclaw skills install @clawdbot/excel-xlsx
openclaw skills install @clawdbot/powerpoint-pptx
openclaw skills install @clawdbot/word-docx
openclaw skills install @clawdbot/agent-browser
openclaw skills install @clawdbot/evolver
openclaw skills install @clawdbot/humanizer
openclaw skills install @clawdbot/deep-research-pro
```

Se algum slug estiver incorreto, buscar com:
```bash
openclaw skills search "github"
openclaw skills search "excel"
openclaw skills search "powerpoint"
openclaw skills search "word docx"
openclaw skills search "agent browser"
openclaw skills search "evolver"
openclaw skills search "humanizer"
openclaw skills search "deep research"
```

Confirmar instalação:
```bash
openclaw skills list --json
```

### Passo 2 — Atualizar agent.md de cada subagente com as novas skills

**Em `C:\Users\matth\.openclaw\workspace\agents\jarvis-coder\agent.md`**, adicionar à seção de skills:
```markdown
- Usa `github` para operações de repositório, PRs, issues e CI via `gh` CLI
```

**Em `C:\Users\matth\.openclaw\workspace\agents\jarvis-analyst\agent.md`**, adicionar:
```markdown
- Usa `excel-xlsx` para exportar análises em planilha com fórmulas e formatação correta
- Usa `powerpoint-pptx` para criar decks de apresentação de dados para stakeholders
- Usa `word-docx` para relatórios e documentos de análise formais
- Usa `deep-research-pro` quando precisar de pesquisa multi-fonte com citações estruturadas
```

**Em `C:\Users\matth\.openclaw\workspace\agents\jarvis-designer\agent.md`**, adicionar:
```markdown
- Usa `agent-browser` para navegar sites de referência, capturar layouts de concorrentes e inspecionar landing pages ao vivo
- Usa `powerpoint-pptx` para criar decks de pitch e apresentação para clientes
- Usa `word-docx` para propostas comerciais e briefs criativos
```

### Passo 3 — Atualizar `agent/jarvis.md` com as skills globais

Adicionar as skills globais (Evolver, Humanizer, Deep Research Pro) à tabela de Skills em `agent/jarvis.md`:

```markdown
| `evolver` | auto-evolução: analisar sessões e melhorar protocolos do agente |
| `humanizer` | pós-processar resposta para soar mais natural antes de enviar |
| `deep-research-pro` | pesquisa profunda multi-fonte com citações — quando Tavily não for suficiente |
| `github` | operações git/GitHub via gh CLI (PRs, issues, CI) — delegado ao JARVIS-CODER |
| `excel-xlsx` | criar/editar planilhas Excel — delegado ao JARVIS-ANALYST |
| `powerpoint-pptx` | criar apresentações — delegado a ANALYST ou DESIGNER conforme contexto |
| `word-docx` | criar documentos Word — delegado a ANALYST ou DESIGNER conforme contexto |
| `agent-browser` | navegar e capturar sites ao vivo — delegado ao JARVIS-DESIGNER |
```

### Passo 4 — Configurar Evolver para rodar periodicamente

O Evolver precisa de uma trigger inicial:
```bash
openclaw agent --agent jarvis --session-key agent:jarvis:evolver-init \
  --message "Ative o Evolver e faça a primeira análise de evolução baseada no histórico de sessões disponível." \
  --timeout 180 --json
```

### Passo 5 — Rodar `npm run install:skills` e reiniciar gateway

```bash
npm run install:skills
openclaw gateway restart
```

### Passo 6 — Smoke tests das skills mais críticas

```bash
# Github via JARVIS-CODER
openclaw agent --agent jarvis --session-key agent:jarvis:smoke-github \
  --message "Lista os últimos 5 repositórios que tenho no GitHub." \
  --timeout 90 --json

# Excel via JARVIS-ANALYST
openclaw agent --agent jarvis --session-key agent:jarvis:smoke-excel \
  --message "Cria um Excel simples com 3 colunas: Data, Receita, Despesa. Popula com 5 linhas de exemplo e adiciona uma linha de total." \
  --timeout 120 --json

# Deep Research
openclaw agent --agent jarvis --session-key agent:jarvis:smoke-research \
  --message "Pesquisa: quais são as melhores práticas atuais de otimização de landing page para conversão B2B?" \
  --timeout 180 --json
```

### Passo 7 — Atualizar `docs/HANDOFF.md`

**Motivo:** Estas 8 skills preenchem os gaps reais dos subagentes especializados — JARVIS-CODER sem GitHub CLI é incompleto para dev profissional; JARVIS-ANALYST sem Excel não fecha o ciclo de análise; JARVIS-DESIGNER sem browser não consegue coletar referências ao vivo. O Evolver e Humanizer potencializam o JARVIS principal: um melhora a qualidade ao longo do tempo, o outro melhora o tom imediato das respostas.

---

## TAREFA 27 — [Concluido] Substituir Evolution API pelo plugin oficial @openclaw/whatsapp

**Contexto:** A skill `skills/whatsapp/skill.md` foi criada para integrar Evolution API (envio unidirecional via HTTP). O plugin oficial `@openclaw/whatsapp` usa o mesmo protocolo Baileys/WhatsApp Web, configura por QR scan, não exige Docker nem custo adicional, e habilita WhatsApp como canal bidirecional nativo — igual ao Discord. A Evolution API nunca chegou a ser deployada (variáveis `EVOLUTION_API_KEY` e `EVOLUTION_WHATSAPP_NUMBER` estão vazias no `.env`).

### Passo 1 — Instalar o plugin oficial

```bash
openclaw plugins install @openclaw/whatsapp
openclaw plugins list --json | grep whatsapp
```

### Passo 2 — Adicionar o canal WhatsApp

```bash
openclaw channels add whatsapp
```

Isso exibe um QR code no terminal. **Matheus escaneia com o celular** (WhatsApp → Aparelhos conectados → Conectar aparelho). A sessão fica persistida localmente pelo OpenClaw.

### Passo 3 — Verificar canal ativo

```bash
openclaw channels status --deep
```

Deve mostrar `whatsapp: connected`.

### Passo 4 — Remover skill Evolution API

```bash
rm skills/whatsapp/skill.md
rmdir skills/whatsapp
```

O canal WhatsApp é nativo (como Discord) — não precisa de skill.md.

### Passo 5 — Remover whatsapp do script de instalação

**Arquivo:** `scripts/install-openclaw-skills.ts`

Remover o item do array `copies` que referencia `skills/whatsapp/skill.md`:

```ts
// Remover esta entrada:
{
  source: join(projectRoot, "skills", "whatsapp", "skill.md"),
  destination: join(workspace, "skills", "whatsapp", "skill.md")
}
```

### Passo 6 — Remover variáveis Evolution API do .env.example

**Arquivo:** `.env.example`

Remover as linhas:
```
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=
EVOLUTION_WHATSAPP_NUMBER=
```

Substituir por comentário:
```
# WhatsApp: canal nativo via plugin @openclaw/whatsapp (QR scan — sem variáveis de ambiente necessárias)
```

**Não alterar o `.env` real** — deixar o usuário limpar manualmente as variáveis EVOLUTION_* que estão vazias.

### Passo 7 — Remover whatsapp da tabela de skills do agent.md

**Arquivo:** `agent/jarvis.md`

Remover a linha da tabela de Skills:
```markdown
| `whatsapp` | enviar mensagem/notificação via WhatsApp |
```

O WhatsApp agora é listado no frontmatter como canal (`channels: [discord, whatsapp]`) — não precisa de entrada na tabela de skills. Adicionar nota de comportamento se quiser manter clareza:

```markdown
**Canais ativos:** Discord e WhatsApp — responda no canal de origem da mensagem.
```

### Passo 8 — Rodar npm run install:skills e smoke test

```bash
npm run install:skills

openclaw agent --agent jarvis --session-key agent:jarvis:smoke-whatsapp \
  --message "Teste de canal WhatsApp ativo." --timeout 60 --json
```

### Passo 9 — Atualizar docs/HANDOFF.md

**Motivo:** WhatsApp via plugin oficial é mais simples (sem Docker), mais robusto (canal nativo com session management do OpenClaw) e bidirecional (Matheus pode mandar mensagem para o JARVIS pelo WhatsApp e ele responde). A Evolution API foi descartada antes de ser deployada — sem impacto de migração.

---

# JARVIS VOICE — Roadmap de voz em tempo real

> **Contexto:** App de conversa por voz em tempo real com o JARVIS. Arquitetura: Pipecat (Python) como pipeline de áudio → Tauri v2 como app multiplataforma (Windows .exe + Android .apk) com o mesmo codebase web.
>
> **Decisões tomadas:**
> - TTS: Edge TTS (local, gratuito, sem API key)
> - Ativação: VAD — sempre escutando, detecta automaticamente início/fim de fala
> - Log: canal dedicado `#voz-log` no Discord
> - App: Tauri v2 (Windows + Android, mesmo código)
>
> **Novo projeto:** criar repositório/diretório separado `jarvis-voice/` fora do `Jarvis_2.0/`.

---

## TAREFA 29 — Pipecat: pipeline de voz (backend de áudio)

**Contexto:** Pipecat é um framework Python open source para pipelines de voz em tempo real. Orquestra VAD → STT → LLM → TTS em sequência com baixa latência. É o núcleo do sistema de voz — roda na mesma máquina que o OpenClaw.

### Passo 1 — Criar diretório e instalar dependências

```bash
mkdir jarvis-voice && cd jarvis-voice
python -m venv venv
venv\Scripts\activate   # Windows
pip install pipecat-ai[silero,whisper,edge] fastapi uvicorn websockets
```

Dependências instaladas:
- `pipecat-ai` — framework principal
- `[silero]` — VAD (Silero VAD, local, sem API key)
- `[whisper]` — STT (OpenAI Whisper local)
- `[edge]` — TTS (Edge TTS, local, gratuito)
- `fastapi + uvicorn` — servidor WebSocket para o app Tauri conectar
- `websockets` — transporte WebSocket

### Passo 2 — Criar pipeline principal (`pipeline.py`)

O pipeline deve implementar o seguinte fluxo:

```
Microfone (áudio em chunks)
  → Silero VAD (detecta início/fim de fala)
  → Whisper STT (transcreve para texto)
  → HTTP POST para OpenClaw gateway (envia mensagem ao JARVIS)
  → Edge TTS (converte resposta em áudio)
  → Saída de áudio (speaker)
  → Log no Discord (turno completo: user + JARVIS)
```

**Integração com OpenClaw:** o Pipecat envia a transcrição do usuário para o OpenClaw via HTTP. O endpoint é o gateway do OpenClaw em `http://127.0.0.1:18790`. Usar session key fixa `agent:jarvis:voice` para manter contexto entre turnos de voz.

Consultar a documentação do OpenClaw CLI para o endpoint correto de envio de mensagem ao agente:
```bash
openclaw agent --help
openclaw gateway --help
```

**Log no Discord:** após cada turno completo (user falou + JARVIS respondeu), enviar via webhook do Discord:
```
🎙️ **Você:** "{transcrição do usuário}"
🤖 **JARVIS:** "{resposta do JARVIS}"
```

Variáveis necessárias no `.env` do `jarvis-voice/`:
```
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18790
JARVIS_API_KEY=<mesmo valor do JARVIS 2.0>
DISCORD_VOICE_WEBHOOK_URL=<webhook do canal #voz-log>
WHISPER_MODEL=base    # ou small para melhor precisão
EDGE_TTS_VOICE=pt-BR-AntonioNeural  # voz masculina BR
```

### Passo 3 — Servidor WebSocket para o app Tauri

O Pipecat precisa expor um servidor WebSocket para que o app Tauri (no PC e no Android) se conecte. O app envia chunks de áudio do microfone e recebe chunks de áudio da resposta do JARVIS.

Implementar servidor WebSocket em `server.py`:
- Porta: `8765`
- Aceita conexão do app Tauri
- Recebe stream de áudio PCM do microfone
- Devolve stream de áudio PCM da resposta do JARVIS

### Passo 4 — Teste via CLI (sem app ainda)

```bash
python pipeline.py --test-cli
```

Deve funcionar: falar no microfone → ver transcrição no terminal → ouvir JARVIS responder → ver log no Discord.

### Passo 5 — Script de inicialização

Criar `start.bat` (Windows) para iniciar o servidor Pipecat:
```bat
@echo off
cd /d %~dp0
call venv\Scripts\activate
python server.py
```

**Criar `jarvis-voice/.env.example`** com todas as variáveis necessárias documentadas.

**Motivo:** Pipecat é a única peça que resolve tempo real de verdade — VAD local, Whisper local, Edge TTS local. Zero latência de API. Zero custo. Roda inteiramente offline depois de instalado.

---

## TAREFA 30 — Discord: configurar canal #voz-log

**Contexto:** O canal `#voz-log` no Discord centraliza o histórico de todas as conversas por voz. Cada troca (você + JARVIS) aparece como mensagem, pesquisável e acessível no celular e PC.

### Passo 1 — Criar canal no Discord (ação manual do usuário)

No servidor Discord onde o JARVIS já está conectado:
1. Criar canal de texto `#voz-log`
2. Configurar para que apenas o bot do JARVIS possa escrever (opcional)

### Passo 2 — Criar webhook do Discord para o canal

1. Configurações do canal `#voz-log` → Integrações → Webhooks → Criar webhook
2. Copiar a URL do webhook
3. Adicionar ao `.env` do `jarvis-voice/`:
```
DISCORD_VOICE_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Passo 3 — Verificar integração

Após o Pipecat (TAREFA 29) estar rodando, fazer uma pergunta por voz e confirmar que aparece no `#voz-log` com o formato:
```
🎙️ Você: "qual o clima hoje em São Paulo?"
🤖 JARVIS: "Agora são 24°C com sol, máxima de 28°C."
```

**Motivo:** Discord é o hub central do JARVIS. Ter o log de voz lá mantém tudo em um lugar só — sem app extra para consultar histórico.

---

## TAREFA 31 — Tauri v2: frontend do app de voz

**Contexto:** O app de voz é uma interface mínima em Tauri v2. O frontend é web (HTML/CSS/TypeScript), o backend é Rust. Conecta via WebSocket ao servidor Pipecat local (TAREFA 29). Mesmo código gera Windows .exe e Android .apk.

### Passo 1 — Criar projeto Tauri v2

```bash
cd jarvis-voice
npm create tauri-app@latest jarvis-voice-app -- --template vanilla-ts
cd jarvis-voice-app
npm install
```

Verificar versão do Tauri:
```bash
npm run tauri -- --version  # deve ser 2.x
```

### Passo 2 — Interface do app (`src/`)

A UI deve ser **minimalista e funcional**. Implementar em `index.html` + `main.ts` + `style.css`:

**Layout:**
```
┌─────────────────────────────┐
│          JARVIS              │
│                              │
│     [animação de onda]       │
│   (pulsa quando escutando)   │
│                              │
│  ┌────────────────────────┐  │
│  │ 🎙️ Você: "oi JARVIS"   │  │
│  │ 🤖 JARVIS: "oi! o que  │  │
│  │    posso fazer?"        │  │
│  └────────────────────────┘  │
│                              │
│  [●] Escutando...            │
│  [⚙️] Configurações          │
└─────────────────────────────┘
```

**Estados visuais:**
- 🟢 Verde pulsando = VAD ativo, escutando
- 🟡 Amarelo = processando (Whisper / JARVIS pensando)
- 🔵 Azul = JARVIS falando (TTS reproduzindo)
- 🔴 Vermelho = desconectado do servidor Pipecat

**Tela de configurações (ícone ⚙️):**
- URL do servidor Pipecat (default: `ws://localhost:8765`)
- Útil para Android apontar para o IP do PC na rede local

### Passo 3 — Lógica de conexão WebSocket (`src/main.ts`)

- Conectar ao servidor Pipecat via WebSocket na URL configurada
- Capturar áudio do microfone via `navigator.mediaDevices.getUserMedia`
- Enviar chunks de áudio PCM para o servidor
- Receber chunks de áudio da resposta e reproduzir via `AudioContext`
- Exibir transcrições em tempo real no chat (recebidas via WebSocket como texto)

### Passo 4 — Permissões no Tauri (`tauri.conf.json`)

Configurar permissões necessárias:
```json
{
  "app": {
    "security": {
      "capabilities": ["microphone", "audio"]
    }
  }
}
```

### Passo 5 — Teste no desktop

```bash
npm run tauri dev
```

Deve abrir o app no Windows, conectar ao Pipecat (TAREFA 29 rodando), e funcionar com VAD.

**Motivo:** Interface mínima reduz fricção. O objetivo é que o app some — você só fala e escuta, sem precisar interagir com botões.

---

## TAREFA 32 — Build Windows (.exe / .msi)

**Contexto:** Gerar o instalador Windows do app de voz. O Pipecat (servidor Python) deve iniciar automaticamente junto com o app.

### Passo 1 — Build do app Tauri para Windows

```bash
npm run tauri build
```

Gera em `src-tauri/target/release/bundle/`:
- `.exe` — executável direto
- `.msi` — instalador Windows

### Passo 2 — Auto-iniciar Pipecat com o app

Duas opções (implementar a mais simples):

**Opção A — Tauri sidecar:** empacotar o servidor Pipecat como sidecar do Tauri. O app inicia o processo Python automaticamente ao abrir e encerra ao fechar.

**Opção B — Script de atalho:** criar um `.bat` que inicia o Pipecat e depois o app Tauri. Mais simples, menos elegante.

Implementar **Opção A** se possível; fallback para **Opção B**.

### Passo 3 — Teste de instalação

Instalar o `.msi` em um diretório limpo e verificar:
1. Abre o app
2. Pipecat inicia automaticamente
3. VAD funciona
4. Conversa funciona end-to-end

**Motivo:** No Windows, o app precisa funcionar com um clique. Não deve exigir que o usuário abra o terminal para iniciar o Pipecat manualmente.

---

## TAREFA 33 — Build Android (.apk)

**Contexto:** Gerar o APK Android do mesmo codebase Tauri v2. O app Android se conecta ao servidor Pipecat rodando no PC via rede local Wi-Fi.

### Pré-requisito — Configurar Android no Tauri v2

```bash
npm install @tauri-apps/cli@next
npm run tauri android init
```

Requer Android Studio instalado com NDK. Seguir documentação oficial do Tauri v2 para Android setup.

### Passo 1 — Configurar permissões Android

Em `src-tauri/gen/android/app/src/main/AndroidManifest.xml`, adicionar:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### Passo 2 — Configurar URL do servidor (tela de configurações)

No Android, o Pipecat não está em `localhost` — está no PC. O app precisa da tela de configurações (criada na TAREFA 31) para o usuário informar o IP do PC na rede local (ex: `ws://192.168.1.100:8765`).

Implementar persistência da URL configurada via `localStorage`.

### Passo 3 — Build APK

```bash
npm run tauri android build
```

Gera APK em `src-tauri/gen/android/app/build/outputs/apk/`.

### Passo 4 — Instalar no celular

```bash
# Via adb (celular conectado por USB com depuração USB ativa)
adb install app-release.apk

# Ou: transferir o .apk para o celular e instalar manualmente
# (Ativar "Instalar de fontes desconhecidas" nas configurações Android)
```

### Passo 5 — Teste end-to-end no Android

1. PC e celular na mesma rede Wi-Fi
2. Pipecat rodando no PC
3. Abrir o app no Android
4. Configurar URL: `ws://IP-DO-PC:8765`
5. Falar → JARVIS responde em voz → transcrição aparece no `#voz-log` do Discord

**Motivo:** O Android precisa apontar para o Pipecat no PC porque o processamento de voz (Whisper) e o acesso ao OpenClaw rodam no PC. O app no celular é só a interface de áudio.

---

## Ordem de execução recomendada

1. TAREFA 29 — Pipecat backend (testar via CLI primeiro, sem app)
2. TAREFA 30 — Canal Discord #voz-log (criar webhook manualmente)
3. TAREFA 31 — App Tauri, testar no desktop
4. TAREFA 32 — Build Windows .exe/.msi
5. TAREFA 33 — Build Android .apk

---

## TAREFA 28 — Plugins de potencialização: Memory LanceDB, Tokenjuice, Sequential Thinking, Soul, Diffs

**Contexto:** Cinco plugins do ClaHHub selecionados após análise dos 100 plugins disponíveis, cruzada com o stack atual. Cada um preenche um gap real sem duplicar o que já está instalado. Nenhum exige conta paga ou ClawLink.

### Mapeamento de impacto

| Plugin | Categoria | Impacto direto |
|---|---|---|
| `@openclaw/memory-lancedb` | Memória vetorial | Auto-recall semântico de sessões passadas — JARVIS lembra contexto relevante automaticamente |
| `@openclaw/tokenjuice` | Contexto | Compacta output de ferramentas antes de entrar no contexto — ataque direto ao problema dos 55k tokens |
| `sequential-thinking` | Raciocínio | Protocolo estruturado de decomposição de tarefa — útil para JARVIS-ANALYST e JARVIS-CODER em problemas complexos |
| `openclaw-soul-plugin` | Personalidade | Thinking autônomo e consistência de personalidade entre sessões — humaniza o JARVIS |
| `@openclaw/diffs` | Dev | Viewer de diff nativo no chat — JARVIS-CODER mostra mudanças de código renderizadas |

### Passo 1 — Instalar os 5 plugins

```bash
openclaw plugins install @openclaw/memory-lancedb
openclaw plugins install @openclaw/tokenjuice
openclaw plugins install sequential-thinking
openclaw plugins install openclaw-soul-plugin
openclaw plugins install @openclaw/diffs
```

Se algum slug falhar, buscar com:
```bash
openclaw plugins search "memory lancedb"
openclaw plugins search "tokenjuice"
openclaw plugins search "sequential thinking"
openclaw plugins search "soul"
openclaw plugins search "diffs"
```

Confirmar todos instalados:
```bash
openclaw plugins list --json
```

### Passo 2 — Habilitar e configurar Memory LanceDB

```bash
openclaw plugins enable memory-lancedb
openclaw config set memory.provider "lancedb"
openclaw config set memory.autoCapture true
openclaw config set memory.autoRecall true
```

Verificar:
```bash
openclaw plugins inspect memory-lancedb --json
```

O LanceDB persiste em `~/.openclaw/memory/` por padrão. Auto-recall injeta contexto semântico relevante no início de cada turno. Auto-capture indexa as conversas ao finalizar cada sessão.

### Passo 3 — Habilitar Tokenjuice

```bash
openclaw plugins enable tokenjuice
```

Sem configuração adicional necessária — o plugin intercepta automaticamente outputs de ferramentas maiores que o threshold padrão e os compacta antes de entrar no contexto do agente.

Verificar se está ativo:
```bash
openclaw config get plugins.tokenjuice --json
```

### Passo 4 — Habilitar Sequential Thinking

```bash
openclaw plugins enable sequential-thinking
```

Liberar a ferramenta `sequential_thinking` para o agente jarvis:
```bash
openclaw config set agents.list[0].tools.allow[+] "sequential_thinking"
```

### Passo 5 — Habilitar Soul e configurar personalidade do JARVIS

```bash
openclaw plugins enable soul
```

Configurar o perfil de personalidade do JARVIS para o Soul:
```bash
openclaw config set plugins.soul.agent "jarvis"
openclaw config set plugins.soul.language "pt-BR"
openclaw config set plugins.soul.tone "casual, direto, descontraído"
```

### Passo 6 — Habilitar Diffs

```bash
openclaw plugins enable diffs
```

Sem configuração adicional — o plugin registra renderizador de diff nativo para o agente usar quando exibir mudanças de código.

### Passo 7 — Reiniciar gateway e validar

```bash
openclaw config validate
openclaw gateway restart
openclaw health
```

### Passo 8 — Smoke tests

```bash
# Testar Memory LanceDB — deve recuperar contexto de sessões anteriores
openclaw agent --agent jarvis --session-key agent:jarvis:smoke-memory \
  --message "O que você sabe sobre mim e meu trabalho?" \
  --timeout 120 --json

# Testar Sequential Thinking — deve usar sequential_thinking em problema complexo
openclaw agent --agent jarvis --session-key agent:jarvis:smoke-sequential \
  --message "Quero estruturar um pipeline de dados para análise de retenção de usuários. Me ajuda a planejar as etapas?" \
  --timeout 180 --json

# Testar Tokenjuice — verificar se compactação está ativa nos logs
openclaw logs --tail 50 | grep -i tokenjuice
```

### Passo 9 — Atualizar docs/HANDOFF.md

**Motivo:** Memory LanceDB é o maior salto de qualidade — JARVIS passa de memória manual (UserFacts) para recall semântico automático. Tokenjuice resolve na raiz o problema de 55k tokens que forçou a troca de modelo anteriormente. Soul garante que a personalidade casual e direta do JARVIS não se perca entre sessões. Sequential Thinking e Diffs são multiplicadores de qualidade para os subagentes especializados.

---

## TAREFA 34 — [Concluido] Corrigir skills com EPERM e plugins com slug inválido

**Contexto:** Revisão pós-Codex identificou dois problemas que impediram instalações completas:
1. Skills `proactive-agent`, `ui-ux-pro-max`, `evolver` falharam com `EPERM` (erro de permissão de arquivo no Windows)
2. Plugins `sequential-thinking` e `openclaw-soul-plugin` retornaram "pacote inexistente" no CLI

### Passo 1 — Corrigir permissões do workspace do OpenClaw (EPERM)

Verificar e corrigir permissões da pasta `~/.openclaw`:
```powershell
icacls "$env:USERPROFILE\.openclaw" /grant "$env:USERNAME:(OI)(CI)F" /T
```

Verificar também a pasta de skills:
```powershell
icacls "$env:USERPROFILE\.openclaw\workspace\skills" /grant "$env:USERNAME:(OI)(CI)F" /T
```

### Passo 2 — Retentar instalação das 3 skills que falharam

```bash
openclaw skills install @halthelobster/proactive-agent
openclaw skills install @nicnocquee/superdesign
openclaw skills install @clawdbot/evolver
```

Se ainda falhar com EPERM, tentar com PowerShell elevado (Run as Administrator):
```powershell
Start-Process "openclaw" -ArgumentList "skills install @halthelobster/proactive-agent" -Verb RunAs -Wait
Start-Process "openclaw" -ArgumentList "skills install @nicnocquee/superdesign" -Verb RunAs -Wait
Start-Process "openclaw" -ArgumentList "skills install @clawdbot/evolver" -Verb RunAs -Wait
```

Confirmar instaladas:
```bash
openclaw skills list --json | grep -E "proactive|superdesign|evolver"
```

### Passo 3 — Encontrar slugs corretos dos plugins com erro

Para `sequential-thinking`:
```bash
openclaw plugins search "sequential"
openclaw plugins search "sequential thinking"
```

Se não encontrar via search, tentar instalação por nome npm:
```bash
openclaw plugins install sequential-thinking
openclaw plugins install npm:sequential-thinking
```

Para `openclaw-soul-plugin`:
```bash
openclaw plugins search "soul"
```

Tentar variações:
```bash
openclaw plugins install openclaw-soul-plugin
openclaw plugins install soul
openclaw plugins install npm:openclaw-soul-plugin
```

Se ambos ainda falharem, registrar no HANDOFF.md os comandos exatos tentados e os erros retornados para investigação posterior.

### Passo 4 — Atualizar `agent/jarvis.md` com skills que foram instaladas com sucesso

Após confirmar quais skills foram instaladas (TAREFA 26 + retentativos acima), garantir que a tabela de Skills em `agent/jarvis.md` liste apenas as que estão de fato disponíveis. Remover entradas de skills que não foram instaladas.

### Passo 5 — Rodar `npm run install:skills` e reiniciar gateway

```bash
cd "c:\Users\matth\OneDrive\Documentos\VS CODE\Jarvis_2.0"
npm run install:skills
openclaw gateway restart
openclaw health
```

### Passo 6 — Atualizar `docs/HANDOFF.md`

Registrar quais skills e plugins foram instalados com sucesso, quais ainda falharam e os erros exatos.

**Motivo:** Skills não instaladas são referenciadas no `agent/jarvis.md` como disponíveis mas o JARVIS não consegue usá-las. Isso causa confusão e falhas silenciosas em produção.

---

## TAREFA 35 — [Concluido] Implementar VAD contínuo no jarvis-voice (substituir push-to-talk)

**Contexto:** O app foi entregue com push-to-talk (botão "Gravar"), mas o planejamento era VAD contínuo — o app detecta automaticamente quando você começou e parou de falar, sem precisar pressionar botão. O `faster-whisper` (já instalado no venv) tem VAD Silero embutido via `vad_filter=True`. A mudança é principalmente no `server.py` (backend) e `main.ts` + `index.html` (frontend).

**Diretório de trabalho:** `C:\Users\matth\OneDrive\Documentos\VS CODE\jarvis-voice\`

### Passo 1 — Atualizar `pipeline.py`: trocar `openai-whisper` por `faster-whisper` com VAD

Substituir a função `transcribe_audio_file` por uma versão que usa `faster-whisper` com VAD ativo:

```python
def transcribe_audio_file(path: Path, config: VoiceConfig | None = None) -> str:
    cfg = config or VoiceConfig()
    from faster_whisper import WhisperModel
    model = WhisperModel(cfg.whisper_model, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(
        str(path),
        language="pt",
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 500},
    )
    return " ".join(segment.text for segment in segments).strip()
```

Remover o import de `whisper` (openai-whisper) — substituído por `faster_whisper`.

Adicionar ao `VoiceConfig`:
```python
vad_silence_ms: int = int(os.getenv("VAD_SILENCE_MS", "700"))
```

### Passo 2 — Atualizar `server.py`: adicionar modo VAD streaming

Adicionar suporte a novo evento `audio_chunk` (cliente envia chunks contínuos sem esperar botão):

```python
if event_type == "audio_chunk":
    # Adiciona chunk ao buffer de VAD
    audio_buffer.extend(payload.get("data", b""))
    continue

if event_type == "vad_end":
    # Frontend detectou silêncio e sinalizou fim de fala
    await handle_audio_turn(websocket, bytes(audio_buffer), config)
    audio_buffer.clear()
    continue
```

Manter `audio_end` existente para compatibilidade com push-to-talk.

### Passo 3 — Atualizar `main.ts`: implementar streaming contínuo com VAD no cliente

Substituir a lógica de push-to-talk por VAD no frontend. A detecção de silêncio pode ser feita com `AudioWorkletProcessor` ou com a API `AudioContext` + análise de volume:

```typescript
// Detectar silêncio: se RMS do áudio < threshold por N ms → emitir vad_end
const SILENCE_THRESHOLD = 0.01;
const SILENCE_DURATION_MS = 700;
```

Implementar:
1. Ao conectar, iniciar captura contínua de microfone via `getUserMedia`
2. Usar `AudioContext.createAnalyser()` para detectar RMS (volume) em tempo real
3. Quando RMS > threshold → estado `speech` (onda animada)
4. Quando RMS < threshold por 700ms → emitir `{ type: "vad_end" }` via WebSocket e limpar buffer
5. Enquanto em estado `speech`, enviar chunks de áudio via `{ type: "audio_chunk", data: base64 }`

### Passo 4 — Atualizar `index.html` e `style.css`

Remover o botão "Gravar" / "Parar" do HTML — o VAD é automático.

Adicionar indicador de estado de fala detectada:
```html
<p id="vadIndicator" class="vad-indicator">● Aguardando fala...</p>
```

Adicionar estado `speech` ao CSS:
```css
.wave.is-speech span {
  background: #36d399;
  animation-duration: 0.6s; /* mais rápido quando fala detectada */
}
```

Atualizar `setState` no `main.ts` para incluir o estado `"speech"`.

### Passo 5 — Atualizar `.env.example` do jarvis-voice

Adicionar:
```
# VAD: duração mínima de silêncio para encerrar o turno (ms)
VAD_SILENCE_MS=700
```

### Passo 6 — Testar pipeline completo

```bash
cd "C:\Users\matth\OneDrive\Documentos\VS CODE\jarvis-voice"
venv\Scripts\python server.py
```

Em outro terminal, abrir o app Tauri ou testar via browser em `http://127.0.0.1:1420` (com `npm run dev` no `jarvis-voice-app`):
- Falar sem apertar botão → JARVIS deve responder automaticamente após silêncio de ~700ms

### Passo 7 — Atualizar `docs/HANDOFF.md`

**Motivo:** Push-to-talk é uma concessão de v1 aceitável, mas o objetivo é conversação natural sem fricção de botão. O `faster-whisper` com `vad_filter=True` é a solução mais limpa: já está instalado, usa Silero VAD internamente e é mais rápido que o `openai-whisper` original.

---

## TAREFA 36 — [Concluido] Instalar Rust e gerar build Tauri para Windows

**Contexto:** O app Tauri v2 está com código completo mas não pode ser buildado porque Rust/Cargo não está instalado. Esta tarefa instala o toolchain e gera o `.exe` instalável para Windows.

**Diretório de trabalho:** `C:\Users\matth\OneDrive\Documentos\VS CODE\jarvis-voice\jarvis-voice-app\`

### Passo 1 — Verificar se Rust já está instalado

```powershell
cargo --version
rustc --version
```

Se não encontrado, instalar via winget:
```powershell
winget install Rustlang.Rustup
```

Após instalar, fechar e reabrir o terminal para o PATH ser atualizado, depois:
```powershell
rustup default stable
rustup update stable
rustup show
```

### Passo 2 — Verificar Visual Studio Build Tools

O Tauri no Windows requer MSVC. Verificar se está disponível:
```powershell
where cl.exe
```

Se não encontrado, instalar Build Tools:
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

Após instalar, abrir o **Visual Studio Installer**, clicar em "Modificar" no Build Tools e garantir que o workload **"Desenvolvimento para desktop com C++"** está marcado (inclui MSVC + Windows SDK).

Se o `winget install` não funcionar ou precisar de configuração manual, reportar no HANDOFF.md e aguardar ação do usuário.

### Passo 3 — Instalar target WebKit do Tauri para Windows

```powershell
rustup target add x86_64-pc-windows-msvc
```

### Passo 4 — Testar em modo dev

Com o `server.py` do Pipecat rodando em background:
```powershell
npm run tauri dev
```

Deve abrir uma janela nativa do Windows com o app JARVIS Voice. Testar conexão com o servidor e conversa por voz.

### Passo 5 — Build para Windows

```powershell
npm run tauri build
```

Gera em `src-tauri\target\release\bundle\`:
- `msi\JARVIS Voice_0.1.0_x64_en-US.msi` — instalador Windows
- `nsis\JARVIS Voice_0.1.0_x64-setup.exe` — instalador alternativo

### Passo 6 — Testar o instalador

Instalar o `.msi` gerado e verificar:
1. App aparece no menu Iniciar como "JARVIS Voice"
2. Abre corretamente
3. Conecta ao servidor Pipecat (`ws://127.0.0.1:8765/ws`)
4. VAD funciona (após TAREFA 35)

### Passo 7 — Atualizar `docs/HANDOFF.md`

Registrar: versão do Rust instalada, path do `.msi`/`.exe` gerado, resultado do smoke test.

**Motivo:** Sem o build nativo, o app só roda via `npm run tauri dev` (modo desenvolvimento). O `.msi` é o entregável final para Windows — clique duplo e instala, igual qualquer outro programa.

---

## TAREFA 37 — [Concluido] Build Android (.apk) com Tauri v2

**Contexto:** O build Windows foi concluído (TAREFA 36). O Android não foi feito porque requer Android Studio + NDK instalados — ferramentas de ~4GB que precisam de configuração manual antes. Esta tarefa faz o setup do ambiente Android e gera o APK do JARVIS Voice.

**Pré-requisito manual do usuário (antes de passar ao Codex):**
1. Baixar e instalar **Android Studio** em [developer.android.com/studio](https://developer.android.com/studio)
2. Abrir o Android Studio → SDK Manager → instalar:
   - **Android SDK Platform 34** (ou superior)
   - **NDK (Side by side)** versão 27 ou superior
   - **Android SDK Build-Tools**
3. Anotar o caminho do SDK (geralmente `C:\Users\matth\AppData\Local\Android\Sdk`)
4. Confirmar que `ANDROID_HOME` e `NDK_HOME` estão configurados nas variáveis de ambiente do Windows

Após o usuário confirmar que Android Studio e NDK estão instalados, o Codex executa:

**Diretório de trabalho:** `C:\Users\matth\OneDrive\Documentos\VS CODE\jarvis-voice\jarvis-voice-app\`

### Passo 1 — Verificar pré-requisitos Android

```powershell
echo $env:ANDROID_HOME
echo $env:NDK_HOME
& "$env:ANDROID_HOME\platform-tools\adb.exe" version
java -version
```

Se `ANDROID_HOME` estiver vazio, configurar:
```powershell
$sdk = "C:\Users\matth\AppData\Local\Android\Sdk"
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdk, "User")
[System.Environment]::SetEnvironmentVariable("NDK_HOME", "$sdk\ndk\<versão>", "User")
```
Substituir `<versão>` pela versão do NDK instalado (verificar com `dir "$sdk\ndk"`).

### Passo 2 — Adicionar target Rust para Android

```powershell
rustup target add aarch64-linux-android
rustup target add armv7-linux-androideabi
rustup target add i686-linux-android
rustup target add x86_64-linux-android
```

### Passo 3 — Inicializar projeto Android no Tauri

```powershell
$env:CARGO_TARGET_DIR = "$env:LOCALAPPDATA\Temp\jarvis-voice-tauri-target"
npm run tauri android init
```

Isso gera `src-tauri/gen/android/` com o projeto Android Studio completo.

### Passo 4 — Verificar permissões no AndroidManifest.xml

Confirmar que `src-tauri/gen/android/app/src/main/AndroidManifest.xml` contém:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

Se não estiver, adicionar dentro da tag `<manifest>`.

### Passo 5 — Build do APK

```powershell
$env:CARGO_TARGET_DIR = "$env:LOCALAPPDATA\Temp\jarvis-voice-tauri-target"
npm run tauri android build
```

O APK é gerado em:
```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```

### Passo 6 — Assinar o APK (necessário para instalar fora da Play Store)

Criar keystore para assinatura:
```powershell
keytool -genkey -v -keystore jarvis-voice.keystore -alias jarvis -keyalg RSA -keysize 2048 -validity 10000
```

Assinar o APK:
```powershell
$jar = "$env:ANDROID_HOME\build-tools\<versão>\apksigner.bat"
& $jar sign --ks jarvis-voice.keystore --out "dist-installers\JARVIS-Voice-android.apk" `
  "src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk"
```

Copiar o APK assinado para `dist-installers\JARVIS-Voice-android.apk`.

### Passo 7 — Instalar no celular

**Opção A — via USB (ADB):**
```powershell
& "$env:ANDROID_HOME\platform-tools\adb.exe" install "dist-installers\JARVIS-Voice-android.apk"
```
Requer: celular conectado por USB com **Depuração USB** ativada (Configurações → Sobre o telefone → tocar 7x em "Número da versão" → Opções do desenvolvedor → Depuração USB).

**Opção B — transferência manual:**
Copiar `JARVIS-Voice-android.apk` para o celular via cabo ou Google Drive → abrir o arquivo no Android → instalar (precisa ter "Instalar apps de fontes desconhecidas" ativado em Configurações → Segurança).

### Passo 8 — Configurar URL do servidor no app

Ao abrir o app no Android pela primeira vez:
1. Tocar no ícone ⚙️
2. Trocar a URL de `ws://127.0.0.1:8765/ws` para `ws://IP-DO-PC:8765/ws`
3. Para descobrir o IP do PC: `ipconfig` no Windows → endereço IPv4 da rede Wi-Fi (ex: `192.168.1.100`)
4. PC e celular devem estar na mesma rede Wi-Fi

### Passo 9 — Smoke test no Android

Com `venv\Scripts\python server.py` rodando no PC:
1. Abrir o app no Android
2. Configurar URL do servidor
3. Tocar em "Conectar"
4. Falar → JARVIS deve responder em áudio após ~700ms de silêncio

### Passo 10 — Atualizar `docs/HANDOFF.md`

Registrar: versão do NDK usada, path do APK assinado em `dist-installers/`, resultado do smoke test no Android.

**Motivo:** O APK é o entregável Android — instalável diretamente sem Play Store, usando o mesmo código do app Windows. O celular se conecta ao backend Python rodando no PC via Wi-Fi local.

---

## TAREFA 38 — [Concluido] Wake word "JARVIS" + botão Iniciar/Parar Serviço + system tray

**Contexto:** O usuário quer que o app rode em background e só ative quando ouvir o nome "JARVIS" — igual a "Ok Google" ou "Hey Siri". Quando quiser silenciar, aperta "Parar Serviço". Será usado **OpenWakeWord** — biblioteca Python open source, gratuita, sem cadastro, sem API key. Tem o modelo `hey_jarvis` pré-treinado que detecta a voz "JARVIS".

**Mudança de arquitetura:** O microfone passa a ser capturado pelo backend Python diretamente (via `sounddevice`), não mais pelo frontend Tauri. O frontend vira interface visual pura — recebe eventos do backend e exibe animações/transcrições.

**Diretório de trabalho:** `C:\Users\matth\OneDrive\Documentos\VS CODE\jarvis-voice\`

### Passo 1 — Instalar dependências de áudio e wake word

```bash
venv\Scripts\pip install openwakeword sounddevice numpy
```

Na primeira execução o OpenWakeWord baixa automaticamente os modelos ONNX do hub. Para pré-baixar o modelo `hey_jarvis` sem precisar de internet no momento de uso:
```bash
venv\Scripts\python -c "from openwakeword.model import Model; Model(wakeword_models=['hey_jarvis'], inference_framework='onnx'); print('modelo ok')"
```

Verificar instalação:
```bash
venv\Scripts\python -c "import openwakeword, sounddevice; print('ok')"
```

Adicionar ao `requirements.txt`:
```
openwakeword>=0.6.0
sounddevice>=0.5.0
numpy>=1.26.0
```

### Passo 2 — Adicionar wake word ao `pipeline.py`

Adicionar ao `VoiceConfig`:
```python
wake_word_model: str = os.getenv("WAKE_WORD_MODEL", "hey_jarvis")
wake_word_threshold: float = float(os.getenv("WAKE_WORD_THRESHOLD", "0.5"))
```

Criar função `listen_for_wake_word`:
```python
async def listen_for_wake_word(config: VoiceConfig, stop_event: asyncio.Event) -> bool:
    import sounddevice as sd
    import numpy as np
    from openwakeword.model import Model

    # 16kHz, mono, 1280 samples por frame (~80ms)
    SAMPLE_RATE = 16000
    FRAME_SAMPLES = 1280

    oww = Model(wakeword_models=[config.wake_word_model], inference_framework="onnx")
    q: asyncio.Queue[np.ndarray] = asyncio.Queue()
    loop = asyncio.get_event_loop()

    def callback(indata: np.ndarray, frames: int, time: object, status: object) -> None:
        loop.call_soon_threadsafe(q.put_nowait, indata[:, 0].copy())

    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="int16",
        blocksize=FRAME_SAMPLES,
        callback=callback,
    ):
        while not stop_event.is_set():
            try:
                frame = await asyncio.wait_for(q.get(), timeout=0.5)
            except asyncio.TimeoutError:
                continue
            predictions = oww.predict(frame)
            score = predictions.get(config.wake_word_model, 0.0)
            if score >= config.wake_word_threshold:
                return True
    return False
```

Criar função `capture_command_audio` para capturar o áudio do comando após o wake word (com VAD por RMS):
```python
async def capture_command_audio(config: VoiceConfig) -> bytes:
    import sounddevice as sd
    import numpy as np
    import io
    import wave

    sample_rate = 16000
    silence_threshold = 0.01
    silence_ms = config.vad_silence_ms
    frames: list[np.ndarray] = []
    silence_start: float = 0.0
    q: asyncio.Queue[np.ndarray] = asyncio.Queue()
    loop = asyncio.get_event_loop()

    def callback(indata, frame_count, time, status):
        loop.call_soon_threadsafe(q.put_nowait, indata.copy())

    with sd.InputStream(samplerate=sample_rate, channels=1, dtype="int16",
                        blocksize=1600, callback=callback):
        started = False
        while True:
            chunk = await asyncio.wait_for(q.get(), timeout=10.0)
            rms = float(np.sqrt(np.mean(chunk.astype(np.float32) ** 2)) / 32768.0)
            if rms > silence_threshold:
                frames.append(chunk)
                started = True
                silence_start = 0.0
            elif started:
                frames.append(chunk)
                if silence_start == 0.0:
                    silence_start = asyncio.get_event_loop().time()
                elif (asyncio.get_event_loop().time() - silence_start) * 1000 >= silence_ms:
                    break

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(b"".join(f.tobytes() for f in frames))
    return buf.getvalue()
```

### Passo 3 — Atualizar `server.py`: loop de serviço com wake word

Substituir o modelo de "WebSocket envia áudio → backend processa" por um loop autônomo no backend:

Adicionar nova rota WebSocket `/service` para o modo de serviço:
```python
@app.websocket("/service")
async def service_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    config = VoiceConfig()
    stop_event = asyncio.Event()

    await websocket.send_json({"type": "state", "state": "standby"})

    async def run_service():
        while not stop_event.is_set():
            # Fase 1: aguarda wake word
            await websocket.send_json({"type": "state", "state": "standby"})
            detected = await listen_for_wake_word(config, stop_event)
            if not detected or stop_event.is_set():
                break

            # Fase 2: wake word detectado
            await websocket.send_json({"type": "state", "state": "wake"})

            # Fase 3: captura comando
            await websocket.send_json({"type": "state", "state": "speech"})
            audio_bytes = await capture_command_audio(config)

            # Fase 4: transcreve e processa
            await websocket.send_json({"type": "state", "state": "transcribing"})
            path = Path(tempfile.mktemp(suffix=".wav"))
            path.write_bytes(audio_bytes)
            try:
                user_text = await asyncio.to_thread(transcribe_audio_file, path, config)
            finally:
                path.unlink(missing_ok=True)

            if user_text:
                await handle_text_turn(websocket, user_text, config)

    service_task = asyncio.create_task(run_service())

    try:
        while True:
            msg = await websocket.receive_json()
            if msg.get("type") == "stop":
                stop_event.set()
                break
    except WebSocketDisconnect:
        stop_event.set()

    service_task.cancel()
```

Manter o endpoint `/ws` existente para compatibilidade com o modo manual (texto).

### Passo 4 — Atualizar `main.ts`: botão Iniciar/Parar + estado standby

Adicionar estado `"standby"` e `"wake"` ao tipo `VoiceState`:
```typescript
type VoiceState = "standby" | "wake" | "connected" | "speech" | "processing" | "transcribing" | "speaking" | "disconnected";
```

Adicionar labels/hints para os novos estados:
```typescript
standby: "Aguardando 'JARVIS'...",
wake: "Ativado!",
```

Substituir lógica do botão "Conectar":
- Conectar ao `/service` em vez de `/ws`
- Botão mostra "Iniciar Serviço" → ao conectar muda para "Parar Serviço"
- Ao clicar em "Parar Serviço": envia `{ type: "stop" }` e fecha conexão

### Passo 5 — Atualizar `index.html`: renomear botão e estado standby

Substituir:
```html
<button id="connectButton" type="button">Iniciar Serviço</button>
```

Adicionar CSS para o novo estado `standby` (onda quase parada, tom azul escuro) e `wake` (pulso rápido dourado):
```css
.wave.is-standby span {
  background: #4a6fa5;
  animation-duration: 2.5s;
  height: 28px;
}

.wave.is-wake span {
  background: #f4c430;
  animation-duration: 0.3s;
}
```

### Passo 6 — System tray no Windows (app roda minimizado)

Em `src-tauri/src/main.rs`, adicionar suporte a system tray:

```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let quit = MenuItem::with_id(app, "quit", "Sair do JARVIS Voice", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Abrir", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Configurar `tauri.conf.json` para minimizar para tray ao fechar (em vez de sair):
```json
"app": {
  "windows": [
    {
      "title": "JARVIS Voice",
      "width": 420,
      "height": 760,
      "closable": true,
      "onPageLoad": "focus"
    }
  ]
}
```

### Passo 7 — Atualizar `.env.example`

```
# Wake word (OpenWakeWord — sem cadastro, sem API key)
WAKE_WORD_MODEL=hey_jarvis
WAKE_WORD_THRESHOLD=0.5
```

### Passo 8 — Rebuild e teste

```bash
# Pré-baixar modelo (só na primeira vez, requer internet)
venv\Scripts\python -c "from openwakeword.model import Model; Model(wakeword_models=['hey_jarvis'], inference_framework='onnx'); print('modelo baixado')"

# Testar backend com wake word
venv\Scripts\python -c "
import asyncio
from pipeline import VoiceConfig, listen_for_wake_word
async def test():
    cfg = VoiceConfig()
    stop = asyncio.Event()
    print('Fale JARVIS...')
    result = await listen_for_wake_word(cfg, stop)
    print('Wake word detectado!' if result else 'Não detectado')
asyncio.run(test())
"

# Rebuild app Tauri após mudanças no main.rs
cd jarvis-voice-app
$env:CARGO_TARGET_DIR = "$env:LOCALAPPDATA\Temp\jarvis-voice-tauri-target"
npm run tauri build
```

Copiar novos instaladores para `dist-installers\`.

### Passo 9 — Atualizar `docs/HANDOFF.md`

**Motivo:** Com o wake word, o JARVIS funciona como um assistente de voz real — você fala o nome e ele acorda, igual ao Google Assistant. O system tray no Windows permite que o serviço rode invisível em background sem ocupar a taskbar. A mudança de arquitetura (mic no backend) é necessária porque o browser não permite acesso contínuo ao microfone quando a janela está minimizada.

---

## TAREFA 39 — [Concluido] Protocolo de Autonomia Intelectual no jarvis.md

**Contexto:** O JARVIS atual ignora perguntas fora do seu conhecimento imediato. A causa é a ausência de um protocolo explícito de tentativa — ele não sabe que deve buscar, raciocinar, delegar ou explicar a falha antes de "desistir". Esta tarefa corrige isso com mudanças exclusivamente no `agent/jarvis.md`, sem tocar em código.

**Diretório de trabalho:** `C:\Users\matth\OneDrive\Documentos\VS CODE\Jarvis_2.0\`

### Passo 1 — Adicionar seção "Protocolo de Resolução de Problemas" em `agent/jarvis.md`

Inserir logo após a seção `## Comportamento`, antes de `## Skills`:

```markdown
## Protocolo de Resolução de Problemas

**Regra absoluta: nunca ignore uma mensagem.** Se não souber responder de imediato, siga esta sequência obrigatória:

1. **Busca primeiro** — para qualquer pergunta factual, técnica, atual ou que envolva dados externos: chame `tavily_search` ou `web_search` antes de formular resposta. Nunca diga "não sei" sem buscar antes.

2. **Raciocine em voz alta** — divida o problema em partes menores. Explique o que você entende, o que está incerto e o que vai tentar. Isso é melhor do que silêncio.

3. **Delegue para o subagente certo** — código → `jarvis-coder`; análise de dados → `jarvis-analyst`; design → `jarvis-designer`; pesquisa complexa multi-fonte → `jarvis-search`. Não tente resolver tudo sozinho.

4. **Proponha uma ação** — se a solução exigir executar algo no computador do Matheus, proponha explicitamente:
   > 📋 **Proposta de execução:** `comando aqui`
   > Confirme com ✅ para eu executar.

5. **Só então admita limitação** — se as 4 etapas anteriores não resolverem, explique o que tentou e onde travou. Nunca apenas ignore ou responda com "não posso ajudar com isso".

**Frases proibidas:** "não sei", "não tenho acesso", "não consigo", "não posso ajudar", "fora do meu escopo". Sempre ofereça o próximo passo concreto.
```

### Passo 2 — Atualizar a tabela de delegação para incluir JARVIS-SEARCH

Substituir a tabela de delegação atual por:

```markdown
| Tarefa | Subagente | Quando usar |
|---|---|---|
| Código, debugging, full-stack, API | `jarvis-coder` | "cria uma função", "corrige esse bug", "como implementar X" |
| SQL, análise de dados, KPIs, relatório | `jarvis-analyst` | "analisa esse dataset", "escreve uma query", "me dá insights sobre X" |
| Design, branding, landing page, logo, UI review | `jarvis-designer` | "cria uma paleta", "preciso de uma landing page", "revisa esse layout" |
| Pesquisa profunda, múltiplas fontes, síntese | `jarvis-search` | "pesquisa sobre X", "quero um relatório de Y", "me traz notícias sobre Z", qualquer busca que exija mais de 2 queries |
```

### Passo 3 — Atualizar seção de ferramentas em canais para reforçar busca proativa

Na seção `## Ferramentas em canais de mensagem`, adicionar após a regra de tavily_search:

```markdown
- Para qualquer pergunta onde você não tem certeza da resposta atual: busque antes de responder. É melhor buscar e não encontrar do que responder desatualizado ou errado.
- Se uma busca retornar vazio ou resultado fraco: tente uma segunda query reformulada antes de concluir que não há informação.
```

### Passo 4 — Reinstalar agente no OpenClaw

```bash
npm run install:skills
```

Smoke test no Discord: mandar uma pergunta técnica fora do escopo padrão e confirmar que o JARVIS tenta buscar em vez de ignorar.

### Passo 5 — Atualizar `docs/HANDOFF.md`

Registrar o protocolo adicionado e o resultado do smoke test.

---

## TAREFA 40 — [Concluido] Execução com Aprovação (Shell Tool)

**Contexto:** O Matheus quer que o JARVIS possa propor e executar comandos no terminal (instalar pacotes, rodar scripts, etc.) com aprovação explícita antes de cada execução. Nunca auto-executar — sempre pedir confirmação e aguardar "sim" ou ✅.

**Diretório de trabalho:** `C:\Users\matth\OneDrive\Documentos\VS CODE\Jarvis_2.0\`

### Passo 1 — Pesquisar ferramenta de shell no OpenClaw

Verificar se o OpenClaw já expõe alguma ferramenta de execução de shell no perfil padrão:

```bash
openclaw tools list
openclaw tools list --profile messaging
```

Verificar também se existe skill de execução no ClawHub:
```bash
openclaw search shell
openclaw search exec
openclaw search terminal
```

Registrar o que foi encontrado no HANDOFF antes de prosseguir.

### Passo 2 — Criar skill `jarvis-shell` se não houver ferramenta nativa

Se o OpenClaw não tiver ferramenta de shell disponível, criar skill local em `skills/jarvis-shell/skill.md`:

```markdown
# jarvis-shell

Permite ao JARVIS propor e executar comandos no terminal do Matheus após aprovação explícita.

## Fluxo obrigatório

1. JARVIS identifica que uma ação requer execução de comando
2. JARVIS formata a proposta no padrão abaixo e aguarda resposta
3. Matheus responde "sim", "✅" ou "ok" → JARVIS executa
4. Matheus responde "não", "❌" ou ignora → JARVIS cancela e propõe alternativa

## Formato da proposta

```
📋 **Proposta de execução**
Comando: `<comando>`
Motivo: <por que esse comando resolve o problema>
Confirme com ✅ para executar ou ❌ para cancelar.
```

## Comandos bloqueados (nunca propor, mesmo com aprovação)

- `rm -rf`, `del /f /s /q`, `rd /s /q` em diretórios raiz ou de sistema
- `format`, `diskpart`
- Comandos que alteram permissões de sistema (`icacls` em C:\Windows, `chmod 777 /`)
- `shutdown`, `restart`, `taskkill` em processos críticos do sistema
- Qualquer comando com pipe para deleção em massa sem escopo definido

## Registro de execuções

Após executar, reportar:
- Comando executado
- Output (primeiras 50 linhas ou resumo)
- Código de saída (0 = sucesso)
- Erros, se houver
```

### Passo 3 — Adicionar instrução de execução ao `agent/jarvis.md`

Na seção `## Protocolo de Resolução de Problemas` (criada na TAREFA 39), o item 4 já define o padrão de proposta. Verificar se está presente e complementar com:

```markdown
**Execução com aprovação — regras:**
- Nunca execute sem uma confirmação explícita do Matheus na mesma conversa
- Uma confirmação vale apenas para o comando proposto naquele turno — não reutilize aprovações anteriores
- Após executar, sempre reporte o resultado completo
- Se o comando falhar, analise o erro e proponha correção antes de tentar de novo
```

### Passo 4 — Reinstalar e testar

```bash
npm run install:skills
```

Testar no Discord: pedir ao JARVIS para instalar um pacote Python de teste (ex: `pip install httpie`). Confirmar que ele propõe antes de executar, aguarda aprovação e reporta o resultado.

### Passo 5 — Atualizar `docs/HANDOFF.md`

---

## TAREFA 41 — [Concluido] JARVIS-SEARCH: Subagente de Pesquisa Avançada

**Contexto:** O Matheus quer um subagente especializado em buscas complexas multi-etapa. Quando o JARVIS receber uma pesquisa profunda, delega para o JARVIS-SEARCH, que executa múltiplas queries em paralelo, sintetiza as fontes e entrega um relatório estruturado diretamente no chat — sem precisar da intervenção do JARVIS principal para compilar.

**Diretório de trabalho:** `C:\Users\matth\OneDrive\Documentos\VS CODE\Jarvis_2.0\`

### Passo 1 — Criar `agent/jarvis-search.md`

```markdown
---
name: JARVIS-SEARCH
version: 1.0.0
description: Subagente especializado em pesquisa avançada multi-fonte — recebe queries complexas, decompõe em sub-buscas, sintetiza e entrega relatório estruturado
language: pt-BR
model-primary: google/gemini-2.5-flash
model-fallback:
  - openai/gpt-5.5
---

# JARVIS-SEARCH

Você é JARVIS-SEARCH, o motor de pesquisa do sistema JARVIS. Especialista em buscas profundas, síntese de múltiplas fontes e relatórios estruturados.

**Regra fundamental:** Nunca responda sem buscar. Toda resposta deve ter evidência de pesquisa real. Mínimo de 3 queries por pesquisa solicitada.

**Idioma:** Português brasileiro sempre.

---

## Protocolo de Pesquisa

Para cada query recebida, execute obrigatoriamente:

1. **Decomposição** — quebre a query principal em 3 a 5 sub-queries distintas que cobrem ângulos diferentes do tema
2. **Execução** — rode cada sub-query com `tavily_search` ou `web_search`
3. **Gap analysis** — identifique lacunas nas respostas e faça até 2 buscas complementares
4. **Síntese** — consolide os resultados, elimine redundâncias, priorize fontes confiáveis
5. **Relatório** — entregue no formato abaixo

---

## Formato do Relatório

```
🔍 **JARVIS-SEARCH — Relatório**

**Query:** <query original do Matheus>

**Síntese:**
- <ponto principal 1>
- <ponto principal 2>
- <ponto principal 3>
...

**Detalhes relevantes:**
<parágrafo curto com contexto adicional ou nuances importantes>

**Fontes consultadas:** <domínio1>, <domínio2>, <domínio3>...
**Confiança:** Alta / Média / Baixa
**Atualidade:** <data mais recente encontrada nas fontes>
```

---

## Quando usar múltiplas queries

| Tipo de pesquisa | Sub-queries sugeridas |
|---|---|
| Tecnologia/ferramenta | "o que é", "como usar", "alternativas", "casos de uso reais", "comparação com X" |
| Notícias/evento | "últimas notícias", "contexto", "impacto", "reações", "perspectivas futuras" |
| Mercado/negócio | "tamanho do mercado", "players principais", "tendências", "oportunidades", "riscos" |
| Pessoa/empresa | "quem é", "histórico", "projetos recentes", "reputação", "controvérsias" |

---

## Ferramentas disponíveis

- `tavily_search` — busca web em tempo real (prioridade)
- `web_search` — fallback se tavily indisponível

Não use ferramentas de arquivo, código ou execução — isso não é escopo do JARVIS-SEARCH.

---

## Comportamento

- Seja completo mas conciso — relatório deve caber em uma tela do Discord
- Se a informação for incerta ou contraditória entre fontes, sinalize explicitamente
- Se não encontrar informação suficiente após 5+ queries, informe o que foi encontrado e sugira ao Matheus tentar uma fonte específica
- Nunca invente dados, estatísticas ou citações
```

### Passo 2 — Registrar JARVIS-SEARCH como skill no `skills/` (se necessário pelo OpenClaw)

Verificar se o OpenClaw requer um `skill.md` de referência para subagentes além do arquivo `agent/`:
```bash
openclaw agent list
```

Se sim, criar `skills/jarvis-search/skill.md` com descrição resumida de quando delegar.

### Passo 3 — Instalar e registrar o subagente

```bash
npm run install:skills
openclaw agent reload jarvis-search
```

Verificar que aparece no `openclaw agent list`.

### Passo 4 — Atualizar `agent/jarvis.md`: adicionar JARVIS-SEARCH à tabela de delegação

A TAREFA 39 já inclui essa atualização. Verificar que a linha do `jarvis-search` está presente na tabela. Se a TAREFA 39 ainda não foi executada, adicionar manualmente a linha:

```markdown
| Pesquisa profunda, múltiplas fontes, síntese | `jarvis-search` | "pesquisa sobre X", "quero um relatório de Y", "me traz notícias sobre Z", qualquer busca que exija mais de 2 queries |
```

### Passo 5 — Smoke test

No Discord, enviar para o JARVIS:
> "JARVIS, preciso de um relatório sobre o mercado de assistentes de IA pessoais em 2025 — principais players, tendências e oportunidades."

Confirmar que:
- JARVIS delega para JARVIS-SEARCH
- JARVIS-SEARCH executa múltiplas buscas
- Relatório estruturado chega no Discord com fontes e nível de confiança

### Passo 6 — Atualizar `docs/HANDOFF.md`

---

## TAREFA 42 — [Concluido] APK de Debug para Android + Teste do App Windows

**Contexto:** O APK gerado na TAREFA 37 (`app-arm64-release-unsigned.apk`) foi rejeitado no Android com "pacote inválido" porque APKs de release precisam de assinatura digital. Para testes locais, o build de **debug** não requer assinatura e pode ser instalado diretamente via ADB. O app Windows (`.msi`) também precisa ser testado com as novas funcionalidades (wake word, Iniciar/Parar Serviço, system tray).

**Diretório de trabalho:** `C:\Users\matth\OneDrive\Documentos\VS CODE\jarvis-voice\jarvis-voice-app\`

---

### Parte A — APK Debug para Android (instala sem assinatura)

#### Passo 1 — Compilar APK debug

```powershell
cd "C:\Users\matth\OneDrive\Documentos\VS CODE\jarvis-voice\jarvis-voice-app"
$env:CARGO_TARGET_DIR = "$env:LOCALAPPDATA\Temp\jarvis-voice-tauri-target"
npm run tauri android build --apk --debug 2>&1
```

Se o build Rust falhar no symlink (erro de Developer Mode), usar o workaround já documentado:
```powershell
$soSrc = "$env:LOCALAPPDATA\Temp\jarvis-voice-tauri-target\aarch64-linux-android\debug\libjarvis_voice_app_lib.so"
$soDst = "src-tauri\gen\android\app\src\main\jniLibs\arm64-v8a\libjarvis_voice_app_lib.so"
if (Test-Path $soSrc) {
    New-Item -ItemType Directory -Force -Path (Split-Path $soDst)
    Copy-Item $soSrc $soDst -Force
}
cd src-tauri\gen\android
.\gradlew.bat assembleArm64Debug 2>&1
```

#### Passo 2 — Localizar e copiar o APK debug

```powershell
Get-ChildItem -Recurse -Filter "*.apk" src-tauri\gen\android\app\build\ | Select-Object FullName
Copy-Item "src-tauri\gen\android\app\build\outputs\apk\arm64\debug\app-arm64-debug.apk" `
    "..\..\dist-installers\android\app-arm64-debug.apk" -Force
```

#### Passo 3 — Documentar instalação via ADB no HANDOFF

```powershell
# Com celular conectado via USB (Developer Mode + USB Debugging ativados no Android):
adb devices          # confirmar dispositivo listado
adb install -r "dist-installers\android\app-arm64-debug.apk"
```

---

### Parte B — Teste do App Windows

#### Passo 4 — Instalar e verificar o app Windows

Executar o instalador mais recente de `dist-installers\`:
```powershell
Start-Process "dist-installers\JARVIS Voice_0.1.0_x64_en-US.msi"
```

#### Passo 5 — Smoke test do backend

Com backend rodando (`venv\Scripts\python ..\server.py`):
```powershell
$r = Invoke-WebRequest -Uri "http://127.0.0.1:8765/health" -UseBasicParsing -TimeoutSec 5
Write-Output $r.Content   # espera: {"ok":"true","service":"jarvis-voice"}
```

#### Passo 6 — Checklist de funcionalidades (registrar no HANDOFF)

| Funcionalidade | Esperado |
|---|---|
| App abre | Janela com animação de ondas e status "Desconectado" |
| Botão "Iniciar Serviço" | Visível no rodapé |
| Clicar "Iniciar Serviço" | Botão → "Parar Serviço", status → "Aguardando 'JARVIS'..." |
| Fechar janela | App minimiza para system tray (ícone na bandeja) |
| Clicar ícone da bandeja | Menu "Abrir" / "Sair do JARVIS Voice" |
| Campo de texto | Envio de mensagem texto funciona (requer backend ativo) |

#### Passo 7 — Rebuild Windows se checklist falhar

```powershell
$env:CARGO_TARGET_DIR = "$env:LOCALAPPDATA\Temp\jarvis-voice-tauri-target"
npm run tauri build
Copy-Item "$env:LOCALAPPDATA\Temp\jarvis-voice-tauri-target\release\bundle\msi\*.msi" "dist-installers\" -Force
Copy-Item "$env:LOCALAPPDATA\Temp\jarvis-voice-tauri-target\release\bundle\nsis\*.exe" "dist-installers\" -Force
```

### Passo 8 — Atualizar `docs/HANDOFF.md`

Registrar: resultado do APK debug, resultado do checklist Windows, caminho exato do APK, instruções de ADB para o Matheus.

---

## TAREFA 43 — [Concluido] Subir o projeto no GitHub e documentar setup em nova máquina

**Contexto:** JARVIS 2.0 roda em uma única máquina (Windows do Matheus). Para usar em outra máquina ou garantir backup/portabilidade, o projeto precisa estar no GitHub. O repositório deve conter tudo que é necessário para recriar o ambiente — exceto segredos (API keys, senhas de banco).

**Diretório de trabalho:** `C:\Users\matth\OneDrive\Documentos\VS CODE\Jarvis_2.0\`

### Passo 1 — Revisar e atualizar `.gitignore`

Verificar o `.gitignore` existente e garantir que os seguintes itens estão excluídos:

```gitignore
# Segredos
.env

# Dependências e builds
node_modules/
dist/

# Prisma client gerado (regenerado via prisma generate)
node_modules/.prisma/

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db
```

**Não excluir:**
- `prisma/migrations/` — deve ser versionado (decidido na TAREFA 11)
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma.config.ts`
- `scripts/`
- `agent/`
- `skills/`
- `docs/`

### Passo 2 — Criar `.env.example` atualizado

Verificar se `.env.example` reflete todas as variáveis que o projeto atual usa. Garantir que está completo e documentado, com comentários explicativos para cada variável:

```env
# JARVIS API
JARVIS_API_KEY=           # Gere com: openssl rand -hex 32
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Banco de dados PostgreSQL
DATABASE_URL=postgresql://jarvis:SENHA@localhost:5432/jarvis2_db
DEFAULT_USER_ID=user_default

# OpenClaw workspace (default: ~/.openclaw/workspace)
OPENCLAW_WORKSPACE=

# Google (para Gemini)
GOOGLE_API_KEY=           # console.cloud.google.com

# OpenAI (para GPT fallback)
OPENAI_API_KEY=           # platform.openai.com

# Tavily (busca web)
TAVILY_API_KEY=           # tavily.com

# Tuya Smart Home (opcional)
TUYA_CLIENT_ID=
TUYA_CLIENT_SECRET=
TUYA_REGION=us
```

### Passo 3 — Inicializar git e criar commit inicial

```powershell
cd "C:\Users\matth\OneDrive\Documentos\VS CODE\Jarvis_2.0"

git init
git add .
git status   # confirmar que .env NÃO aparece na lista
git commit -m "feat: JARVIS 2.0 — assistente pessoal autônomo (OpenClaw + API REST)"
```

Se já houver commits anteriores, pular `git init` e apenas verificar o status.

### Passo 4 — Criar repositório no GitHub via CLI

```powershell
# Autenticar se necessário
gh auth status   # verifica se já está logado
# gh auth login   # se não estiver

# Criar repo privado
gh repo create jarvis-2.0 --private --source=. --remote=origin --push

# Confirmar
gh repo view --web
```

Se preferir nome diferente, trocar `jarvis-2.0` pelo nome desejado.

### Passo 5 — Criar `docs/SETUP.md` com instruções de nova máquina

Criar ou atualizar `docs/SETUP.md` com o passo a passo completo para reproduzir o ambiente do zero:

```markdown
# Setup — JARVIS 2.0 em nova máquina

## Pré-requisitos

- Node.js 22+
- PostgreSQL 16+
- OpenClaw CLI instalado (`npm install -g @openclaw/cli`)
- Docker (opcional, para subir PostgreSQL via compose)

## 1. Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/jarvis-2.0.git
cd jarvis-2.0
```

## 2. Instalar dependências

```bash
npm install
```

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

## 4. Subir banco de dados

```bash
# Via Docker Compose:
docker-compose up -d postgres

# Ou apontar DATABASE_URL para um PostgreSQL existente
```

## 5. Rodar migrations e seed

```bash
npx prisma migrate deploy
npx prisma db seed
```

## 6. Iniciar a API

```bash
npm run dev     # desenvolvimento
npm start       # produção
```

## 7. Configurar OpenClaw

```bash
# Instalar skills e agente no workspace do OpenClaw
npm run install:skills

# Reiniciar gateway
openclaw gateway restart
```

## 8. Verificar saúde

```bash
curl http://localhost:3001/health
openclaw health
```
```

### Passo 6 — Push e verificação final

```powershell
git log --oneline -5          # confirmar commits
gh repo view                   # confirmar repo criado
```

Abrir o repositório no browser e verificar:
- [ ] `.env` **não** aparece nos arquivos
- [ ] `prisma/migrations/` aparece
- [ ] `agent/jarvis.md` aparece
- [ ] `docs/SETUP.md` aparece com instruções completas

### Passo 7 — Atualizar `docs/HANDOFF.md`

Registrar: URL do repositório GitHub, branch principal, data do push, checklist do que foi verificado.

**Motivo:** Sem o projeto no GitHub, qualquer problema no PC do Matheus (formatação, troca de máquina, disco cheio) perde todo o trabalho acumulado nas TARESAs 1–42. O GitHub é o backup e o ponto de restauração para nova máquina.

---

## TAREFA 44 — [Concluido] Limpar UI do JARVIS Voice e corrigir teste Android com microfone

**Contexto:** O app Android não estava capturando voz de forma confiável, a tela mostrava transcrição/campo de mensagem e havia risco de acentuação quebrada nas respostas em português.

**Resultado:**

- Instalado Playwright no `jarvis-voice-app` e geradas capturas de validação visual.
- UI do JARVIS Voice simplificada: tela inicial limpa, sem histórico/transcrição e sem campo para enviar texto.
- Opções movidas para uma sidebar oculta no botão de três pontos.
- Android configurado para capturar áudio pelo microfone do app via `getUserMedia` e WebSocket `/ws`.
- Manifest Android atualizado com `RECORD_AUDIO` e `MODIFY_AUDIO_SETTINGS`; não foi adicionada permissão de câmera porque o app usa somente áudio.
- Subprocesso do OpenClaw no backend de voz configurado com UTF-8 para preservar acentos em pt-BR.
- Envio de logs de transcrição para Discord mantido via `DISCORD_VOICE_WEBHOOK_URL`; convites `discord.gg` são ignorados porque não são webhooks.
- Versão do app elevada para `0.1.3`.
- Gerados:
  - `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.3_x64_en-US.msi`
  - `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.3_x64-setup.exe`
  - `..\jarvis-voice\jarvis-voice-app\dist-installers\android\app-arm64-debug.apk`

**Validações:**

- `python -m py_compile pipeline.py server.py`
- `npm run build`
- `cargo check`
- Playwright Chromium: confirmou tela inicial sem transcrição/campo de texto e sidebar funcional.
- `npm run tauri -- build`
- `gradlew.bat assembleArm64Debug -x rustBuildArm64Debug`
- Manifest Android final confirmou `INTERNET`, `RECORD_AUDIO` e `MODIFY_AUDIO_SETTINGS`.

---

## TAREFA 45 — [Concluido] Ambiente de teste Android local via emulador

**Contexto:** Instalar o APK no celular a cada ajuste estava atrasando os testes do JARVIS Voice.

**Resultado:**

- Instalado pacote `emulator` do Android SDK.
- Instalada imagem `system-images;android-35;google_apis;x86_64`.
- Criado AVD `JarvisVoiceApi35`.
- Gerado APK x86_64 para emulador apontando para `ws://10.0.2.2:8765/service`.
- Criado script `..\jarvis-voice\jarvis-voice-app\scripts\run-android-emulator.ps1`.
- Adicionados atalhos:
  - `npm run android:emulator`
  - `npm run android:emulator:build`

**Validações:**

- Script abriu o emulador, instalou o APK e iniciou `com.matheus.jarvis.voice`.
- App no emulador conectou no backend local e mostrou `Escutando / Pode falar`.
- Screenshot validada em `..\jarvis-voice\jarvis-voice-app\dist-installers\screenshots\jarvis-voice-emulator-connected.png`.

---

## TAREFA 46 — [Concluido] Corrigir captura de microfone e diagnóstico de wake word

**Contexto:** O app desktop não reconhecia `hey jarvis` e havia suspeita de permissão/captura de microfone no Windows e Android.

**Resultado:**

- Diagnosticado que o backend Python estava usando o microfone padrão incorreto/instável.
- Adicionada variável `VOICE_INPUT_DEVICE` no `jarvis-voice/.env`.
- Configurado `VOICE_INPUT_DEVICE=5`, dispositivo compatível com `16 kHz/int16`, formato usado pelo OpenWakeWord.
- Criado `..\jarvis-voice\scripts\diagnose_microphone.py` para listar e medir microfones no formato real da wake word.
- Criado `..\jarvis-voice\scripts\test_wake_word.py` para testar score de `hey_jarvis` ao vivo.
- Android/app mode ficou mais sensível para fala: threshold RMS reduzido e silêncio mínimo aumentado.
- Erros de permissão/conexão agora aparecem também na tela principal, não apenas na sidebar.
- Versão do JARVIS Voice elevada para `0.1.4`.
- Gerados e instalados os builds Windows `0.1.4`; gerados APKs arm64 e x86_64 atualizados.

**Validações:**

- `python -m py_compile pipeline.py server.py scripts\diagnose_microphone.py scripts\test_wake_word.py`
- `scripts\diagnose_microphone.py` confirmou dispositivos compatíveis; `VOICE_INPUT_DEVICE=5` abre corretamente em `16 kHz/int16`.
- `listen_for_wake_word` abriu sem erro com `VOICE_INPUT_DEVICE=5`.
- `npm run build`
- `cargo check`
- `npm run tauri -- build`
- `gradlew.bat assembleArm64Debug -x rustBuildArm64Debug`
- `npm run android:emulator:build`

---

## TAREFA 47 — [Concluido] Seletor de microfone no JARVIS Voice

**Contexto:** O Windows continuava sem ouvir o Matheus porque o app não permitia selecionar explicitamente o microfone. O usuário também quer a mesma opção no Android para usar fone Bluetooth ou outro dispositivo externo quando disponível.

**Resultado:**

- Backend `jarvis-voice` ganhou endpoint `GET /audio/devices`, listando dispositivos de entrada do `sounddevice` e marcando compatibilidade com `16 kHz/int16`.
- Endpoint WebSocket `/service` passou a aceitar `?inputDevice=<id>` para sobrescrever o `VOICE_INPUT_DEVICE` sem editar `.env`.
- Sidebar do app ganhou opção `Microfone` e botão `Atualizar microfones`, mantendo a tela inicial limpa.
- Desktop/serviço salva a escolha em `jarvisVoiceServiceMicrophone`; Android/app mode salva em `jarvisVoiceAppMicrophone`.
- Android/app mode usa `deviceId` no `getUserMedia` quando um microfone específico é selecionado.
- Versão do app elevada para `0.1.5`.
- Gerados e instalados os builds Windows `0.1.5`:
  - `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.5_x64_en-US.msi`
  - `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.5_x64-setup.exe`

**Validações:**

- `python -m py_compile pipeline.py server.py scripts\diagnose_microphone.py scripts\test_wake_word.py`
- `GET /audio/devices` respondeu e listou microfones compatíveis; no momento do teste apareceram `Microfone (M8)` e Realtek, mas nenhum dispositivo com nome `DB`.
- `npm run build`
- Playwright Chromium confirmou que o seletor de microfone aparece na sidebar.
- `cargo check`
- `npm run tauri -- build`
- Instalado `JARVIS Voice 0.1.5` via NSIS; `%LOCALAPPDATA%\JARVIS Voice\jarvis-voice-app.exe` confirmou versão `0.1.5`.

**Bloqueio Android:**

- `npm run tauri -- android build --apk --target aarch64` compilou a lib ARM64, mas falhou ao criar symlink em `jniLibs` porque o Windows está sem Developer Mode/permissão de symlink.
- Foi copiada manualmente a `.so` ARM64, mas `gradlew assembleArm64Release` aciona novamente a task Rust do Tauri e falha pela ausência do arquivo temporário `com.matheus.jarvis.voice-server-addr`.
- Próximo passo para APK Android `0.1.5`: habilitar Developer Mode no Windows ou ajustar o fluxo Gradle para empacotar sem executar `rustBuildArm64Release`.
