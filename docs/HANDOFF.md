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
- TAREFA 43 concluída: projeto `Jarvis_2.0` publicado no GitHub privado.
- `.gitignore` revisado para excluir `.env`, dependências, builds e logs, preservando `prisma/migrations/`.
- `.env.example` atualizado com variáveis atuais do projeto, sem segredos reais.
- `docs/SETUP.md` refeito com setup em nova máquina, Docker, Prisma, OpenClaw e JARVIS Voice.
- Git inicializado localmente, branch renomeada para `main` e commit inicial criado.
- GitHub CLI instalado via `winget`, autenticado e usado para criar/pushar o repositório privado.
- Repositório GitHub: `https://github.com/teteussilva464-max/jarvis-2.0`
- Branch principal: `main`
- Verificado no GitHub: `.env` não está publicada; `prisma/migrations/`, `agent/jarvis.md` e `docs/SETUP.md` estão publicados.
- TAREFA 44 concluída no projeto irmão `jarvis-voice`: UI do JARVIS Voice simplificada, sem transcrição visível e sem campo de texto.
- Opções do JARVIS Voice movidas para sidebar oculta no botão de três pontos.
- Playwright instalado no `jarvis-voice-app` e usado para validar tela inicial/sidebar.
- Android passou a usar microfone do próprio app via `getUserMedia` + WebSocket `/ws`; desktop mantém backend local via `/service`.
- Manifest Android atualizado com `RECORD_AUDIO` e `MODIFY_AUDIO_SETTINGS`.
- Correção de UTF-8 no subprocesso que chama OpenClaw para preservar acentuação em pt-BR.
- Logs de voz para Discord continuam via `DISCORD_VOICE_WEBHOOK_URL`; convite `discord.gg` não é webhook e é ignorado pelo backend.
- Versão `0.1.3` gerada para Windows e Android. IP Wi-Fi atual detectado para build/teste Android: `192.168.1.223`.
- TAREFA 45 concluída: ambiente de teste Android local via emulador configurado.
- Android SDK recebeu o pacote `emulator` e a imagem `system-images;android-35;google_apis;x86_64`.
- Criado AVD `JarvisVoiceApi35`.
- Gerado APK x86_64 para emulador em `..\jarvis-voice\jarvis-voice-app\dist-installers\android-emulator\app-x86_64-debug.apk`.
- Criado script `..\jarvis-voice\jarvis-voice-app\scripts\run-android-emulator.ps1` e atalhos `npm run android:emulator` / `npm run android:emulator:build`.
- Fluxo validado: emulador abriu, APK instalou, app iniciou e conectou no backend local (`Escutando / Pode falar`).
- TAREFA 46 concluída: corrigida captura de microfone no desktop e diagnóstico de wake word.
- `VOICE_INPUT_DEVICE=5` configurado no `..\jarvis-voice\.env` porque o microfone padrão do Windows não era o melhor dispositivo para OpenWakeWord em `16 kHz/int16`.
- Criados scripts `..\jarvis-voice\scripts\diagnose_microphone.py` e `..\jarvis-voice\scripts\test_wake_word.py`.
- Android/app mode ficou mais sensível para fala e erros de microfone/permissão agora aparecem na tela principal.
- Versão `0.1.4` gerada e instalada no Windows; APKs Android arm64/x86_64 atualizados.
- TAREFA 47 concluída parcialmente para desktop: JARVIS Voice ganhou seletor de microfone na sidebar, endpoint `GET /audio/devices` e override `?inputDevice=` no `/service`.
- Versão `0.1.5` gerada e instalada no Windows; `%LOCALAPPDATA%\JARVIS Voice\jarvis-voice-app.exe` confirmou versão `0.1.5`.
- `GET /audio/devices` listou dispositivos compatíveis como `Microfone (M8)` e Realtek; nenhum dispositivo com nome `DB` apareceu no Windows durante o teste.
- Build Android `0.1.5` ficou bloqueado por falta de Developer Mode/permissão de symlink no Windows; a lib ARM64 compilou, mas o APK não fechou.
- TAREFA 48 concluída: troca de microfone no select agora salva imediatamente e reinicia a conexão ativa para o backend abrir o novo dispositivo.
- Versão `0.1.6` gerada e instalada no Windows; `%LOCALAPPDATA%\JARVIS Voice\jarvis-voice-app.exe` confirmou versão `0.1.6`.
- `scripts\test_wake_word.py` agora aceita `--device` para testar o microfone escolhido diretamente.
- TAREFA 49 concluída: JARVIS Voice ganhou diagnóstico de microfone em tempo real na sidebar.
- Backend `/service` emite eventos `mic` com volume RMS, wake score, threshold e dispositivo durante a escuta.
- Android/app mode atualiza o volume local via `AudioContext`, sem voltar a mostrar transcrição ou campo de mensagem.
- Versão `0.1.7` gerada e instalada no Windows; `%LOCALAPPDATA%\JARVIS Voice\jarvis-voice-app.exe` confirmou versão `0.1.7`.

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
- `..\jarvis-voice\jarvis-voice-app\dist-installers\screenshots\jarvis-voice-home.png`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\screenshots\jarvis-voice-sidebar-final.png`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\android-emulator\app-x86_64-debug.apk`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\screenshots\jarvis-voice-emulator-connected.png`
- `..\jarvis-voice\jarvis-voice-app\scripts\run-android-emulator.ps1`
- `..\jarvis-voice\scripts\diagnose_microphone.py`
- `..\jarvis-voice\scripts\test_wake_word.py`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.4_x64_en-US.msi`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.4_x64-setup.exe`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.5_x64_en-US.msi`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.5_x64-setup.exe`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.6_x64_en-US.msi`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.6_x64-setup.exe`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.7_x64_en-US.msi`
- `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.7_x64-setup.exe`
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
- `gh auth status` confirmou login em `github.com` como `teteussilva464-max`.
- `gh repo create jarvis-2.0 --private --source=. --remote=origin --push` criou o repo privado e fez push da branch `main`.
- `gh repo view --json nameWithOwner,url,visibility,defaultBranchRef` confirmou `PRIVATE`, URL `https://github.com/teteussilva464-max/jarvis-2.0` e default branch `main`.
- `gh api repos/teteussilva464-max/jarvis-2.0/contents/.env` retornou `404`, confirmando que `.env` não foi publicada.
- `gh api` confirmou presença de `prisma/migrations/`, `agent/jarvis.md` e `docs/SETUP.md`.
- `python -m py_compile pipeline.py server.py` em `jarvis-voice`
- `npm install -D @playwright/test`
- `npx playwright install chromium`
- `npm run build` em `jarvis-voice-app`
- Playwright Chromium validou `hasTranscript=false`, `hasTextForm=false` e sidebar aberta.
- Capturas geradas em `..\jarvis-voice\jarvis-voice-app\dist-installers\screenshots\`
- `cargo check` em `jarvis-voice-app/src-tauri`
- `npm run tauri -- build` gerou instaladores Windows `0.1.3`:
  - `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.3_x64_en-US.msi`
  - `..\jarvis-voice\jarvis-voice-app\dist-installers\JARVIS Voice_0.1.3_x64-setup.exe`
- `npm run tauri -- android build --apk --debug` compilou Rust Android, mas falhou no symlink por falta de Developer Mode no Windows.
- Workaround aplicado: copiada `libjarvis_voice_app_lib.so` para `src-tauri\gen\android\app\src\main\jniLibs\arm64-v8a\`.
- `gradlew.bat assembleArm64Debug -x rustBuildArm64Debug` concluiu com sucesso.
- APK debug `0.1.3` copiado para `..\jarvis-voice\jarvis-voice-app\dist-installers\android\app-arm64-debug.apk` (123 MB).
- Manifest Android final confirmou `INTERNET`, `RECORD_AUDIO` e `MODIFY_AUDIO_SETTINGS`; não há permissão de câmera.
- `sdkmanager --install "emulator" "system-images;android-35;google_apis;x86_64" "platforms;android-35" "platform-tools"`
- `avdmanager create avd --force --name JarvisVoiceApi35 --package "system-images;android-35;google_apis;x86_64" --device "pixel_5"`
- `npm run tauri -- android build --apk --debug --target x86_64` compilou Rust Android, mas falhou no symlink por falta de Developer Mode no Windows.
- Workaround aplicado: copiada `libjarvis_voice_app_lib.so` x86_64 para `src-tauri\gen\android\app\src\main\jniLibs\x86_64\`.
- `gradlew.bat assembleX86_64Debug -x rustBuildX86_64Debug` concluiu com sucesso.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-android-emulator.ps1` abriu o emulador, instalou o APK e iniciou o app.
- Screenshot `jarvis-voice-emulator-connected.png` confirmou estado `Escutando / Pode falar`.
- `npm run build` em `jarvis-voice-app` passou após adicionar scripts no `package.json`.
- `python -m py_compile pipeline.py server.py scripts\diagnose_microphone.py scripts\test_wake_word.py`
- `scripts\diagnose_microphone.py --seconds 1` confirmou microfones disponíveis e revelou que o dispositivo padrão não era o melhor para wake word.
- Teste em `16 kHz/int16` confirmou que `VOICE_INPUT_DEVICE=5` abre corretamente com sinal.
- `listen_for_wake_word` abriu sem erro com `VOICE_INPUT_DEVICE=5`.
- `npm run build` em `jarvis-voice-app`
- `cargo check` em `jarvis-voice-app/src-tauri`
- `npm run tauri -- build` gerou instaladores Windows `0.1.4`.
- Instalado `JARVIS Voice 0.1.4` via NSIS; `%LOCALAPPDATA%\JARVIS Voice\jarvis-voice-app.exe` confirmou versão `0.1.4`.
- `gradlew.bat assembleArm64Debug -x rustBuildArm64Debug` gerou APK arm64 `0.1.4`.
- `npm run android:emulator:build` atualizou o APK x86_64 do emulador.
- `python -m py_compile pipeline.py server.py scripts\diagnose_microphone.py scripts\test_wake_word.py`
- `venv\Scripts\python server.py` + `Invoke-RestMethod http://127.0.0.1:8765/audio/devices` confirmou endpoint de microfones.
- `npm run build` em `jarvis-voice-app`.
- Playwright Chromium validou seletor `#microphoneInput` e botão `#refreshMicrophonesButton` na sidebar.
- `cargo check` em `jarvis-voice-app/src-tauri`.
- `npm run tauri -- build` gerou instaladores Windows `0.1.5` usando `CARGO_TARGET_DIR=%LOCALAPPDATA%\Temp\jarvis-voice-tauri-target`.
- Instalado `JARVIS Voice 0.1.5` via NSIS; `%LOCALAPPDATA%\JARVIS Voice\jarvis-voice-app.exe` confirmou versão `0.1.5`.
- `npm run tauri -- android build --apk --target aarch64` compilou Rust Android, mas falhou no symlink por falta de Developer Mode.
- Workaround parcial: `.so` ARM64 copiada para `src-tauri\gen\android\app\src\main\jniLibs\arm64-v8a\`, mas `gradlew assembleArm64Release` disparou `rustBuildArm64Release` novamente e falhou por ausência de `com.matheus.jarvis.voice-server-addr`.
- `python -m py_compile pipeline.py server.py scripts\diagnose_microphone.py scripts\test_wake_word.py`
- `npm run build` em `jarvis-voice-app`.
- `cargo check` em `jarvis-voice-app/src-tauri`.
- `npm run tauri -- build` gerou instaladores Windows `0.1.6`.
- Instalado `JARVIS Voice 0.1.6` via NSIS; `%LOCALAPPDATA%\JARVIS Voice\jarvis-voice-app.exe` confirmou versão `0.1.6`.
- `python -m py_compile pipeline.py server.py scripts\diagnose_microphone.py scripts\test_wake_word.py`
- WebSocket `ws://127.0.0.1:8765/service?inputDevice=1` recebeu evento `mic` com RMS e `threshold: 0.3`.
- `npm run build` em `jarvis-voice-app`
- `cargo check` em `jarvis-voice-app/src-tauri`
- Playwright Chromium confirmou diagnóstico de microfone visível na sidebar e nenhum campo de texto/transcrição.
- `npm run tauri -- build` gerou instaladores Windows `0.1.7`.
- Instalado `JARVIS Voice 0.1.7` via NSIS; `%LOCALAPPDATA%\JARVIS Voice\jarvis-voice-app.exe` confirmou versão `0.1.7`.

