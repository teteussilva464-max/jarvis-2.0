# AGENTS.md — Regras para Codex, Claude e ChatGPT

Este projeto é desenvolvido por múltiplas IAs em colaboração.

## Leitura obrigatória antes de qualquer ação

Leia nesta ordem:

1. `docs/PROJECT_CONTEXT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/HANDOFF.md`
4. `docs/TASKS.md`
5. `docs/DECISIONS.md`

Nunca altere o projeto sem entender o estado atual.

---

## Papel de cada IA

### Codex

Responsável por:
- Implementar os arquivos TypeScript listados em `docs/TASKS.md`
- Criar migrations Prisma quando o schema mudar
- Corrigir bugs reportados
- Manter o projeto compilável (`npm run lint` sem erros)
- Atualizar `docs/HANDOFF.md` ao finalizar cada TAREFA
- Marcar tarefas como `[Concluido]` em `docs/TASKS.md`

### Claude

Responsável por:
- Revisar implementações do Codex
- Encontrar inconsistências entre código e arquitetura
- Atualizar `docs/TASKS.md` com novas TARESAs precisas
- Atualizar `docs/DECISIONS.md` com decisões arquiteturais
- Avaliar qualidade, segurança e coerência do código
- **Não criar arquivos TypeScript** — apenas documentar e revisar
-  Transformar ideias do usuário em TARESAs claras para o Codex
- Orientar o usuário sobre uso do JARVIS
- Ajudar em decisões de produto e arquitetura

---

## Regras obrigatórias

- Nunca trocar a stack sem registrar em `DECISIONS.md`
- Nunca apagar código sem justificar
- Nunca criar serviço duplicado
- Nunca colocar API key no código — sempre em `.env`
- Nunca implementar lógica de IA, canal ou scheduler neste repo — isso é do OpenClaw
- Nunca executar shell commands destrutivos
- Sempre manter o projeto compilável após cada mudança
- Sempre atualizar `HANDOFF.md` ao finalizar
- Sempre atualizar `TASKS.md` ao concluir TAREFA
- Sempre registrar decisões importantes em `DECISIONS.md`
- Sempre preservar a separação: JARVIS é dados, OpenClaw é orquestração

---

## Arquitetura esperada

```
OpenClaw (orquestrador externo)
    │
    ▼ HTTP + X-API-Key
JARVIS API (este repo) — porta 3001
    │
    ▼
PostgreSQL — Tasks, Reminders, Goals, UserFacts
```

O JARVIS não fala com OpenClaw. O OpenClaw fala com o JARVIS.

---

## Padrão das rotas Hono

Toda rota deve:
- Usar `zod` para validar o body antes de qualquer operação no banco
- Retornar `400` para body inválido (com `{ ok: false, error: "..." }`)
- Retornar `404` para recurso não encontrado
- Retornar `500` para erros inesperados (logados com pino)
- Usar `async/await`, nunca callbacks
- Não conter lógica de negócio complexa — delegar para funções de serviço se necessário

---

## Padrão de handoff obrigatório

Ao finalizar qualquer TAREFA, atualize `HANDOFF.md` com:

```md
## Última atualização

Data:
IA responsável:

## O que foi feito

## Arquivos alterados

## Validações executadas

## Pendências

## Próximo passo recomendado
```
