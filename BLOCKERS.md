# BLOCKERS.md

Estado: **Sesión 3 cerrada ✓ — AUDIT-21 resuelto (opción A) ✓ — Solo F5 manual pendiente antes de Fase 6.**

Audiencia: **Sonnet (ejecutor)**. Opus añade bugs aquí. Sonnet limpia uno por uno con commit individual. `pnpm verify` exit 0 antes de marcar resuelto.

---

## Resueltos (Sesión 3 — Sonnet)

`pnpm verify` exit 0 en master tras los siguientes commits:

| Audit | Commit | Notas |
|---|---|---|
| AUDIT-11 | `e3a058e fix: remove unused uuid/MessagePart imports + narrow tool_call status` | bundled con 12+13 |
| AUDIT-12 | `e3a058e` (bundled) | — |
| AUDIT-13 | `e3a058e` (bundled) | — |
| AUDIT-14 | `ed9e74b fix: use marked.use for partial renderer override` | — |
| AUDIT-15 | cubierto por AUDIT-14 | `marked.parse(..., {async:false})` |
| AUDIT-16 | `5e3367c fix: detect vscode theme via body class in codeblock` | — |
| AUDIT-17 | `6bbb2de fix: stable each key in message parts` | índice como key |
| AUDIT-18 | `a94adfb fix: update status color tokens for vscode semantic colors` | — |
| AUDIT-19 | `45d1c6f refactor: share SessionMeta type from messaging` | — |
| AUDIT-20 | `2048c71 chore: remove TODO comment from bridge` | — |

**Nota proceso**: Sonnet trabajó en `master` (worktree raíz) en vez del worktree `claude/wonderful-shamir-a3f245`. Trabajo válido, pero el commit `fc4d4c1 chore: switch to Opus plan + Sonnet exec workflow` (rename HAIKU_BLOCKERS → BLOCKERS, scripts verify, sec A.0+H+H.1) quedó en worktree. Opus mergeó master → worktree. Para próxima sesión Sonnet: clonar/abrir VSCodium contra el worktree del branch activo, no master.

**Verificación pendiente**: F5 manual (sidebar, Connected, newSession, prompt streaming, markdown highlight, tool_call badges). NO ejecutada porque requiere `opencode` CLI corriendo. Pasar antes de cerrar Fase 5 oficialmente.

---

## AUDIT-24 RESUELTO ✓ (Opus emergencia, auth): username Basic auth incorrecto

**Síntoma**: spawn OK, server escucha en `127.0.0.1:<port>`, log muestra `opencode server listening`. Pero `/global/health` retorna 401 → waitForHealth timeout 15s.

**Causa**: opencode 1.15.0 con `OPENCODE_SERVER_PASSWORD` set requiere Basic auth con username default `opencode`, no `user`. Documentación AGENT.md E.5 no especificaba username. Tres archivos usaban `user:${password}`:
- `src/server/OpenCodeServer.ts:90` (health check)
- `src/server/OpenCodeClient.ts:107` (HTTP API)
- `src/server/EventStream.ts:30` (SSE)

Verificación binaria opencode.exe expone `OPENCODE_SERVER_USERNAME` (override) y default `opencode`.

**Fix**: cambiar `user:${password}` → `opencode:${password}` en los 3 archivos. Actualizar AGENT.md E.5 con esquema auth explícito.

**Done when**: F5 activación pasa, OutputChannel muestra `OpenCode server health check passed`, sidebar carga "Connected".

**Commit**: `fix: use 'opencode' as basic auth username`

---

## AUDIT-23 RESUELTO ✓ (Opus emergencia, Windows): spawn no resuelve `.cmd` shims

**Síntoma**: F5 → activación falla con `OpenCode server health check failed after 10000ms`. CLI instalada (`opencode --version` → 1.15.0). Server arranca correctamente desde terminal manual.

**Causa**: en Windows, `npm install -g` crea shims `.cmd` (`opencode.cmd`). `child_process.spawn('opencode', args)` sin `shell: true` falla silente: Node no resuelve la extensión `.cmd` automáticamente. Proceso nunca arranca, OutputChannel no captura stdout/stderr porque no hay proceso.

**Fix**: `OpenCodeServer.ts:18` agregar `shell: process.platform === 'win32'` al options de spawn. También subir timeout de health de 10s a 15s (algunos Windows tardan en levantar DB + migrations).

**Done when**: F5 sin error de health, sidebar carga, OutputChannel muestra `opencode server listening on http://127.0.0.1:<port>`.

**Commit**: `fix: enable shell on windows spawn + bump health timeout`

---

## AUDIT-22 RESUELTO ✓ (Opus emergencia, runtime crítico): ESM/CJS mismatch en extension host

**Síntoma**: F5 abre Extension Development Host, activación de `Gusitir.opencode-chat` falla con:
```
ReferenceError: module is not defined in ES module scope
This file is being treated as an ES module because it has a '.js' file extension
and package.json contains "type": "module".
```

**Causa**: root `package.json` tenía `"type": "module"`. Esbuild emite `dist/extension.js` con `format: 'cjs'` (necesario porque VSCode extension host carga vía CommonJS `require`). Node 24 ve `.js` + `"type":"module"` → trata el bundle como ESM → falla en `module.exports`.

**Fix**: borrar `"type": "module"` de root `package.json`. Configs `.mjs` (esbuild, vite) ya son ESM por extensión explícita, no necesitan el flag. Webview lo bundlea Vite aparte.

**Done when**: F5 ya no muestra ReferenceError, sidebar carga.

**Commit**: `fix: drop type:module to keep extension host CJS-compatible`

---

## AUDIT-21 RESUELTO ✓ (opción A — fetch crudo)

Decisión usuario: mantener `fetch` crudo + type guards. SDK descartado por churn 1.x.

Aplicado en AGENT.md:
- Tabla B: línea SDK → `fetch nativo + type guards`
- E.1 devDependencies: `@opencode-ai/sdk` removido
- K Recursos: link SDK marcado como no usado

`pnpm verify` exit 0 post-edición.

---

## Recordatorio flujo

`pnpm verify` antes de cada commit. Script ya en `package.json` (`pnpm typecheck && pnpm build`).

Si Sonnet detecta un bug fuera de PLAN.md mientras ejecuta una tarea: NO arreglar inline. Añadir entrada AUDIT-N aquí (formato igual a los anteriores) y reportar a Opus. Opus decide prioridad.

Si Sonnet termina todos los audits abiertos: NO empezar Fase 6 sin confirmación de Opus + usuario.
