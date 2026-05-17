# BLOCKERS.md

Estado: **Sesión 3 cerrada ✓ — Sesión 4 abierta (AUDIT-21 pendiente decisión).**

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

## Tarea AUDIT-21 (MEDIA, decisión usuario): SDK vs fetch crudo

**Causa**: `src/server/OpenCodeClient.ts` implementa endpoints con `fetch` crudo + type guards. AGENT.md B + E.1 listan `@opencode-ai/sdk ^1.1.18` como dep. Package.json NO lo tiene. Fase 2.3 marcada `[x]` con implementación divergente.

**Decisión usuario, NO Sonnet**:

A. **Mantener fetch crudo**: borrar `@opencode-ai/sdk` de AGENT.md tabla B y E.1. Menos bundle, control de errores, no acoplado a SDK 1.x.

B. **Adoptar SDK**: `pnpm add -D @opencode-ai/sdk@^1.1.18`, reescribir `OpenCodeClient.ts` con métodos del SDK. Types oficiales.

**Recomendación Opus**: A. SDK aún 1.x con churn alto. Fetch crudo funciona y type guards locales.

**Done when**: AGENT.md consistente con código (sin SDK si A), o SDK instalado + usado (B).

**Commit (A)**: `docs: drop @opencode-ai/sdk from agent spec`.

---

## Recordatorio flujo

`pnpm verify` antes de cada commit. Script ya en `package.json` (`pnpm typecheck && pnpm build`).

Si Sonnet detecta un bug fuera de PLAN.md mientras ejecuta una tarea: NO arreglar inline. Añadir entrada AUDIT-N aquí (formato igual a los anteriores) y reportar a Opus. Opus decide prioridad.

Si Sonnet termina todos los audits abiertos: NO empezar Fase 6 sin confirmación de Opus + usuario.
