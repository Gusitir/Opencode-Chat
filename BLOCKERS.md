# BLOCKERS.md

Estado: **TODO RESUELTO ✓ — MVP runtime funcional. Sin audits abiertos.**

Audiencia: **Sonnet (ejecutor)**. Opus añade bugs aquí cuando aparecen. Sonnet limpia uno por uno con commit individual. `pnpm verify` exit 0 antes de marcar resuelto.

---

## Audits cerrados — sesión 3 + emergencias Opus

| Audit | Tipo | Commit | Tema |
|---|---|---|---|
| AUDIT-11 | typecheck | `e3a058e` | unused uuid import |
| AUDIT-12 | typecheck | `e3a058e` | unused MessagePart import |
| AUDIT-13 | typecheck | `e3a058e` | tool_call status narrowing |
| AUDIT-14 | typecheck | `ed9e74b` | marked.use renderer |
| AUDIT-15 | typecheck | (cubierto AUDIT-14) | marked.parse async:false |
| AUDIT-16 | runtime | `5e3367c` | detect vscode theme via body class |
| AUDIT-17 | runtime | `6bbb2de` | stable each key |
| AUDIT-18 | runtime | `a94adfb` | status color tokens |
| AUDIT-19 | quality | `45d1c6f` | shared SessionMeta type |
| AUDIT-20 | quality | `2048c71` | TODO comment removed |
| AUDIT-21 | spec | (docs only) | SDK vs fetch crudo (opción A) |
| AUDIT-22 | runtime crítico | `b4d4c66` | drop "type":"module" para CJS extension host |
| AUDIT-23 | runtime crítico | `ecac7cb` | shell:true en Windows + health timeout 15s |
| AUDIT-24 | runtime crítico | `f4af722` | username Basic auth = `opencode` no `user` |
| AUDIT-25 | runtime crítico | `8d0e45a` | webview baseUri via asWebviewUri |
| AUDIT-26 | runtime crítico | `e3fe332` | Svelte 5 event handlers lowercase |
| AUDIT-27 | runtime crítico | `6385998` | cwd workspace + `--pure` flag |
| AUDIT-28 | API schema | `50813e1` | sendPrompt {parts:[{type:'text',text}]} + launch.json folder arg |
| AUDIT-29 | SSE schema | `b559e09` | bridge handler usa `payload.type` real shape |

`pnpm verify` exit 0 confirmado tras AUDIT-29.

F5 manual verificado: server arranca, sidebar carga, sesión se crea, prompt user aparece optimista, respuesta streamea token a token, session.idle cierra mensaje.

---

## Lecciones aprendidas (para futuras emergencias)

1. **`pnpm build` NO valida types** — esbuild solo strip-tipa. `pnpm verify` (typecheck + build) es la verdad. Reflejado en AGENT.md A.0.
2. **Windows + npm globals** — `child_process.spawn` necesita `shell:true` para resolver `.cmd` shims. Reflejado en AGENT.md E.5.
3. **OpenCode API schemas viven en `/doc`** — antes de cambiar payloads, consultar OpenAPI real. Reflejado en AGENT.md E.4.
4. **SSE events de opencode son `{payload:{type,properties}}`** — no shape custom. Reflejado en AGENT.md E.4.
5. **Svelte 5 NO acepta camelCase handlers** — `onclick` lowercase obligatorio. Reflejado en AGENT.md F.4.
6. **VSCode webview asset URLs requieren `webview.asWebviewUri()`** — `cspSource` solo sirve para CSP origin, NO base de recursos.

---

## Workflow para próximos audits

Si Sonnet detecta un bug fuera de PLAN.md durante una tarea:
1. NO arreglar inline.
2. Añadir entrada `AUDIT-N` aquí con: síntoma, causa, fix propuesto, done-when, commit message.
3. Reportar a Opus. Opus decide prioridad.

Si Sonnet termina todas las tareas activas de PLAN.md + audits: NO empezar siguiente fase sin confirmación de Opus + usuario.

`pnpm verify` antes de cada commit. Script ya en `package.json`.
