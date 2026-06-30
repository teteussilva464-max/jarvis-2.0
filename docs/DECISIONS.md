# Decisões Arquiteturais — JARVIS 2.0

---

## OpenClaw como orquestrador principal

**Motivo:** O JARVIS 1.0 implementou manualmente loop ReAct (AgentService), gerenciamento de canais (Discord.js), embeddings (pgvector), cron (node-cron) e failover de modelos — toda essa complexidade em um único serviço Node.js. Isso resultou em erros 503 frequentes do Gemini sem fallback, embeddings 404 (falta de acesso ao `text-embedding-004`), e código de infraestrutura que crescia junto com a lógica de negócio.

O OpenClaw oferece tudo isso nativamente: loop ReAct, memória SQLite + vector, failover automático (Gemini → OpenAI → Claude), multi-canal (Discord, WhatsApp, Telegram), cron nativo e skills extensíveis.

**Decisão:** OpenClaw é o orquestrador. O JARVIS 2.0 é uma API REST de dados que o OpenClaw consome via skill `jarvis-db`.

---

## Hono como framework HTTP

**Motivo:** JARVIS 2.0 é uma API REST simples. Não precisa de Express (pesado) nem Fastify (complexo para o caso de uso). Hono é TypeScript-first, extremamente leve, roda em Node.js e Edge sem mudança de código, e tem suporte nativo a middleware e validação.

**Decisão:** Hono + `@hono/node-server` na porta 3001.

---

## Schema simplificado — sem Conversation, Note, AiLog, embedding

**Motivo:** No JARVIS 1.0, o banco PostgreSQL armazenava conversas (`Conversation`), notas (`Note`), logs de IA (`AiLog`) e embeddings (`embedding Unsupported("vector(768)")`). Com o OpenClaw como orquestrador, memória de conversas e memória semântica são responsabilidade nativa do OpenClaw (SQLite + vector). Manter essas tabelas no JARVIS 2.0 seria duplicação.

**Decisão:** Schema reduzido a: `User`, `IntegrationIdentity`, `Task`, `Reminder`, `Goal`, `UserFact`. Sem pgvector. Sem tabela de conversas. Sem logs de IA.

---

## DEFAULT_USER_ID — sistema single-user

**Motivo:** O Matheus é o único usuário do JARVIS. Implementar autenticação multi-usuário (JWT, sessões, OAuth) seria over-engineering para um assistente pessoal. A API recebe chamadas autenticadas pelo `X-API-Key` do OpenClaw — não há necessidade de identificar o usuário por request.

**Decisão:** Todas as operações usam um `DEFAULT_USER_ID` fixo, lido do `.env`. O usuário padrão é criado via seed (`prisma/seed.ts`).

---

## Autenticação via X-API-Key (não JWT)

**Motivo:** A API só recebe chamadas do OpenClaw (serviço local na mesma máquina ou rede privada). JWT seria over-engineering — adiciona complexidade de expiração, refresh tokens e validação de assinatura sem benefício real para um serviço local single-tenant.

**Decisão:** Header `X-API-Key` com segredo compartilhado entre OpenClaw e JARVIS API. Middleware valida antes de qualquer rota (exceto `/health`).

---

## Prisma 7 com adapter pg

**Motivo:** Prisma 7 descontinuou o engine nativo `"library"`. O padrão atual é o engine `"client"` (TypeScript puro) com adapter de banco. Para PostgreSQL local sem Accelerate, a solução oficial é `@prisma/adapter-pg` + `pg`. Elimina dependência de binários nativos e funciona em qualquer plataforma.

**Diferença do JARVIS 1.0:** No 1.0, o datasource `url` ficava no `schema.prisma`. No Prisma 7 instalado neste projeto (`7.8.0`), o CLI rejeita `url` dentro do schema com erro P1012. Por isso, a URL fica em `prisma.config.ts`, enquanto o `PrismaClient` em runtime recebe o adapter `@prisma/adapter-pg`.

**Decisão:** `@prisma/adapter-pg` + `pg.Pool` com `DATABASE_URL` no `.env` para runtime, e `prisma.config.ts` com `datasource.url = env("DATABASE_URL")` para comandos Prisma (`generate`, `migrate`, `deploy`).

---

