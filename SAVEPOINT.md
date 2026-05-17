# SAVEPOINT — 2026-05-16

## Estado

MVP funcional. Phase 5 cerrada + 19 audits resueltos (AUDIT-11..29). End-to-end verificado por F5 manual: server arranca, sidebar carga, sesión se crea, prompt user aparece, respuesta LLM streamea token-a-token.

**Branch único `master`**. HEAD `e7a1b37`. Push a `origin/master` sincronizado.

## Cómo reanudar próxima sesión

### 1. Cleanup pendiente (haz esto antes de reabrir VSCodium)

Tras cerrar **TODAS** las ventanas de VSCodium y Claude Code, ejecuta:

```powershell
cd "D:\AGUSTIN\Portafolio\Proyectos\Proyecto Extension VSCodeVSCodium"
git worktree remove --force .claude/worktrees/wonderful-shamir-a3f245
git branch -D claude/wonderful-shamir-a3f245
git worktree prune

# Verifica
git worktree list   # solo raíz debe aparecer
git branch          # solo master
```

Si `git worktree remove` falla con "Filename too long", primero:
```powershell
git config core.longpaths true
Remove-Item -Recurse -Force ".claude\worktrees\wonderful-shamir-a3f245"
git worktree prune
git branch -D claude/wonderful-shamir-a3f245
```

### 2. Reabrir trabajo

```powershell
codium "D:\AGUSTIN\Portafolio\Proyectos\Proyecto Extension VSCodeVSCodium"
```

VSCodium abre en raíz. Branch activo = `master`.

### 3. Sesión Opus (Claude Code) — opcional

Solo si necesitas planear, auditar o resolver bloqueo. Razonamiento **high**. Prompt:

```
Lee AGENT.md, PLAN.md, BLOCKERS.md. Reanudamos sobre master.
[describe lo que necesitas]
```

### 4. Sesión Sonnet (VSCodium) — ejecución

Razonamiento **medium**. Prompt para la siguiente tarea:

```
Activa caveman (full) + cavecrew. Razonamiento medium.

Lee AGENT.md, BLOCKERS.md, PLAN.md (ESTADO ACTUAL).

Ejecuta Fase 6.1 ModelSelector. SOLO esa tarea, no 6.2-6.6.

Pasos:
1. Crear webview/lib/components/ModelSelector.svelte (dropdown Svelte 5, runes, onchange envía selectModel).
2. Integrar en Chat.svelte header al lado del "+".
3. Bridge handler 'selectModel' guarda en estado local.
4. Host sendPrompt usa modelo seleccionado (split provider/model).
5. listProviders desde OpenCodeClient debe poblar models[]. Si falla, hardcode mínimo ["opencode-go/deepseek-v4-pro"] para fallback.
6. pnpm verify exit 0.
7. F5 manual: dropdown aparece, cambiar modelo, send prompt usa modelo elegido (verificar en host log "modelID=...").
8. Commit + marca [x] en PLAN.md + update ESTADO ACTUAL.

Trabajar sobre master, NO crear worktrees.
Parar si Done when falla. Reportar a Opus si bug runtime.
```

## Próximas fases (orden recomendado por Opus)

1. **6.1 ModelSelector** — desbloquea elegir LLM (siguiente)
2. **Fase 8 Tools + Permission** — feature más "Claude Code-like" visualmente
3. **Fase 7 Editor integration** — selection→prompt, @-mention
4. **Fase 6.3-6.6 Sessions UI** — lista, rename, delete
5. **Fase 9 Polish** — markdown, scroll, empty state
6. **Fase 10 Release** — vsix + GitHub Release

## Decisiones técnicas registradas (NO re-investigar)

Ver `BLOCKERS.md` sección "Lecciones aprendidas" + `AGENT.md`:

- API: `fetch` crudo, NO `@opencode-ai/sdk`
- Auth: Basic `opencode:<UUID>`
- Spawn: `shell:true` Windows, `cwd: workspaceFolders[0]`, `--pure`
- Webview: `webview.asWebviewUri()` para asset base
- Svelte 5: event handlers lowercase obligatorio
- SSE: `payload.type` shape
- Schema canónico vivo: `GET /doc` del server

## Verify command

```powershell
pnpm verify    # typecheck host + webview + build, exit 0 obligatorio
```
