# PLAN.md — Tareas atómicas para Claude Haiku

> **Antes de empezar**: leer `AGENT.md` completo. Ejecutar tareas en orden estricto. Una sola tarea por sesión si es necesario. Marcar `[x]` SOLO cuando `Done when` pasa. Hacer commit con el mensaje sugerido. Actualizar "ESTADO ACTUAL" al final.

Formato por tarea: `[ ] N.M Title` + `Goal:` + `Files:` + `Steps:` + `Done when:` + `Commit:`.

---

## Fase 0 — Bootstrap

### [x] 0.1 .gitignore + .vscodeignore + .npmrc
- **Files**: `.gitignore`, `.vscodeignore`, `.npmrc`
- **Steps**: `.gitignore` excluye `node_modules`, `dist`, `out`, `*.vsix`, `.vscode-test`, `coverage`. `.vscodeignore` excluye `src/**`, `webview/**`, `tests/**`, `tsconfig*.json`, `vite.config.ts`, `esbuild.config.mjs`, `svelte.config.js`, `.vscode/**`, `.github/**`. `.npmrc` contiene `auto-install-peers=true`.
- **Done when**: 3 archivos existen con contenido válido.
- **Commit**: `chore: add ignore files`

### [x] 0.2 package.json
- **Files**: `package.json`
- **Steps**: Copiar literalmente el bloque de la sección E.1 de `AGENT.md`.
- **Done when**: `pnpm install --lockfile-only` no falla.
- **Commit**: `chore: add package manifest`

### [x] 0.3 tsconfigs
- **Files**: `tsconfig.json` (base), `tsconfig.extension.json` (extends base, includes `src/**`, outDir `dist`, target `ES2022`, module `CommonJS`), `tsconfig.webview.json` (extends base, includes `webview/**`, target `ES2022`, module `ESNext`, moduleResolution `Bundler`).
- **Steps**: Base activa `strict`, `noUnusedLocals`, `noImplicitOverride`, `skipLibCheck`.
- **Done when**: `pnpm tsc -p tsconfig.extension.json --noEmit` y `pnpm tsc -p tsconfig.webview.json --noEmit` no fallan (con archivos placeholder mínimos).
- **Commit**: `chore: add tsconfig`

### [x] 0.4 esbuild.config.mjs
- **Files**: `esbuild.config.mjs`
- **Steps**: Exporta función `build({watch})` que llama a `esbuild.context` con: `entryPoints:['src/extension.ts']`, `bundle:true`, `platform:'node'`, `target:'node18'`, `format:'cjs'`, `external:['vscode']`, `outfile:'dist/extension.js'`, `sourcemap:true`.
- **Done when**: `node esbuild.config.mjs` genera `dist/extension.js` (con `src/extension.ts` placeholder vacío).
- **Commit**: `chore: add esbuild config`

### [x] 0.5 vite.config.ts + svelte.config.js
- **Files**: `vite.config.ts`, `svelte.config.js`
- **Steps**: `svelte.config.js` exporta `{ preprocess: vitePreprocess() }`. `vite.config.ts` usa `@sveltejs/vite-plugin-svelte`, `base: './'`, `build.outDir: 'dist/webview'`, `build.rollupOptions.input: 'webview/index.html'`, `build.emptyOutDir: true`.
- **Done when**: `pnpm vite build` genera `dist/webview/index.html` + assets (con `webview/index.html` placeholder).
- **Commit**: `chore: add vite + svelte config`

### [x] 0.6 .vscode/launch.json + tasks.json + extensions.json
- **Files**: `.vscode/launch.json`, `.vscode/tasks.json`, `.vscode/extensions.json`
- **Steps**: `launch.json` con config "Run Extension" tipo `extensionHost`, `args:['--extensionDevelopmentPath=${workspaceFolder}']`, `preLaunchTask:'build'`. `tasks.json` task `build` corre `pnpm build`. `extensions.json` recomienda `svelte.svelte-vscode`, `dbaeumer.vscode-eslint`.
- **Done when**: F5 en VSCode lanza Extension Development Host sin error (con scaffolding mínimo).
- **Commit**: `chore: add vscode debug config`

