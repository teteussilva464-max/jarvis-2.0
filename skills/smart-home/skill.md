---
name: smart-home
version: 1.0.0
description: Controla dispositivos inteligentes Tuya (luzes, tomadas, ar-condicionado, sensores) via TuyaClaw. Use quando o usuário quiser ligar, desligar, ajustar ou consultar dispositivos da casa.
model-visible: true
eligible: true
status: pending-test
---

# Smart Home Skill

Esta skill controla dispositivos Tuya via TuyaClaw (`claw.tuya.ai`).

> **Status:** Aguardando vinculação dos dispositivos via QR code no app TuyaClaw.
> Após o teste, este arquivo será atualizado com os device IDs reais.

## Pré-requisitos

1. Instalar o TuyaClaw no OpenClaw:
   ```
   openclaw install claw.tuya.ai
   ```
2. No app OpenClaw, ir em Connections > TuyaClaw e vincular via QR code
3. Preencher em `.env`:
   ```
   TUYA_CLIENT_ID=...
   TUYA_CLIENT_SECRET=...
   TUYA_REGION=us  # ou br, eu
   ```

## Dispositivos (preencher após vinculação)

| Apelido | Device ID | Tipo | Localização |
|---------|-----------|------|-------------|
| luz_sala | (preencher) | switch | Sala |
| luz_quarto | (preencher) | switch | Quarto |
| ar_sala | (preencher) | climate | Sala |
| tomada_1 | (preencher) | outlet | (preencher) |

## Comandos disponíveis (via TuyaClaw)

### Ligar/desligar dispositivo
```
tuya.control(deviceId, { switch: true|false })
```

### Consultar estado
```
tuya.status(deviceId)
Response: { switch: boolean, online: boolean, ...outras propriedades }
```

### Controlar ar-condicionado
```
tuya.control(deviceId, {
  switch: true,
  mode: "cool"|"heat"|"fan",
  temperature: 16-30,
  fan_speed: "low"|"medium"|"high"|"auto"
})
```

### Listar todos os dispositivos
```
tuya.devices()
Response: [{ id, name, online, category }]
```

## Mapeamento de linguagem natural

| Usuário diz | Ação |
|-------------|------|
| "liga a luz da sala" | `tuya.control(luz_sala, { switch: true })` |
| "apaga tudo" | desligar todos os switches |
| "deixa a casa pronta" / "modo chegada" | ligar luz_sala, desligar ar se vazio |
| "modo sono" / "boa noite" | desligar todas as luzes, ar no 23°C |
| "qual o estado da sala" | `tuya.status(luz_sala)` + `tuya.status(ar_sala)` |
| "liga o ar a 22 graus" | `tuya.control(ar_sala, { switch: true, temperature: 22 })` |

## Cenas pré-definidas (implementar quando dispositivos estiverem vinculados)

- **Modo Trabalho:** luz_sala ligada, ar 22°C, sem distrações
- **Modo Filme:** luz_sala no mínimo, ar 23°C
- **Modo Sono:** tudo desligado exceto ar 24°C
- **Modo Saída:** tudo desligado
