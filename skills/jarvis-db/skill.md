---
name: jarvis-db
version: 1.0.0
description: Manages structured personal data for JARVIS — tasks, reminders, goals, and user facts. Call this skill whenever the user wants to create, list, complete, update, or delete tasks, reminders, goals, or facts stored in the JARVIS PostgreSQL database.
model-visible: true
eligible: true
---

# JARVIS Database Skill

Base URL: `{JARVIS_API_URL}` · Auth header: `X-API-Key: {JARVIS_API_KEY}` · JSON on all requests.

---

## Tasks

```
GET    /tasks               → [{ id, title, priority, dueDate, status, createdAt }]
GET    /tasks?search=kw     → filtered by title (case-insensitive)
POST   /tasks               body: { title*, priority?, dueDate?, description? }  → 201 task
POST   /tasks/batch         body: { titles: string[] }  → 201 [{ id, title }]
PATCH  /tasks/:id           body: { title?, priority?, dueDate?, description? }  → task
PATCH  /tasks/:id/complete  → task with status:"completed"
DELETE /tasks/:id           → { ok: true }
DELETE /tasks               → { deleted: number }  (deletes all pending)
```

priority values: `low | medium | high | urgent` (default: medium)
dueDate: ISO8601 string

---

## Reminders

```
GET    /reminders     → [{ id, title, remindAt, recurrence, status }]  ordered by remindAt ASC
POST   /reminders     body: { title*, remindAt* (ISO8601), message?, recurrence? }  → 201 reminder
DELETE /reminders/:id → { ok: true }  (cancels reminder)
```

recurrence values: `daily | weekly | monthly`
**After creating a reminder, also schedule a native OpenClaw cron at `remindAt`.**

---

## Goals

```
GET    /goals           → [{ id, title, description, schedule, triggerAt, status, lastRunAt }]
POST   /goals           body: { title*, description*, schedule?, triggerAt? }  → 201 goal
PATCH  /goals/:id/pause → { id, status: "paused" }
```

At least one of `schedule` (cron) or `triggerAt` (ISO8601) must be provided.

---

## User Facts

```
GET    /facts      → [{ id, category, fact, confidence }]  ordered by createdAt DESC
POST   /facts      body: { category*, fact*, confidence? (0.0-1.0, default 0.7) }  → 201 fact
DELETE /facts/:id  → { ok: true }
```

category values: `preference | identity | routine | work | project | other`

---

## Quick examples

**"Cria lista de compras: carne, carvão, cerveja"**
```
POST /tasks/batch  {"titles":["Comprar carne","Comprar carvão","Comprar cerveja"]}
```

**"Me lembra de ligar pro dentista amanhã às 9h"**
```
POST /reminders  {"title":"Ligar para o dentista","remindAt":"2026-06-29T09:00:00-03:00"}
```
Then schedule OpenClaw native cron at the same time.

**"Conclui a tarefa de comprar carvão"**
```
GET /tasks?search=carvão  → find id
PATCH /tasks/{id}/complete
```