## Pendências

- Criar webhook no canal Discord desejado e preencher `DISCORD_VOICE_WEBHOOK_URL` em `jarvis-voice/.env`. O link `https://discord.gg/wZvxeR2f` é convite, não webhook.
- Testar manualmente wake word com microfone real: `venv\Scripts\python server.py`, abrir app e falar "JARVIS"
- Testar manualmente wake word com microfone real no app instalado: abrir `JARVIS Voice`, clicar em "Iniciar Serviço" se necessário e falar "JARVIS".
- Se `hey jarvis` ainda não detectar, rodar:
  - `cd "C:\Users\matth\OneDrive\Documentos\VS CODE\jarvis-voice"`
  - `.\venv\Scripts\python.exe scripts\test_wake_word.py --device 1 --seconds 20`  # troque 1 pelo microfone selecionado
  - Se o maior score ficar abaixo de `0.30`, testar outro microfone ou reduzir `WAKE_WORD_THRESHOLD` no `.env` com cautela.
- Instalar o APK debug no Android com o celular conectado por USB:
  - `adb install -r "C:\Users\matth\OneDrive\Documentos\VS CODE\jarvis-voice\jarvis-voice-app\dist-installers\android\app-arm64-debug.apk"`
- Se o Android não conectar ao backend via Wi-Fi, rodar PowerShell como Administrador e liberar a porta:
  - `New-NetFirewallRule -DisplayName "JARVIS Voice Backend 8765" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8765 -Profile Private`
