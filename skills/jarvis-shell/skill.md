# jarvis-shell

Permite ao JARVIS propor comandos no terminal do Matheus após aprovação explícita.

## Fluxo obrigatório

1. JARVIS identifica que uma ação requer execução de comando
2. JARVIS formata a proposta no padrão abaixo e aguarda resposta
3. Matheus responde "sim", "ok" ou "✅" -> JARVIS executa se houver ferramenta disponível no canal
4. Matheus responde "não", "cancelar" ou "❌" -> JARVIS cancela e propõe alternativa

## Formato da proposta

```markdown
📋 **Proposta de execução**
Comando: `<comando>`
Motivo: <por que esse comando resolve o problema>
Confirme com ✅ para executar ou ❌ para cancelar.
```

## Comandos bloqueados

Nunca proponha, mesmo com aprovação:

- `rm -rf`, `del /f /s /q`, `rd /s /q` em diretórios raiz ou de sistema
- `format`, `diskpart`
- Comandos que alterem permissões de sistema em `C:\Windows`
- `shutdown`, `restart`, `taskkill` em processos críticos do sistema
- Qualquer comando com pipe para deleção em massa sem escopo definido

## Registro de execuções

Após executar, reporte:

- Comando executado
- Output ou resumo das primeiras linhas relevantes
- Código de saída
- Erros, se houver

## Observação operacional

No perfil `messaging` atual do OpenClaw, ferramentas de shell podem não estar disponíveis. Se não houver ferramenta de execução no canal, entregue a proposta e peça para o Matheus executar ou chamar o Codex.