## Skills OpenClaw para integrações externas (ClawLink + Smart Home)

**Motivo:** No JARVIS 1.0, integrações como Gmail e Calendar eram implementadas como ferramentas do loop ReAct (AgentService) — código TypeScript no repositório. Com o OpenClaw, essas integrações chegam nativamente via ClawLink. O JARVIS não precisa implementar OAuth nem clients HTTP para serviços externos.

**Decisão:** Integrações externas são gerenciadas como skills OpenClaw (`skills/clawlink/`, `skills/smart-home/`). O repositório JARVIS contém apenas as definições (skill.md) — não o código de integração.

---

## TuyaClaw para smart home (pendente teste)

**Motivo:** O usuário tenta configurar Tuya via Tuya IoT Cloud (developer portal), mas o processo de vinculação de dispositivos é complexo. TuyaClaw (`claw.tuya.ai`) oferece vinculação via QR code, sem necessidade de criar projeto no portal de desenvolvedor.

**Decisão:** `skills/smart-home/skill.md` está documentada mas marcada como `status: pending-test`. Após o usuário testar TuyaClaw e vincular dispositivos, atualizar o skill.md com os device IDs reais e remover o status de pendência. TAREFA de implementação no `TASKS.md` fica em hold.

---

## Sem Obsidian no JARVIS 2.0

**Motivo:** O JARVIS 1.0 tinha `ObsidianService` para salvar notas em vault Markdown. No 2.0, notas e memória são responsabilidade do OpenClaw (via plugin `memory-wiki` nativo). Manter um serviço de Obsidian no JARVIS criaria dois sistemas de notas paralelos.

**Decisão:** Sem `ObsidianService`. Notas ficam na memória do OpenClaw. Se o usuário quiser sincronizar com Obsidian no futuro, isso será uma skill OpenClaw, não código neste repositório.

---

## Porta 3001 (não 3000)

**Motivo:** O JARVIS 1.0 usa a porta 3000. Durante o período de migração paralela (1.0 e 2.0 rodando ao mesmo tempo), as portas precisam ser diferentes para não colidir.

**Decisão:** JARVIS 2.0 roda na porta 3001. Após migração completa e desligamento do 1.0, pode ser alterado para 3000 se desejado.

---

## Gemini como modelo primário + OpenAI em cascata

**Motivo:** O JARVIS 2.0 usa OpenClaw que suporta modelo primário e fallbacks nativos. Groq foi testado como primário, mas o tier `on_demand` retornou erro de TPM (`Request too large`) com o prompt do OpenClaw mesmo em mensagens simples. Para estabilizar o JARVIS, Gemini fica como modelo primário e coringa para rotina, análise e raciocínio. OpenAI fica reservado para código, debugging e tarefas técnicas pesadas.

**Decisão:** Hierarquia de modelos:
1. `google/gemini-2.5-flash` — primário e coringa (chat, pesquisas, análise, raciocínio, síntese)
2. `openai/gpt-5.3-codex` — fallback 1 e preferido para código/tarefas técnicas
3. `openai/gpt-5.5` — fallback 2 caso o Codex não esteja disponível

O failover é automático via OpenClaw — se o modelo ativo retornar erro, rate limit ou timeout, usa o próximo. O agent.md contém tabela de roteamento sugerido por tipo de tarefa como hint; o roteamento dinâmico por tarefa dentro de uma sessão depende do suporte nativo do OpenClaw.

---

## Política operacional do agente OpenClaw

**Motivo:** Em testes no Discord, o Gemini em modo de raciocínio visível gerou retry interno e o agente tentou usar ferramenta de envio (`message`) além da resposta final do turno. Isso causou respostas duplicadas/parciais no dashboard e no Discord.

**Decisão:** O agente `jarvis` usa `google/gemini-2.5-flash` com `thinking: medium` para conversa diária, análises e tarefas de complexidade média. `reasoningDefault` fica `off` para não expor raciocínio intermediário, e as ferramentas `message` e `sessions_send` ficam negadas no perfil do agente. O GPT permanece como fallback e opção preferida para código, debugging e reflexões profundas.

