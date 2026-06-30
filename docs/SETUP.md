# Setup — JARVIS 2.0 em nova máquina

## Pré-requisitos

- Node.js 22+
- Git
- Docker Desktop, opcional mas recomendado para PostgreSQL local
- PostgreSQL 16+, se não usar Docker
- OpenClaw CLI instalado

## 1. Clonar o repositório

```bash
git clone https://github.com/teteussilva464-max/jarvis-2.0.git
cd jarvis-2.0
```

## 2. Instalar dependências

```bash
npm install
```

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e preencha pelo menos:

```env
JARVIS_API_KEY=
DATABASE_URL=postgresql://jarvis:SENHA_FORTE@localhost:5432/jarvis2_db
POSTGRES_USER=jarvis
POSTGRES_PASSWORD=SENHA_FORTE
POSTGRES_DB=jarvis2_db
DEFAULT_USER_ID=user_default
GOOGLE_API_KEY=
OPENAI_API_KEY=
TAVILY_API_KEY=
```

Para gerar `JARVIS_API_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Subir o banco de dados

Com Docker Compose:

```bash
docker compose up -d postgres
```

Ou configure `DATABASE_URL` para apontar para um PostgreSQL 16 existente.

## 5. Rodar migrations e seed

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

## 6. Iniciar a API

Desenvolvimento:

```bash
npm run dev
```

Produção local:

```bash
npm run build
npm start
```

Docker completo:

```bash
docker compose up --build -d
docker compose exec jarvis-api npm run prisma:deploy
docker compose exec jarvis-api npx prisma db seed
```

## 7. Configurar OpenClaw

Instale agente e skills no workspace do OpenClaw:

```bash
npm run install:skills
```

Reinicie o gateway:

```bash
openclaw gateway restart
```

No OpenClaw, confirme:

- agente `jarvis`
- skills `jarvis-db`, `jarvis-shell`, `jarvis-search`, `smart-home`, `clawlink`
- `JARVIS_API_URL=http://localhost:3001`
- `JARVIS_API_KEY` igual ao `.env`

## 8. Verificar saúde

```bash
curl http://localhost:3001/health
openclaw health
```

## 9. Canais

Discord e WhatsApp são configurados no OpenClaw, não nesta API.

- Discord: configurar Bot API no OpenClaw
- WhatsApp: plugin oficial `@openclaw/whatsapp` com QR link

## 10. JARVIS Voice

O app de voz fica em projeto irmão:

```text
..\jarvis-voice
```

Para restaurar em outra máquina, clone ou copie também esse projeto e instale os pré-requisitos nativos:

- Python 3.12
- Rust/Cargo
- Visual Studio Build Tools com workload C++
- Android Studio + SDK/NDK, apenas para APK Android

## Troubleshooting

Ver logs da API:

```bash
docker compose logs jarvis-api
```

Verificar banco:

```bash
docker compose ps
```

Testar endpoint autenticado:

```bash
curl http://localhost:3001/tasks -H "X-API-Key: SUA_JARVIS_API_KEY"
```

Atualizar ambiente:

```bash
git pull
npm install
npm run build
npm run install:skills
```