### [x] 0.7 Assets media
- **Files**: `media/icon.png` (placeholder 256x256, fondo plano #1e1e1e con texto "OC"), `media/activity-bar.svg` (24x24 monocromo simple, `fill="currentColor"`).
- **Steps**: Generar PNG con cualquier herramienta o crear placeholder válido. SVG simple (un cuadrado o burbuja de chat).
- **Done when**: Archivos existen y son válidos (`file` los reconoce como PNG/SVG).
- **Commit**: `chore: add icon assets`

### [x] 0.8 pnpm install
- **Steps**: Ejecutar `pnpm install`.
- **Done when**: Sin errores, `pnpm-lock.yaml` generado.
- **Commit**: `chore: install dependencies`

---

## Fase 1 — Extension host esqueleto

### [x] 1.1 Logger
- **Files**: `src/utils/logger.ts`
- **Steps**: Export `getLogger()` singleton que devuelve `vscode.window.createOutputChannel('Opencode Chat', { log: true })`. Métodos: `info(msg)`, `warn(msg)`, `error(msg, err?)`.
- **Done when**: Importable, no crashea.
- **Commit**: `feat: add logger utility`

### [x] 1.2 Config reader
- **Files**: `src/utils/config.ts`
- **Steps**: Export `getConfig()` lee `vscode.workspace.getConfiguration('opencodeChat')` y devuelve objeto tipado con `cliPath`, `serverPort`, `defaultModel`, `autoApproveTools`. Export `onConfigChange(cb)` que suscribe a `onDidChangeConfiguration`.
- **Done when**: Compila sin warnings.
- **Commit**: `feat: add config reader`

### [x] 1.3 extension.ts entrypoint
- **Files**: `src/extension.ts`
- **Steps**: Export `activate(context)` y `deactivate()`. En `activate`: instanciar logger, registrar `ChatViewProvider` con `vscode.window.registerWebviewViewProvider('opencodeChat.view', provider)`, registrar comandos de la sección E.1 de `AGENT.md` (placeholders por ahora).
- **Done when**: F5 abre Extension Development Host, panel "Opencode Chat" aparece en activity bar.
- **Commit**: `feat: register extension activation`

### [x] 1.4 ChatViewProvider esqueleto
- **Files**: `src/providers/ChatViewProvider.ts`
- **Steps**: Clase implements `vscode.WebviewViewProvider`. Método `resolveWebviewView` carga HTML desde `dist/webview/index.html`, reescribe paths a `webview.asWebviewUri`, inyecta CSP de E.3 de `AGENT.md`, inyecta nonce en `<script>`.
- **Done when**: Sidebar muestra el HTML del webview.
- **Commit**: `feat: chat view provider scaffold`

### [x] 1.5 Webview "Hello"
- **Files**: `webview/index.html`, `webview/main.ts`, `webview/App.svelte`
- **Steps**: `index.html` con `<div id="app"></div>` + `<script type="module" src="/main.ts">`. `main.ts` monta `App` con `mount(App, { target: document.getElementById('app')! })`. `App.svelte` muestra "Opencode Chat — initializing…".
- **Done when**: Sidebar muestra el texto.
- **Commit**: `feat: minimal svelte webview`

---

## Fase 2 — Server lifecycle

### [x] 2.1 OpenCodeServer.start/stop
- **Files**: `src/server/OpenCodeServer.ts`
- **Steps**: Clase con `start(): Promise<{port:number, password:string}>` que: obtiene puerto libre (helper interno usando `net.createServer().listen(0)`), genera UUID password, spawnea `child_process.spawn(cfg.cliPath, ['serve','--port',String(port),'--hostname','127.0.0.1'], { env: { ...process.env, OPENCODE_SERVER_PASSWORD: password }, stdio:['ignore','pipe','pipe'] })`. Loguea stdout/stderr al logger. Polling a `GET /global/health` hasta 200 (timeout 10s). Método `stop()` envía `SIGTERM`.
- **Done when**: Llamado desde `activate()`, OutputChannel muestra logs del server y healthcheck pasa.
- **Commit**: `feat: spawn opencode server lifecycle`

### [x] 2.2 Detección de CLI faltante
- **Files**: `src/server/OpenCodeServer.ts` (extender), `src/commands/installOpenCode.ts`
- **Steps**: Si `spawn` falla con `ENOENT`, mostrar `vscode.window.showErrorMessage('OpenCode CLI not found', 'Install Guide')` que abre https://opencode.ai/docs/. Registrar comando `opencodeChat.installCli` que también abre esa URL.
- **Done when**: Renombrar `cliPath` a inválido reproduce el mensaje.
- **Commit**: `feat: detect missing opencode cli`

### [ ] 2.3 OpenCodeClient wrapper
- **Files**: `src/server/OpenCodeClient.ts`
- **Steps**: Constructor recibe `{baseUrl, password}`. Instancia `@opencode-ai/sdk` client. Métodos: `createSession()`, `sendPrompt(sessionId, text, model)`, `listProviders()`, `findFiles(query)`. Cada método wrapea errores en `OpenCodeError`.
- **Done when**: Test manual: crear sesión devuelve id.
- **Commit**: `feat: opencode sdk client wrapper`

### [ ] 2.4 EventStream SSE
- **Files**: `src/server/EventStream.ts`
- **Steps**: Clase que abre `EventSource` (usar `eventsource` package o `undici` fetch streaming) contra `/global/event` con header `Authorization: Basic ...`. Emite eventos vía `EventEmitter`. Reconexión exponencial (1s, 2s, 4s, max 30s) al desconectar.
- **Done when**: Al crear sesión por la API, el listener recibe al menos un evento.
- **Commit**: `feat: sse event stream client`

### [ ] 2.5 Lifecycle en activate/deactivate
- **Files**: `src/extension.ts` (extender)
- **Steps**: En `activate`: `await server.start()`, instanciar `OpenCodeClient` y `EventStream`, pasarlos al `ChatViewProvider`. En `deactivate`: cerrar stream y matar server.
- **Done when**: Cerrar VSCode mata el proceso `opencode serve` (verificar con `tasklist` en Windows o `ps` en Linux/Mac).
- **Commit**: `feat: wire server lifecycle to extension`

---

## Fase 3 — Bridge Webview ↔ Host

### [ ] 3.1 Tipos compartidos
- **Files**: `src/messaging/types.ts`
- **Steps**: Copiar literalmente E.2 de `AGENT.md`.
- **Done when**: Compila.
- **Commit**: `feat: webview/host message types`

### [ ] 3.2 Bridge handler en host
- **Files**: `src/messaging/bridge.ts`
- **Steps**: Función `createBridge(webview, deps)` retorna `{post(msg: HostToWebview)}`. Suscribe `webview.onDidReceiveMessage` y hace `switch(msg.type)` exhaustivo invocando handlers (placeholders por ahora, salvo `ready` que responde con `state`).
- **Done when**: Al cargar el webview, host loguea "ready received".
- **Commit**: `feat: webview message bridge`

### [ ] 3.3 API webview
- **Files**: `webview/lib/api/vscode.ts`
- **Steps**: Export `vscode` = `acquireVsCodeApi()` cacheado. Export `send(msg: WebviewToHost)` y `on<T extends HostToWebview['type']>(type, cb)` con tipos discriminados. Mantener registry de listeners.
- **Done when**: Importable desde `App.svelte`, sin errores TS.
- **Commit**: `feat: typed webview <-> host api`

### [ ] 3.4 Ready handshake
- **Files**: `webview/App.svelte`, `src/messaging/bridge.ts`
- **Steps**: En `App.svelte` `onMount` enviar `{type:'ready'}`. Host responde con `state` (mock vacío). App renderiza "Connected".
- **Done when**: Sidebar muestra "Connected" tras cargar.
- **Commit**: `feat: ready handshake`

---

## Fase 4 — UI Chat MVP

### [ ] 4.1 Theme variables
- **Files**: `webview/lib/styles/theme.css`, `webview/lib/styles/global.css`
- **Steps**: `theme.css` mapea `--vscode-editor-background` → `--bg`, foreground → `--fg`, button bg/fg, input bg/fg, focusBorder, etc. `global.css` aplica reset minimal + box-sizing + font del editor.
- **Done when**: Cambiar tema VSCode actualiza colores del sidebar.
- **Commit**: `feat: theme tokens`

### [ ] 4.2 InputBar
- **Files**: `webview/lib/components/InputBar.svelte`
- **Steps**: `<textarea>` auto-resize (hasta 10 líneas, luego scroll). Botón send. Shortcut Cmd/Ctrl+Enter dispara send. Disabled si `streaming === true` (prop).
- **Done when**: Tipear texto, Enter inserta newline, Ctrl+Enter envía (loguea por ahora).
- **Commit**: `feat: input bar component`

### [ ] 4.3 Message
- **Files**: `webview/lib/components/Message.svelte`
- **Steps**: Props `role: 'user'|'assistant'`, `parts: MessagePart[]`. Renderiza con clases distintas por rol (alineación, color sutil). Texto vía markdown renderer (placeholder devuelve `text` plano por ahora).
- **Done when**: Mock de 2 mensajes se ven distintos según rol.
- **Commit**: `feat: message bubble component`

### [ ] 4.4 MessageList
- **Files**: `webview/lib/components/MessageList.svelte`
- **Steps**: Recibe `messages` (rune `$state`). `$effect` que auto-scrollea al final si el user está cerca del bottom (>200px del fondo NO auto-scrollea).
- **Done when**: Añadir mensaje al store hace scroll al final.
- **Commit**: `feat: message list with auto-scroll`

### [ ] 4.5 Markdown renderer
- **Files**: `webview/lib/markdown/renderer.ts`, `webview/lib/markdown/CodeBlock.svelte`
- **Steps**: `renderer.ts` usa `marked` con custom renderer para code blocks → emite tag `<pre data-lang="...">`. `CodeBlock.svelte` recibe `code`, `lang`, usa `shiki` con tema `vitesse-dark`/`vitesse-light` según preferencia VSCode. Sanitizar con allowlist (marked v14 incluye opciones).
- **Done when**: Mensaje con bloque ```ts ... ``` se highlightea correctamente.
- **Commit**: `feat: markdown + shiki rendering`

### [ ] 4.6 Chat compose
- **Files**: `webview/lib/components/Chat.svelte`, `webview/App.svelte`
- **Steps**: `Chat.svelte` compone `<MessageList/>` + `<InputBar/>` con layout flex column, input pegado abajo.
- **Done when**: Sidebar muestra layout chat completo con mensajes mock.
- **Commit**: `feat: chat layout composition`

### [ ] 4.7 Stores Svelte
- **Files**: `webview/lib/stores/session.svelte.ts`, `webview/lib/stores/messages.svelte.ts`, `webview/lib/stores/config.svelte.ts`
- **Steps**: Cada uno exporta clase con propiedades `$state`. Singleton vía `export const X = new XStore()`.
- **Done when**: Stores accesibles desde componentes, reactividad funciona.
- **Commit**: `feat: svelte 5 reactive stores`

---

## Fase 5 — Conectar chat al server

### [ ] 5.1 New session flow
- **Files**: `src/messaging/bridge.ts`, `webview/lib/components/Chat.svelte`
- **Steps**: Webview envía `newSession` → host llama `client.createSession()` → host responde `state` con la sesión nueva como current.
- **Done when**: Click en "+" crea sesión, sidebar muestra id.
- **Commit**: `feat: create session flow`

### [ ] 5.2 Send prompt
- **Files**: `src/messaging/bridge.ts`
- **Steps**: Handler `sendPrompt` llama `client.sendPrompt(sessionId, text, model)`. La respuesta NO se espera completa — se confía en SSE.
- **Done when**: Enviar prompt no bloquea, OutputChannel muestra evento del server.
- **Commit**: `feat: send prompt to server`

### [ ] 5.3 Stream events → webview
- **Files**: `src/messaging/bridge.ts`, `src/server/EventStream.ts`
- **Steps**: Suscribir a eventos del stream, filtrar por tipos relevantes (message part updated/done), transformar a `messageDelta`/`messageDone` y postear al webview.
- **Done when**: Prompt "hola" produce respuesta streameada token a token.
- **Commit**: `feat: forward sse to webview`

### [ ] 5.4 Renderizado incremental
- **Files**: `webview/lib/stores/messages.svelte.ts`, `webview/lib/components/MessageList.svelte`
- **Steps**: Handler `messageDelta` hace upsert de parts en el mensaje. Reactividad redibuja sin parpadeo.
- **Done when**: Visualmente fluido, sin saltos.
- **Commit**: `feat: incremental render`

### [ ] 5.5 Thinking indicator
- **Files**: `webview/lib/components/MessageList.svelte`
- **Steps**: Si último mensaje es user sin respuesta assistant aún, mostrar burbuja "thinking…" con 3 puntos animados.
- **Done when**: Aparece y desaparece correctamente.
- **Commit**: `feat: thinking indicator`

### [ ] 5.6 Abort + errores
- **Files**: `webview/lib/components/InputBar.svelte`, `src/messaging/bridge.ts`
- **Steps**: Durante streaming, botón send se convierte en "stop" que envía `abort`. Host cancela request. Errores del SDK se postean como `error` y se renderizan como banner rojo arriba del input.
- **Done when**: Click stop interrumpe, errores se muestran.
- **Commit**: `feat: abort and error handling`

---

## Fase 6 — Modelos y sesiones

### [ ] 6.1 ModelSelector
- **Files**: `webview/lib/components/ModelSelector.svelte`
- **Steps**: Dropdown poblado de `state.models`. Onchange envía `selectModel`.
- **Done when**: Cambio refleja en `state.selectedModel`.
- **Commit**: `feat: model selector`

### [ ] 6.2 Persistir modelo
- **Files**: `src/providers/ChatViewProvider.ts`
- **Steps**: Guardar modelo seleccionado en `context.globalState` con key `selectedModel`. Restaurar al arrancar.
- **Done when**: Reiniciar VSCode mantiene selección.
- **Commit**: `feat: persist model selection`

### [ ] 6.3 SessionList component
- **Files**: `webview/lib/components/SessionList.svelte`
- **Steps**: Lista de sesiones con nombre + timestamp + botones rename/delete. Click selecciona.
- **Done when**: Cambio de sesión refresca mensajes.
- **Commit**: `feat: session list ui`

### [ ] 6.4 SessionStore
- **Files**: `src/providers/SessionStore.ts`
- **Steps**: CRUD sobre `context.workspaceState` key `sessions`. Funciones `list()`, `get(id)`, `create(meta)`, `update(id, patch)`, `delete(id)`.
- **Done when**: Sesiones persisten entre reloads del workspace.
- **Commit**: `feat: session persistence`

### [ ] 6.5 Rename
- **Files**: `webview/lib/components/SessionList.svelte`, `src/messaging/bridge.ts`
- **Steps**: Doble click activa input inline. Enter guarda. Envía `renameSession`.
- **Done when**: Nombre persiste.
- **Commit**: `feat: rename sessions`

### [ ] 6.6 Delete con confirmación
- **Files**: `webview/lib/components/SessionList.svelte`
- **Steps**: Botón X muestra confirmación nativa VSCode (`vscode.window.showWarningMessage` via host).
- **Done when**: Sesión eliminada desaparece, sin posibilidad de undo.
- **Commit**: `feat: delete sessions`

---

## Fase 7 — Integración editor

### [ ] 7.1 addSelectionToPrompt
- **Files**: `src/commands/addSelectionToPrompt.ts`
- **Steps**: Toma `editor.document.uri`, `editor.selection`. Construye `@<relativePath>:<startLine>-<endLine>` + bloque con la selección. Envía al webview vía mensaje `appendToInput`.
- **Done when**: Comando inserta texto en el input.
- **Commit**: `feat: add selection to prompt`

### [ ] 7.2 Menú contextual
- **Files**: `package.json` (ya tiene)
- **Steps**: Validar que aparece "Opencode: Add Selection to Prompt" al right-click con selección.
- **Done when**: Visible y funcional.
- **Commit**: `chore: verify context menu`

### [ ] 7.3 Botón editor title
- **Files**: `package.json`
- **Steps**: Añadir entrada a `menus['editor/title']` con `command: opencodeChat.openChat`, `group: 'navigation'`.
- **Done when**: Icono visible en barra del editor.
- **Commit**: `feat: editor title button`

### [ ] 7.4 @-mention picker
- **Files**: `webview/lib/components/InputBar.svelte`, `webview/lib/components/FilePill.svelte`
- **Steps**: Detectar `@` en cursor, abrir dropdown. Envía `findFiles` al host con query parcial. Renderizar resultados. Selección reemplaza el `@xxx` por pill no editable.
- **Done when**: Funciona con archivos del workspace.
- **Commit**: `feat: @ mention file picker`

### [ ] 7.5 Abrir archivos desde el chat
- **Files**: `webview/lib/markdown/renderer.ts`
- **Steps**: Custom renderer para links `file:` o paths relativos → click envía `openFile` con path y line. Host hace `vscode.commands.executeCommand('vscode.open', uri)` + `revealRange`.
- **Done when**: Click en filepath abre el archivo en la línea correcta.
- **Commit**: `feat: open files from chat`

---

## Fase 8 — Tools y permisos

### [ ] 8.1 ToolCall component
- **Files**: `webview/lib/components/ToolCall.svelte`
- **Steps**: Collapsable card. Header: icono + nombre + status badge. Body: input JSON pretty + output. Status colors: running (amarillo), done (verde), error (rojo).
- **Done when**: Mock de 3 tool calls se ven bien.
- **Commit**: `feat: tool call ui`

### [ ] 8.2 PermissionDialog
- **Files**: `webview/lib/components/PermissionDialog.svelte`
- **Steps**: Banner inline arriba del input con tool name, input pretty, 3 botones (Allow, Allow Always, Deny). Envía `permissionResponse`.
- **Done when**: Mostrado al recibir `permissionRequest`.
- **Commit**: `feat: permission dialog`

### [ ] 8.3 Handler permisos
- **Files**: `src/messaging/bridge.ts`, `src/server/EventStream.ts`
- **Steps**: Filtrar eventos de permission del SSE, forward al webview. Recibir respuesta y llamar al endpoint correspondiente del server.
- **Done when**: Flujo end-to-end aprueba/rechaza una herramienta.
- **Commit**: `feat: wire permission flow`

### [ ] 8.4 Auto-approve
- **Files**: `src/messaging/bridge.ts`
- **Steps**: Si tool name está en `config.autoApproveTools`, responder allow automáticamente sin mostrar dialog. "Allow Always" añade a settings.
- **Done when**: Settings se actualiza, próximo permiso del mismo tool no muestra dialog.
- **Commit**: `feat: auto-approve persistence`

---

## Fase 9 — Polish y QA

### [ ] 9.1 Test temas
- **Steps**: Probar manualmente Light+, Dark+, High Contrast. Verificar contraste y legibilidad.
- **Done when**: Sin glitches visuales en los 3 temas.
- **Commit**: `style: theme compatibility fixes`

### [ ] 9.2 Empty state
- **Files**: `webview/lib/components/Chat.svelte`
- **Steps**: Si no hay sesiones, mostrar ilustración SVG simple + texto "Start a new chat" + botón.
- **Done when**: Estado inicial limpio.
- **Commit**: `feat: empty state`

### [ ] 9.3 Loading states
- **Files**: `webview/App.svelte`
- **Steps**: Skeleton del chat mientras `state` no llega.
- **Done when**: Nunca aparece UI rota al cargar.
- **Commit**: `feat: loading skeletons`

### [ ] 9.4 Settings completos
- **Files**: `package.json`
- **Steps**: Validar que todas las settings de la sección G de `AGENT.md` están expuestas con descripciones claras.
- **Done when**: Visible en VSCode Settings UI.
- **Commit**: `chore: finalize settings`

### [ ] 9.5 README
- **Files**: `README.md`
- **Steps**: Reescribir con secciones: Overview, Screenshots (placeholders), Requirements (OpenCode CLI installed), Installation, Configuration, Usage, Troubleshooting (CLI not found, port busy, auth), License.
- **Done when**: Renderiza bien en GitHub.
- **Commit**: `docs: expand readme`

### [ ] 9.6 CHANGELOG
- **Files**: `CHANGELOG.md`
- **Steps**: Formato Keep a Changelog. Versión 0.1.0 con lista de features.
- **Done when**: Existe.
- **Commit**: `docs: add changelog`

### [ ] 9.7 Unit tests
- **Files**: `tests/unit/SessionStore.test.ts`, `tests/unit/OpenCodeClient.test.ts`
- **Steps**: Vitest. Mock `vscode` module. Cubrir CRUD de SessionStore y métodos básicos del client (con fetch mockeado).
- **Done when**: `pnpm test` pasa.
- **Commit**: `test: unit tests`

### [ ] 9.8 E2E test
- **Files**: `tests/e2e/extension.test.ts`
- **Steps**: `@vscode/test-electron` arranca instancia, activa extensión, verifica que el comando `opencodeChat.openChat` está registrado y el view existe.
- **Done when**: `pnpm test:e2e` pasa.
- **Commit**: `test: e2e smoke`

---

## Fase 10 — Release

### [ ] 10.1 Package vsix
- **Steps**: `pnpm package`. Verificar tamaño < 5MB.
- **Done when**: `opencode-chat-0.1.0.vsix` generado.
- **Commit**: (no commit)

### [ ] 10.2 QA manual interno
- **Steps**: Instalar vsix en VSCodium limpio. Checklist:
  - [ ] Extensión activa al abrir
  - [ ] Sidebar visible
  - [ ] Server spawneado (ps/tasklist muestra `opencode serve`)
  - [ ] Crear sesión OK
  - [ ] Enviar prompt + streaming OK
  - [ ] Model selector OK
  - [ ] @mention OK
  - [ ] Tool call render OK
  - [ ] Permission dialog OK
  - [ ] Cerrar VSCodium mata el server (no proceso huérfano)
- **Done when**: Todo el checklist pasa.
- **Commit**: (no commit)

### [ ] 10.3 Pruebas de usuario (BLOQUEANTE)
- **Steps**: Entregar el .vsix al usuario (Gusitir). Esperar feedback en GitHub Issues. NO publicar hasta que el usuario apruebe explícitamente.
- **Done when**: Usuario escribe "aprobado para release" o equivalente.
- **Commit**: (no commit)

### [ ] 10.4 Iterar feedback
- **Steps**: Por cada issue del usuario crear sub-tareas y resolverlas.
- **Done when**: Usuario confirma cierre de issues.
- **Commit**: `fix: address user feedback` (uno por tema)

### [ ] 10.5 GitHub Release
- **Steps**: Pedir permiso al usuario. Si OK: `git tag v0.1.0`, push, crear release en GitHub con notas del CHANGELOG y adjuntar el .vsix.
- **Done when**: Release visible en GitHub.
- **Commit**: (tag)

### [ ] 10.6 Open VSX publish
- **Steps**: Pedir permiso. Si usuario tiene `OVSX_PAT`: `pnpm publish:ovsx`. Si no, pausar.
- **Done when**: Visible en open-vsx.org.
- **Commit**: (no commit)

### [ ] 10.7 VS Marketplace publish
- **Steps**: Pedir permiso. Si usuario tiene PAT de Azure DevOps: `pnpm publish:vsce`. Si no, pausar.
- **Done when**: Visible en marketplace.visualstudio.com.
- **Commit**: (no commit)

---

## ESTADO ACTUAL (Haiku actualiza esto al final de cada sesión)

- **Fase**: 2 (Phase 1 complete, Phase 2 in progress)
- **Última tarea completada**: 2.2 (Detección de CLI faltante)
- **Próxima tarea**: AUDIT-1..AUDIT-4 (ver HAIKU_BLOCKERS.md), después 2.3 (OpenCodeClient wrapper)
- **Tareas completadas**: 0.1-0.8, 1.1-1.5, 2.1-2.2 (15 tareas)
- **Bloqueos**: auditoría Opus detectó 3 bugs runtime + 1 limpieza — listados en HAIKU_BLOCKERS.md
- **Fecha último update**: 2026-05-16 (audit Opus)
