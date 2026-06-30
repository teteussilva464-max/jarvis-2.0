# Handoff — JARVIS 2.0

## Última atualização

Data: 2026-06-30
IA responsável: Codex

## O que foi feito

- Android SDK command-line tools instalado em `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest`.
- Licenças Android aceitas e instalados: `ndk-bundle`, `ndk;28.2.13676358`, `platform-tools`, `platforms;android-35`, `platforms;android-36`, `build-tools;35.0.0`, `build-tools;36.0.0`.
- TAREFA 37 concluída no projeto irmão `jarvis-voice`: projeto Android Tauri inicializado e APK arm64 gerado.
- Como o Windows não permite symlink sem Developer Mode, o build direto `tauri android build --apk` compila a lib mas para ao criar symlink; workaround usado: copiar `libjarvis_voice_app_lib.so` manualmente e rodar `gradlew assembleArm64Release -x rustBuildArm64Release`.
- APK copiado para `..\jarvis-voice\jarvis-voice-app\dist-installers\android\app-arm64-release-unsigned.apk`.
- TAREFA 38 concluída: backend de voz ganhou wake word com OpenWakeWord, captura de comando por microfone no backend, endpoint WebSocket `/service`, UI de Iniciar/Parar Serviço e system tray no Tauri Windows.
- Modelo `hey_jarvis_v0.1` baixado via `openwakeword.utils.download_models` e carregado com ONNX Runtime.
- TAREFA 39 concluída: `agent/jarvis.md` recebeu Protocolo de Resolução de Problemas, busca proativa e delegação para `jarvis-search`.
- TAREFA 40 concluída: `openclaw tools` e `openclaw search` não existem na CLI 2026.6.10; criada skill local `jarvis-shell` como protocolo de execução com aprovação.
- TAREFA 41 concluída: criado agente `jarvis-search`, skill `jarvis-search`, instalador atualizado e OpenClaw configurado/listando o novo agente.
- Config do OpenClaw ajustada para `jarvis.reasoningDefault = off`, reduzindo risco de raciocínio intermediário/respostas duplicadas.
- Reinstalado o agente/skills no OpenClaw com `npm run install:skills` e reiniciado o gateway.
- Teste do instalador Windows do JARVIS Voice: a versão `0.1.0` instalava apenas o frontend Tauri e não iniciava o backend Python, deixando `127.0.0.1:8765` fechado.
- Corrigido o app desktop para iniciar automaticamente o backend `jarvis-voice/server.py` quando o app abrir e a porta `8765` não estiver escutando.
- Gerada e instalada a versão `0.1.2` do JARVIS Voice. O app instalado em `%LOCALAPPDATA%\JARVIS Voice\jarvis-voice-app.exe` iniciou o backend automaticamente.
- TAREFA 42 concluída: gerado APK Android debug assinado automaticamente pelo Gradle para teste local via ADB.
- Backend de voz configurado para teste Android na LAN com `VOICE_HOST=0.0.0.0`; Windows está usando IP `192.168.0.31`.
- APK debug gerado com URL padrão `ws://192.168.0.31:8765/service`, para conectar no backend Windows pela mesma rede Wi-Fi.
- TAREFA 43 iniciada: projeto `Jarvis_2.0` preparado para GitHub/portabilidade.
- `.gitignore` revisado para excluir `.env`, dependências, builds e logs, preservando `prisma/migrations/`.
- `.env.example` atualizado com variáveis atuais do projeto, sem segredos reais.
- `docs/SETUP.md` refeito com setup em nova máquina, Docker, Prisma, OpenClaw e JARVIS Voice.
- Git inicializado localmente, branch renomeada para `main` e commit inicial criado.
- GitHub CLI instalado via `winget`, mas criação/push do repositório remoto ficou bloqueada porque `gh` ainda não está autenticado.

## Arquivos alterados

