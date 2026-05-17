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

## AUDIT-28 RESUELTO ✓ (Opus emergencia, API schema): sendPrompt body shape + launch.json workspace

**Síntomas**:
1. Log host muestra `cwd=<none>` y server reporta `directory=C:\Program Files\VSCodium`. AUDIT-27 añadió `cwd: workspaceFolders[0]` pero ese array estaba vacío porque la ventana hija F5 abre sin folder.
2. Send prompt → server responde 400 `WARN service=server kind=Payload reason=Missing key at ["parts"] schema rejection`.

**Causas**:
1. `.vscode/launch.json` solo pasaba `--extensionDevelopmentPath`, no el folder a abrir. Extension Development Host arranca con workspace vacío.
2. `OpenCodeClient.sendPrompt` enviaba `{messages:[{role:'user',content:text}]}`. Schema real (`GET /doc`) requiere `{parts:[{type:'text',text}], model:{providerID, modelID}}`.

**Fixes**:
- `.vscode/launch.json` args: añadir `"${workspaceFolder}"` para que la ventana hija abra con el folder cargado.
- `OpenCodeClient.sendPrompt`: payload `{parts:[{type:'text',text}]}`; si llega `model="provider/model"`, split en `{providerID, modelID}`.
- Mejorar mensajes de error: `post()`/`get()` ahora incluyen body de la response en el error (300 chars) → debugging directo en host log.
- AGENT.md E.4 actualizada con shape canónico + apunta a `GET /doc` como fuente de verdad.

**Done when**: F5 abre ventana hija con worktree folder, `cwd=<worktree>` en log, send prompt no devuelve 400.

**Commit**: `fix: correct sendPrompt schema + open worktree in dev host`

---

## AUDIT-27 RESUELTO ✓ (Opus emergencia, server config): cwd + plugins externos

**Síntoma**: click "+" alcanza el server (log muestra `service=default creating instance`). Server intenta bootstrappear en `directory=C:\Program Files\VSCodium`. Después carga plugin `opencode-mobile@latest` que pide ngrok authtoken por stdin y se cuelga (stdin está en `'ignore'`).

**Causas**:
1. Spawn sin `cwd` → server usa cwd del extension host (binario VSCodium), no workspace folder.
2. Sin `--pure` → server carga plugins globales del usuario; algunos (opencode-mobile) bloquean en stdin esperando input interactivo.

**Fix**: en `OpenCodeServer.start`:
- Resolver `vscode.workspace.workspaceFolders?.[0]?.uri.fsPath` y pasar como `cwd`.
- Añadir `--pure` a args para skipear plugins externos.

AGENT.md E.5 actualizado.

**Done when**: crear sesión no cuelga, `service=project directory=<workspace>` en logs.

**Commit**: `fix: spawn opencode with workspace cwd and --pure`

---

## AUDIT-26 RESUELTO ✓ (Opus emergencia, Svelte 5): event handlers camelCase no disparan

**Síntoma**: webview carga, UI renderiza, input acepta texto. Botones "+" y "Send" no responden a click. Ctrl+Enter en textarea no envía.

**Causa**: Svelte 5 espera event handlers en lowercase (`onclick`, `oninput`, `onkeydown`). El código usaba camelCase tipo React (`onClick`, `onInput`, `onKeydown`). camelCase compila sin error/warning porque Svelte lo trata como atributo HTML arbitrario → handler nunca se registra.

Afectados:
- `Chat.svelte:26` (`onClick`)
- `InputBar.svelte:40-41,45` (`onInput`, `onKeydown`, `onClick`)

**Fix**: cambiar 4 ocurrencias a lowercase. AGENT.md F.4 actualizado con regla explícita para evitar regresión futura.

**Done when**: clic en "+" crea sesión visible, Send/Ctrl+Enter envía prompt.

**Commit**: `fix: use lowercase svelte 5 event handlers`

---

## AUDIT-25 RESUELTO ✓ (Opus emergencia, webview): asset URLs no resolvían

**Síntoma**: sidebar abre vacío (panel negro, sin contenido). Host log muestra activación completa, SSE conectado, `ChatViewProvider resolved`. Pero webview no renderiza.

**Causa**: `ChatViewProvider.resolveWebviewView` reescribía `src="./assets/..."` prepending `cspSource`. `cspSource` es identificador para CSP origin, NO base URL de recursos. Asset URLs resultantes (`https://*.vscode-webview.net/./assets/foo.js`) fallaban a cargar → script nunca corría → `mount(App)` nunca ejecutaba → div#app vacío.

**Fix**: usar `webview.asWebviewUri(Uri.file(distWebview))` como base. Reescribir cada `(src|href)="./..."` con `baseUri + relativa`. Log del baseUri en consola para debug futuro.

**Done when**: F5 muestra contenido webview ("Connected" tras handshake).

**Commit**: `fix: use asWebviewUri for webview asset base`

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