O plugin antigo `openclaw-plugin-clawlink` permanece explicitamente desabilitado na config do OpenClaw. Remover a entrada faz o OpenClaw tentar auto-carregar o pacote antigo e invalidar a configuração; portanto, nesse caso a entrada `enabled: false` é necessária para manter o gateway estável.

Histórico de sessão ruim deve ser limpo quando contaminar respostas futuras. A sessão de DM do Discord criada durante os testes com Groq continha erros, tool calls de `message` e respostas duplicadas; ela foi removida para a próxima conversa começar com contexto limpo. Também foi removido o hook legado `jarvis-forward`, que apontava para o JARVIS 1.0 (`/webhook/openclaw`) e não faz parte da arquitetura JARVIS 2.0.

---

## Subagentes especializados (JARVIS-CODER e JARVIS-ANALYST)

**Motivo:** Matheus é Data Analyst e Dev Full-stack. Para tarefas de trabalho (código, SQL, análise), um único agente genérico não é ideal: usa o modelo errado e bloqueia a conversa enquanto processa. A arquitetura de subagentes permite delegação por especialidade.

**Decisão:** JARVIS principal (Gemini) orquestra. Para código → spawna `jarvis-coder` (GPT-5.3-Codex). Para análise de dados → spawna `jarvis-analyst` (Gemini, contexto longo configurado). Chat e tarefas simples ficam no agente principal. A skill `@arminnaimi/agent-team-orchestration` fornece os protocolos de handoff e rastreamento de estado.

---

## Skills complementares do ClaHHub para subagentes (TAREFA 26)

**Motivo:** Revisão de 93 skills do ClaHHub cruzada com o stack existente identificou 8 skills que preenchem gaps reais, sem duplicar nada já instalado ou planejado. Critério: gap concreto em um dos subagentes + alta adoção (14k+ downloads).

**Decisão:** Instalar: `github` (CODER), `excel-xlsx` + `powerpoint-pptx` + `word-docx` + `deep-research-pro` (ANALYST), `agent-browser` + `powerpoint-pptx` + `word-docx` (DESIGNER), `evolver` + `humanizer` (todos). Descartados: Gog (coberto por clawlink), Multi Search Engine (coberto por Tavily+Prismfy), Trello (coberto por jarvis-db+Notion), Obsidian (decisão arquitetural prévia), Elite Longterm Memory (coberto por proactive-agent+jarvis-db), Browser Use (Agent Browser é mais otimizado para agentes).

---

## Subagente JARVIS-DESIGNER para freelancer de design

**Motivo:** Matheus faz trabalhos freelancer de branding e landing pages. Ele tem background de web developer (forte em HTML/CSS/JS) mas não é especialista em brand design. Um agente genérico pode dar guidelines básicos, mas sem skills especializadas não consegue entregar paletas concretas, tipografias calibradas ou estrutura de landing page otimizada para conversão.

O ClaHHub tem duas skills diretamente relevantes: `SuperDesign` (guidelines de frontend/UI para landing pages e dashboards) e `UI/UX Pro Max` (design intelligence para interfaces polidas). Ambas sem custo adicional. Também há `Nano Banana Pro` para geração de imagens conceituais (logos, mockups, moodboards).

**Decisão:** Criar subagente `JARVIS-DESIGNER` (Gemini, 16k contexto) com as três skills instaladas. Especializado em entregar outputs práticos — hex de cores, nomes de fontes, estrutura HTML de landing page — que Matheus consegue implementar diretamente com seu background técnico. O JARVIS principal delega pedidos de design a esse subagente automaticamente.

---

## Plugin oficial @openclaw/whatsapp como canal nativo (substitui Evolution API)

**Motivo:** A Evolution API foi avaliada como solução gratuita para WhatsApp, mas cobre apenas envio de mensagens (unidirecional). O plugin oficial `@openclaw/whatsapp` (147k downloads, mais baixado do ClaHHub) usa o mesmo protocolo Baileys/WhatsApp Web — configuração por QR scan, sem Docker, sem custo adicional, sem ClawLink — e habilita o WhatsApp como canal bidirecional completo: Matheus fala com o JARVIS pelo WhatsApp e o JARVIS responde, exatamente como funciona no Discord.

