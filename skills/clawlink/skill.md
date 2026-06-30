---
name: clawlink
version: 1.0.0
description: Acessa Gmail, Google Calendar, GitHub, Notion e Slack via ClawLink. Use quando o usuário quiser ler/enviar emails, consultar agenda, criar issues, documentar no Notion ou enviar mensagens no Slack.
model-visible: true
eligible: true
---

# ClawLink Skill

Esta skill utiliza o ClawLink (plugin do OpenClaw) para integrar serviços externos.

## Configuração

No Dashboard OpenClaw, acesse **Connections** e autorize cada serviço:
- Gmail / Google Calendar (OAuth Google)
- GitHub (OAuth GitHub)
- Notion (OAuth Notion)
- Slack (OAuth Slack)

Após autorizar, os serviços ficam disponíveis automaticamente via ClawLink.

---

## Gmail

### Ler emails recentes
```
clawlink.gmail.list({ maxResults: 10, query: "is:unread" })
Response: [{ id, subject, from, snippet, date }]
```

### Ler email completo
```
clawlink.gmail.get(emailId)
Response: { subject, from, to, body, date, attachments }
```

### Enviar email
```
clawlink.gmail.send({
  to: "email@exemplo.com",
  subject: "Assunto",
  body: "Corpo do email",
  cc?: "outro@exemplo.com"
})
```

### Responder email
```
clawlink.gmail.reply(emailId, { body: "Resposta aqui" })
```

### Buscar emails
```
clawlink.gmail.list({ query: "from:fulano@gmail.com" })
clawlink.gmail.list({ query: "subject:reunião" })
clawlink.gmail.list({ query: "after:2026/06/01 is:unread" })
```

---

## Google Calendar

### Listar eventos de hoje
```
clawlink.calendar.list({ timeMin: "hoje 00:00", timeMax: "hoje 23:59" })
Response: [{ id, summary, start, end, location, description }]
```

### Listar eventos de um período
```
clawlink.calendar.list({ timeMin: "ISO8601", timeMax: "ISO8601" })
```

### Criar evento
```
clawlink.calendar.create({
  summary: "Nome do evento",
  start: "ISO8601",
  end: "ISO8601",
  description?: "Descrição",
  location?: "Local",
  attendees?: ["email1@gmail.com"]
})
```

### Cancelar evento
```
clawlink.calendar.delete(eventId)
```

---

## GitHub

### Listar issues de um repositório
```
clawlink.github.issues.list({ owner: "usuario", repo: "repo", state: "open" })
Response: [{ number, title, state, labels, assignee, createdAt }]
```

### Criar issue
```
clawlink.github.issues.create({
  owner: "usuario",
  repo: "repo",
  title: "Título da issue",
  body: "Descrição detalhada",
  labels?: ["bug", "enhancement"],
  assignees?: ["usuario"]
})
```

### Criar PR
```
clawlink.github.pulls.create({
  owner: "usuario",
  repo: "repo",
  title: "Título do PR",
  body: "Descrição",
  head: "branch-origem",
  base: "main"
})
```

### Ver status de workflows (CI)
```
clawlink.github.actions.list({ owner: "usuario", repo: "repo" })
```

---

## Notion

### Buscar páginas
```
clawlink.notion.search({ query: "termo de busca" })
Response: [{ id, title, url, lastEdited }]
```

### Ler página
```
clawlink.notion.page.get(pageId)
Response: { title, content, properties }
```

### Criar página em um database
```
clawlink.notion.page.create({
  databaseId: "database-id",
  properties: {
    "Nome": { title: [{ text: { content: "Título da página" } }] },
    "Status": { select: { name: "Em andamento" } },
    "Data": { date: { start: "2026-06-28" } }
  },
  content?: "Conteúdo em markdown"
})
```

### Atualizar propriedade de página
```
clawlink.notion.page.update(pageId, {
  properties: { "Status": { select: { name: "Concluído" } } }
})
```

---

## Slack

### Enviar mensagem para canal
```
clawlink.slack.send({
  channel: "#geral",
  text: "Mensagem aqui"
})
```

### Enviar mensagem direta
```
clawlink.slack.send({
  channel: "@usuario",
  text: "Mensagem aqui"
})
```

### Ler mensagens recentes de um canal
```
clawlink.slack.history({ channel: "#geral", limit: 20 })
```

---

## Mapeamento de linguagem natural

| Usuário diz | Ação |
|-------------|------|
| "quais meus emails não lidos" | `gmail.list({ query: "is:unread" })` |
| "qual minha agenda de amanhã" | `calendar.list({ timeMin: amanhã 00:00, timeMax: amanhã 23:59 })` |
| "manda um email para X sobre Y" | `gmail.send(...)` |
| "cria uma issue no repo X" | `github.issues.create(...)` |
| "documenta isso no Notion" | `notion.page.create(...)` |
| "avisa o Slack que..." | `slack.send(...)` |
| "tem alguma reunião essa semana" | `calendar.list({ timeMin: segunda, timeMax: sexta })` |