- `docs/DECISIONS.md`
- `docs/HANDOFF.md`
- `docs/TASKS.md`
- `docs/SETUP.md`
- `.gitignore`
- `.env.example`
- `agent/jarvis.md`
- `agent/jarvis-search.md`
- `skills/jarvis-shell/skill.md`
- `skills/jarvis-search/skill.md`
- `scripts/install-openclaw-skills.ts`
- `..\jarvis-voice\.env.example`
- `..\jarvis-voice\.env`
- `..\jarvis-voice\pipeline.py`
- `..\jarvis-voice\server.py`
- `..\jarvis-voice\jarvis-voice-app\index.html`
- `..\jarvis-voice\jarvis-voice-app\src\main.ts`
- `..\jarvis-voice\jarvis-voice-app\src\vite-env.d.ts`
- `..\jarvis-voice\jarvis-voice-app\src\style.css`
- `..\jarvis-voice\jarvis-voice-app\src-tauri\Cargo.toml`
- `..\jarvis-voice\jarvis-voice-app\src-tauri\src\lib.rs`
- `..\jarvis-voice\jarvis-voice-app\src-tauri\tauri.conf.json`
- `..\jarvis-voice\jarvis-voice-app\package.json`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\android\app-arm64-debug.apk`
- `%USERPROFILE%\.openclaw\openclaw.json`

## Validações executadas

- `python -m py_compile pipeline.py server.py`
- `npm run build` em `jarvis-voice-app`
- `npm run lint`
- `venv\Scripts\python -m pip install -r requirements.txt`
- `venv\Scripts\python -c "from openwakeword.utils import download_models; download_models(['hey_jarvis_v0.1'])"`
- `venv\Scripts\python -c "from openwakeword.model import Model; Model(wakeword_models=['hey_jarvis'], inference_framework='onnx')"` carregou o modelo
- `npm run tauri -- build` concluiu e gerou instaladores Windows atualizados:
  - `%LOCALAPPDATA%\Temp\jarvis-voice-tauri-target\release\bundle\msi\JARVIS Voice_0.1.0_x64_en-US.msi`
  - `%LOCALAPPDATA%\Temp\jarvis-voice-tauri-target\release\bundle\nsis\JARVIS Voice_0.1.0_x64-setup.exe`
- Instaladores copiados para `..\jarvis-voice\jarvis-voice-app\dist-installers\`
- `rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android`
- `npm run tauri -- android init --ci`
- `npm run tauri -- android build --apk` validou compilação Rust Android, mas falhou no symlink por falta de Developer Mode no Windows
- `gradlew.bat assembleArm64Release -x rustBuildArm64Release` gerou `app-arm64-release-unsigned.apk`
- `npm run install:skills` reinstalou agente/skills no workspace do OpenClaw
- `openclaw gateway restart` reiniciou a task agendada do gateway
- `openclaw agents list` confirmou `jarvis-search`
- `openclaw health` respondeu: Discord configurado, WhatsApp linked, event loop `ok`, agentes `jarvis`, `main`, `jarvis-coder`, `jarvis-analyst`, `jarvis-designer`, `jarvis-search`
- `npm run build` em `jarvis-voice-app`
- `cargo check` em `jarvis-voice-app/src-tauri`
- `npm run tauri -- build` gerou instaladores Windows `0.1.2`:
  - `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.2_x64_en-US.msi`
  - `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.2_x64-setup.exe`
- Instalado `JARVIS Voice 0.1.2` via instalador NSIS.
- App instalado iniciado a partir de `%LOCALAPPDATA%\JARVIS Voice\jarvis-voice-app.exe`; backend abriu `127.0.0.1:8765` automaticamente.
- `Invoke-RestMethod http://127.0.0.1:8765/health` respondeu `{"ok":"true","service":"jarvis-voice"}`.
- WebSocket `ws://127.0.0.1:8765/service` respondeu estados `standby`, confirmando que o serviço de voz está ativo aguardando wake word.
- `npm run build` em `jarvis-voice-app` com `VITE_JARVIS_VOICE_SERVER_URL=ws://192.168.0.31:8765/service`
- `cargo check` em `jarvis-voice-app/src-tauri`
- `npm run tauri -- android build --apk --debug` compilou Rust Android, mas falhou no symlink por falta de Developer Mode no Windows.
- Workaround aplicado: copiada `libjarvis_voice_app_lib.so` de `%LOCALAPPDATA%\Temp\jarvis-voice-tauri-target\aarch64-linux-android\debug\` para `src-tauri\gen\android\app\src\main\jniLibs\arm64-v8a\`.
- `gradlew.bat assembleArm64Debug -x rustBuildArm64Debug` concluiu com sucesso.
- APK debug copiado para `..\jarvis-voice\jarvis-voice-app\dist-installers\android\app-arm64-debug.apk` (123 MB).
- `adb devices` executado; nenhum aparelho Android estava conectado/listado.
- Backend reiniciado com `.env` e `VOICE_HOST=0.0.0.0`; `Get-NetTCPConnection` confirmou `0.0.0.0:8765` em `Listen`.
- `Invoke-RestMethod http://192.168.0.31:8765/health` respondeu `{"ok":"true","service":"jarvis-voice"}`.
- Tentativa de criar regra de Firewall TCP `8765` falhou com `Acesso negado` por falta de sessão elevada.
- `npm run lint` passou após atualização de setup.
- `git init`
- `git check-ignore -v .env dist node_modules` confirmou que segredos/builds estão ignorados.
- `git add .` confirmou que `.env`, `dist/` e `node_modules/` não entraram no stage.
- `git commit -m "feat: JARVIS 2.0 — assistente pessoal autônomo (OpenClaw + API REST)"` criou o commit local `f20f108`.
- `git branch -M main` definiu a branch principal local.
- `winget install --id GitHub.cli -e --source winget --accept-package-agreements --accept-source-agreements` instalou `gh 2.95.0`.
- `gh auth status` retornou que não há login GitHub ativo.