**Decisão:** Substituir a abordagem Evolution API pelo plugin oficial. `skills/whatsapp/skill.md` e as variáveis `EVOLUTION_*` no `.env` são removidos. O canal WhatsApp passa a ser gerenciado nativamente pelo OpenClaw via plugin, sem skill.md necessário (o mesmo padrão do Discord). Configuração: `openclaw plugins install @openclaw/whatsapp` → `openclaw channels add whatsapp` → QR scan com o celular.

---

## DATABASE_URL no Docker Compose

**Motivo:** No host, comandos Prisma de desenvolvimento usam `localhost:5432` para acessar o PostgreSQL publicado pelo Docker. Dentro do container `jarvis-api`, `localhost` aponta para o próprio container, não para o serviço PostgreSQL. Por isso, migrations/seeds ou a API dentro do container falham com P1001 quando `DATABASE_URL` aponta para `localhost`.

**Decisão:** O `docker-compose.yml` publica o PostgreSQL em `5432:5432` para o host, mas sobrescreve `DATABASE_URL` apenas no serviço `jarvis-api` para `postgres:5432`, usando o DNS interno do Compose.

---

## Skill Tuya Smart Control não instalada

**Motivo:** A skill `@gaosq856/tuya-smart-control` foi investigada como alternativa ao smart-home atual, mas seu modelo de credenciais é diferente do fluxo adotado no JARVIS 2.0. O projeto usa TuyaClaw/smart-home com `TUYA_CLIENT_ID` e `TUYA_CLIENT_SECRET`; a skill alternativa espera credenciais de API incompatíveis com essa decisão.

**Decisão:** Não instalar `tuya-smart-control` para evitar duplicação e conflito de configuração. Manter `skills/smart-home/skill.md` como caminho oficial para Tuya até o teste com dispositivos reais.

---

## Status de skills/plugins do ClaHHub em 2026-06-29

**Motivo:** Algumas tarefas do Claude referenciavam owners/slugs que não batem com o registro atual do ClawHub ou que falham no instalador Windows do OpenClaw 2026.6.10.

**Decisão:** Foram instaladas as skills disponíveis e visíveis para o agente: `automation-workflows`, `weather`, `news-summary`, `language-learning`, `agent-team-orchestration`, `frontend-design` (instalada via `superdesign`), `nano-banana-pro`, `agent-browser`, `deep-research`, `excel-xlsx`, `powerpoint-pptx`, `word-docx` e `humanizer`. `data-analysis` já estava instalada e `skill-creator` existe como bundled.

Pendentes por falha do instalador/registry: `proactive-agent`, `ui-ux-pro-max`, `evolver`, `sequential-thinking` e `openclaw-soul-plugin`. Plugins oficiais `memory-lancedb`, `tokenjuice` e `diffs` ficaram instalados e habilitados.

---

## JARVIS Voice como projeto separado

**Motivo:** Voz em tempo real adiciona dependências pesadas e responsabilidades diferentes da JARVIS API: captura de microfone, WebSocket, STT, TTS, UI desktop/mobile e build nativo. Misturar isso no `Jarvis_2.0` quebraria a separação atual, onde este repo é apenas API de dados e o OpenClaw orquestra conversas.

**Decisão:** Criar `jarvis-voice/` como projeto irmão fora de `Jarvis_2.0`. O backend Python expõe WebSocket e chama o agente `jarvis` via OpenClaw CLI com session key `agent:jarvis:voice`. O app `jarvis-voice-app` usa Vite/Tauri v2 como cliente de áudio. Builds nativos dependem de Rust/Cargo e Visual Studio Build Tools; Android depende também de Android Studio/NDK.

---

## VAD contínuo no JARVIS Voice

**Motivo:** Push-to-talk funciona como fallback, mas não entrega a experiência desejada de conversar naturalmente com o JARVIS. O frontend consegue detectar início/fim de fala com RMS local e o backend já tem `faster-whisper`, que inclui VAD via Silero.

**Decisão:** O app `jarvis-voice-app` usa captura contínua de microfone com `AudioContext`/`AnalyserNode`. Enquanto detecta fala, envia eventos `audio_chunk` ao WebSocket; após silêncio configurável, envia `vad_end`. O backend acumula os chunks e transcreve com `faster-whisper` usando `vad_filter=True`. `VAD_SILENCE_MS` fica configurável no `.env`.