- Alternativa sem Firewall: com celular conectado por USB, rodar `adb reverse tcp:8765 tcp:8765` e trocar a URL no app para `ws://127.0.0.1:8765/service`.
- Para `npm run tauri -- android build --apk` funcionar sem workaround, habilitar Developer Mode no Windows ou rodar terminal com privilégio de criar symlink
- Gerar APK Android `0.1.7` após resolver o bloqueio de symlink/Gradle; o APK atual em `dist-installers\android\app-arm64-debug.apk` ainda é anterior ao seletor de microfone e ao diagnóstico em tempo real.
- Assinar o APK Android antes de instalar/distribuir fora de teste local
- Se ainda forem necessárias, reexecutar as skills `proactive-agent` e `evolver` em PowerShell elevado por causa do `EPERM`
- Encontrar slugs válidos para `sequential-thinking` e `openclaw-soul-plugin`, ou remover essas intenções se o ClawHub atual não publicar pacotes compatíveis
- Testar TuyaClaw com dispositivos Tuya Smart

## Próximo passo recomendado

Para testar Android sem celular físico, usar:

```powershell
cd "C:\Users\matth\OneDrive\Documentos\VS CODE\jarvis-voice\jarvis-voice-app"
npm run android:emulator
```

Quando alterar código e quiser rebuildar antes de instalar no emulador:

```powershell
npm run android:emulator:build
```