## Pendências

- Criar canal Discord `#voz-log`, criar webhook e preencher `DISCORD_VOICE_WEBHOOK_URL` em `jarvis-voice/.env`
- Testar manualmente wake word com microfone real: `venv\Scripts\python server.py`, abrir app e falar "JARVIS"
- Testar manualmente wake word com microfone real no app instalado: abrir `JARVIS Voice`, clicar em "Iniciar Serviço" se necessário e falar "JARVIS".
- Instalar o APK debug no Android com o celular conectado por USB:
  - `adb install -r "C:\Users\matth\OneDrive\Documentos\VS CODE\jarvis-voice\jarvis-voice-app\dist-installers\android\app-arm64-debug.apk"`
- Se o Android não conectar ao backend via Wi-Fi, rodar PowerShell como Administrador e liberar a porta:
  - `New-NetFirewallRule -DisplayName "JARVIS Voice Backend 8765" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8765 -Profile Private`
- Alternativa sem Firewall: com celular conectado por USB, rodar `adb reverse tcp:8765 tcp:8765` e trocar a URL no app para `ws://127.0.0.1:8765/service`.
- Para `npm run tauri -- android build --apk` funcionar sem workaround, habilitar Developer Mode no Windows ou rodar terminal com privilégio de criar symlink
- Assinar o APK Android antes de instalar/distribuir fora de teste local
- Se ainda forem necessárias, reexecutar as skills `proactive-agent` e `evolver` em PowerShell elevado por causa do `EPERM`
- Encontrar slugs válidos para `sequential-thinking` e `openclaw-soul-plugin`, ou remover essas intenções se o ClawHub atual não publicar pacotes compatíveis
- Testar TuyaClaw com dispositivos Tuya Smart
- Autenticar GitHub CLI e concluir push remoto da TAREFA 43:
  - `gh auth login`
  - `gh repo create jarvis-2.0 --private --source=. --remote=origin --push`
  - `gh repo view --web`

## Próximo passo recomendado

Concluir a autenticação do GitHub CLI com `gh auth login`; depois rodar `gh repo create jarvis-2.0 --private --source=. --remote=origin --push` dentro de `C:\Users\matth\OneDrive\Documentos\VS CODE\Jarvis_2.0`.