---

## Wake word no backend e serviço em background

**Motivo:** O navegador/WebView não é confiável para capturar microfone continuamente quando a janela está minimizada. Para entregar uma experiência de assistente real, a escuta do wake word precisa ficar no backend Python, enquanto o app desktop apenas controla o serviço e exibe estado.

**Decisão:** `jarvis-voice` usa OpenWakeWord no backend com modelo `hey_jarvis`, endpoint WebSocket `/service` e captura de comando por `sounddevice`. O endpoint `/ws` antigo permanece como compatibilidade para testes manuais. No desktop, Tauri usa system tray; fechar a janela esconde o app em vez de encerrar.

---

## JARVIS-SEARCH como subagente de pesquisa

**Motivo:** Pesquisas profundas, notícias e sínteses multi-fonte exigem múltiplas queries e checagem de lacunas. Fazer isso no JARVIS principal aumenta latência e mistura responsabilidades.

**Decisão:** Criar `jarvis-search` como subagente OpenClaw com Gemini 2.5 Flash, contexto 32k e ferramentas de busca liberadas no perfil `messaging`. O JARVIS principal delega pesquisas com mais de 2 queries ou relatórios multi-fonte para esse subagente.

---

## Execução de terminal somente com aprovação

**Motivo:** O Matheus quer que o JARVIS proponha comandos, mas execução automática em canais de mensagem é arriscada e a CLI OpenClaw 2026.6.10 não expõe `openclaw tools`/`openclaw search` para confirmar uma ferramenta nativa de shell.

**Decisão:** Criar a skill local `jarvis-shell` como protocolo operacional: o JARVIS deve propor o comando, explicar o motivo e aguardar confirmação explícita antes de executar quando houver ferramenta disponível. No perfil `messaging`, se não houver ferramenta de execução, o JARVIS deve pedir para o Matheus executar ou chamar o Codex.

---

## Build Android do JARVIS Voice no Windows

**Motivo:** Tauri Android precisa de Android SDK, NDK, targets Rust Android e Gradle. O `ndk-bundle` antigo instala, mas o Rust/Tauri atual precisa de NDK side-by-side moderno para linkar `libunwind`.

**Decisão:** Manter `ndk-bundle` instalado por compatibilidade, mas usar `ndk;28.2.13676358` para builds Tauri Android. Em Windows sem Developer Mode, `tauri android build --apk` falha ao criar symlink para `jniLibs`; o workaround validado é copiar manualmente a `.so` arm64 compilada e rodar `gradlew assembleArm64Release -x rustBuildArm64Release`. O APK gerado é `unsigned` até configurar assinatura.

---

## JARVIS Voice desktop inicia backend local

**Motivo:** O instalador Windows `0.1.0` do JARVIS Voice instalava somente o frontend Tauri. Sem iniciar `jarvis-voice/server.py`, o app abria mas não conseguia conectar em `127.0.0.1:8765`.

**Decisão:** A partir da versão `0.1.2`, o app desktop Tauri tenta iniciar automaticamente o backend Python local quando a porta `8765` não está escutando. O caminho padrão é o projeto irmão `..\jarvis-voice`, com override por `JARVIS_VOICE_ROOT` caso a pasta mude. O app reutiliza um backend já ativo e expõe erro visível na UI se não conseguir iniciar/conectar.

---

## Teste Android do JARVIS Voice usa backend Windows na LAN

**Motivo:** O APK Android não embute o backend Python. No celular, `127.0.0.1` aponta para o próprio Android, não para o Windows; portanto o app móvel precisa alcançar o backend pela rede local ou por `adb reverse`.

**Decisão:** Para teste Android local, o backend `jarvis-voice/server.py` roda no Windows com `VOICE_HOST=0.0.0.0` e o APK debug pode ser gerado com `VITE_JARVIS_VOICE_SERVER_URL=ws://<IP_DO_WINDOWS>:8765/service`. No ambiente atual, o IP detectado foi `192.168.0.31`, usado no APK debug da TAREFA 42. Se o Firewall bloquear acesso pelo celular, liberar TCP `8765` no perfil privado ou usar `adb reverse tcp:8765 tcp:8765` e ajustar a URL no app para `ws://127.0.0.1:8765/service`.
