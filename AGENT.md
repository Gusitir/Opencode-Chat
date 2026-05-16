# AGENT.md — Contexto persistente para Claude Haiku

> **LEE ESTE ARCHIVO COMPLETO AL INICIO DE CADA SESIÓN.** Es la fuente de verdad. NO interpretar, NO improvisar, NO añadir features no listadas. Las tareas a ejecutar viven en `PLAN.md`.

---

## A. PROYECTO

- **Nombre paquete**: `opencode-chat`
- **Display name**: `Opencode Chat`
- **Publisher**: `Gusitir`
- **Repo**: https://github.com/Gusitir/Opencode-Chat
- **License**: MIT (ya existe)
- **Objetivo**: Panel lateral de chat en VSCode/VSCodium que habla con el agente OpenCode vía su server local. UI tipo Claude Code / Cursor.
- **NO objetivos**: NO wrappear la TUI. NO competir con la extensión oficial `sst-dev.opencode`. NO soportar VSCode < 1.85.

## B. STACK (versiones EXACTAS, no actualizar sin pedir)

| Capa | Tecnología | Versión |
|---|---|---|
| Lenguaje | TypeScript | `^5.6.0` |
| Package manager | pnpm | `^9.0.0` |
| Extension host bundler | esbuild | `^0.24.0` |
| Webview framework | Svelte | `^5.0.0` |
| Webview bundler | Vite | `^5.4.0` |
| Svelte+Vite plugin | `@sveltejs/vite-plugin-svelte` | `^4.0.0` |
| OpenCode SDK | `@opencode-ai/sdk` | `^1.1.18` |
| Markdown | `marked` | `^14.1.0` |
| Syntax highlight | `shiki` | `^1.22.0` |
| Test unit | `vitest` | `^2.1.0` |
| Test E2E | `@vscode/test-electron` | `^2.4.0` |
| Tipos VSCode | `@types/vscode` | `^1.85.0` |
| Publish CLI | `@vscode/vsce` `ovsx` | últimas |
| Node engine | `>=18.0.0` | — |
| VSCode engine | `^1.85.0` | — |

## C. ARQUITECTURA

```
+--------------------------------------+
|  VSCode/VSCodium Window              |
|  +------------+  +----------------+  |
|  | Activity   |  | Sidebar Webview|  |
|  | Bar Icon   |  |  (Svelte 5)    |  |
|  +-----+------+  +--------+-------+  |
|        |                  |          |
|        +---postMessage----+          |
|                  |                   |
|        +---------v---------+         |
|        | Extension Host    |         |
|        | (Node.js, TS)     |         |
|        +---------+---------+         |
+------------------|-------------------+
                   | HTTP + SSE (loopback)
                   v
         +-----------------------+
         | opencode serve        |  <- proceso hijo spawneado
         | localhost:<random>    |
         +-----------+-----------+
                     | calls
                     v
              LLM provider (Anthropic/OpenAI/etc.)
```

## D. ESTRUCTURA DE ARCHIVOS (crear TODOS exactamente con estos paths)

```
Opencode-Chat/
├── AGENT.md
├── PLAN.md
├── README.md
├── CHANGELOG.md
├── LICENSE                       (ya existe — NO tocar)
├── .gitignore
├── .vscodeignore
├── .npmrc
├── package.json
├── tsconfig.json
├── tsconfig.extension.json
├── tsconfig.webview.json
├── esbuild.config.mjs
├── vite.config.ts
├── svelte.config.js
├── .vscode/launch.json
├── .vscode/tasks.json
├── .vscode/extensions.json
├── media/icon.png                (256x256, placeholder ok)
├── media/activity-bar.svg        (24x24 monocromo, fill="currentColor")
├── src/extension.ts
├── src/server/OpenCodeServer.ts
├── src/server/OpenCodeClient.ts
├── src/server/EventStream.ts
├── src/providers/ChatViewProvider.ts
├── src/providers/SessionStore.ts
├── src/commands/openChat.ts
├── src/commands/newSession.ts
├── src/commands/addSelectionToPrompt.ts
├── src/commands/installOpenCode.ts
├── src/messaging/types.ts
├── src/messaging/bridge.ts
├── src/utils/logger.ts
├── src/utils/config.ts
├── webview/index.html
├── webview/main.ts
├── webview/App.svelte
├── webview/lib/api/vscode.ts
├── webview/lib/stores/session.svelte.ts
├── webview/lib/stores/messages.svelte.ts
├── webview/lib/stores/config.svelte.ts
├── webview/lib/components/Chat.svelte
├── webview/lib/components/MessageList.svelte
├── webview/lib/components/Message.svelte
├── webview/lib/components/InputBar.svelte
├── webview/lib/components/ModelSelector.svelte
├── webview/lib/components/SessionList.svelte
├── webview/lib/components/PermissionDialog.svelte
├── webview/lib/components/ToolCall.svelte
├── webview/lib/components/FilePill.svelte
├── webview/lib/markdown/renderer.ts
├── webview/lib/markdown/CodeBlock.svelte
├── webview/lib/styles/theme.css
├── webview/lib/styles/global.css
├── tests/unit/SessionStore.test.ts
├── tests/unit/OpenCodeClient.test.ts
└── tests/e2e/extension.test.ts
```

**Reglas estrictas**:
- NO crear archivos no listados sin pedir permiso al usuario.
- NO renombrar paths.
- Toda función `export`-ada va en su propio archivo si supera 100 LOC.

## E. CONTRATOS Y BOILERPLATE (copiar textualmente)

### E.1 `package.json` — manifest base
```json
{
  "name": "opencode-chat",
  "displayName": "Opencode Chat",
  "description": "Native chat UI for OpenCode AI coding agent",
  "version": "0.1.0",
  "publisher": "Gusitir",
  "engines": { "vscode": "^1.85.0", "node": ">=18.0.0" },
  "categories": ["AI", "Chat", "Other"],
  "icon": "media/icon.png",
  "repository": { "type": "git", "url": "https://github.com/Gusitir/Opencode-Chat.git" },
  "license": "MIT",
  "main": "./dist/extension.js",
  "activationEvents": ["onView:opencodeChat.view"],
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        { "id": "opencodeChat", "title": "Opencode Chat", "icon": "media/activity-bar.svg" }
      ]
    },
    "views": {
      "opencodeChat": [
        { "id": "opencodeChat.view", "name": "Chat", "type": "webview" }
      ]
    },
    "commands": [
      { "command": "opencodeChat.openChat", "title": "Opencode: Open Chat" },
      { "command": "opencodeChat.newSession", "title": "Opencode: New Session" },
      { "command": "opencodeChat.addSelectionToPrompt", "title": "Opencode: Add Selection to Prompt" },
      { "command": "opencodeChat.installCli", "title": "Opencode: Install CLI" }
    ],
    "menus": {
      "editor/context": [
        { "command": "opencodeChat.addSelectionToPrompt", "when": "editorHasSelection", "group": "1_modification" }
      ]
    },
    "configuration": {
      "title": "Opencode Chat",
      "properties": {
        "opencodeChat.cliPath": { "type": "string", "default": "opencode", "description": "Path to opencode binary" },
        "opencodeChat.serverPort": { "type": "number", "default": 0, "description": "0 = random free port" },
        "opencodeChat.defaultModel": { "type": "string", "default": "", "description": "provider/model format" },
        "opencodeChat.autoApproveTools": { "type": "array", "items": { "type": "string" }, "default": [] }
      }
    }
  },
  "scripts": {
    "build:host": "esbuild ./src/extension.ts --bundle --platform=node --target=node18 --external:vscode --format=cjs --outfile=dist/extension.js",
    "build:webview": "vite build",
    "build": "pnpm build:host && pnpm build:webview",
    "watch:host": "pnpm build:host --watch",
    "watch:webview": "vite build --watch",
    "dev": "pnpm build && concurrently \"pnpm watch:host\" \"pnpm watch:webview\"",
    "test": "vitest run",
    "test:e2e": "node ./out/tests/runE2E.js",
    "package": "vsce package --no-dependencies",
    "publish:vsce": "vsce publish --no-dependencies",
    "publish:ovsx": "ovsx publish --no-dependencies"
  },
  "devDependencies": {
    "@opencode-ai/sdk": "^1.1.18",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "@types/node": "^18.0.0",
    "@types/vscode": "^1.85.0",
    "@vscode/test-electron": "^2.4.0",
    "@vscode/vsce": "latest",
    "concurrently": "^8.0.0",
    "esbuild": "^0.24.0",
    "marked": "^14.1.0",
    "ovsx": "latest",
    "shiki": "^1.22.0",
    "svelte": "^5.0.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

> Nota: todas las libs van en `devDependencies` porque `vsce package --no-dependencies` skipea node_modules y todo se bundlea (esbuild para el host, Vite para el webview). NO mover a `dependencies` sin permiso.

### E.2 Contrato mensajes Webview ↔ Host (`src/messaging/types.ts`)
```ts
// Webview -> Host
export type WebviewToHost =
  | { type: 'ready' }
  | { type: 'sendPrompt'; sessionId: string; text: string; attachments?: string[] }
  | { type: 'newSession' }
  | { type: 'switchSession'; sessionId: string }
  | { type: 'deleteSession'; sessionId: string }
  | { type: 'renameSession'; sessionId: string; name: string }
  | { type: 'selectModel'; provider: string; model: string }
  | { type: 'abort'; sessionId: string }
  | { type: 'permissionResponse'; requestId: string; decision: 'allow' | 'allow_always' | 'deny' }
  | { type: 'findFiles'; query: string; requestId: string }
  | { type: 'openFile'; path: string; line?: number }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string };

// Host -> Webview
export type HostToWebview =
  | { type: 'state'; sessions: SessionMeta[]; currentSessionId: string | null; models: ModelInfo[]; selectedModel: { provider: string; model: string } | null }
  | { type: 'messageDelta'; sessionId: string; messageId: string; part: MessagePart }
  | { type: 'messageDone'; sessionId: string; messageId: string }
  | { type: 'permissionRequest'; requestId: string; toolName: string; input: unknown }
  | { type: 'findFilesResult'; requestId: string; results: { path: string; name: string }[] }
  | { type: 'appendToInput'; text: string }
  | { type: 'error'; sessionId?: string; message: string };

export interface SessionMeta { id: string; name: string; createdAt: number; updatedAt: number; }
export interface ModelInfo { provider: string; model: string; label: string; }
export type MessagePart =
  | { kind: 'text'; text: string }
  | { kind: 'tool_call'; toolId: string; name: string; input: unknown; status: 'running' | 'done' | 'error'; output?: unknown };
```

### E.3 CSP del webview (en `ChatViewProvider.ts` al servir HTML)
```
default-src 'none';
style-src ${cspSource} 'unsafe-inline';
script-src ${cspSource} 'nonce-${nonce}';
img-src ${cspSource} https: data:;
font-src ${cspSource};
connect-src 'none';
```
DO NOT añadir `connect-src` distinto a `'none'` — todo HTTP pasa por el host.

### E.4 Endpoints OpenCode server usados
| Método | Path | Uso |
|---|---|---|
| GET | `/global/health` | healthcheck al arrancar |
| GET | `/global/event` | SSE — único stream de eventos |
| POST | `/session` | crear sesión nueva |
| POST | `/session/:id/message` | enviar prompt (síncrono o con SSE) |
| GET | `/find/file?query=` | @-mention picker |
| GET | `/config/providers` | poblar ModelSelector |
| GET | `/file/content?path=` | leer archivo (futuro) |

### E.4b `vite.config.mjs` — config canónica del webview

```js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  root: 'webview',
  base: './',
  build: {
    outDir: '../dist/webview',
    emptyOutDir: true,
  },
});
```

Reglas:
- **NO usar `rollupOptions.input: 'webview/index.html'`** — rollup preservaría la ruta y escribiría a `dist/webview/webview/index.html`, rompiendo el `fs.readFileSync` del `ChatViewProvider`. Usar `root: 'webview'` para que `index.html` quede en `dist/webview/`.
- El archivo es `.mjs` y `package.json` tiene `"type": "module"`. PLAN.md original decía `.ts`; ambos válidos.

### E.4c `webview/main.ts` — montaje canónico (Svelte 5)

```ts
import { mount } from 'svelte';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
```

Prohibido `new App({target})` (API Svelte 4 deprecada).

### E.5 Spawn del server (regla)
- Puerto: `0` en config = elegir libre con `net.createServer().listen(0)`.
- Password: generar UUID al activar, pasar via `OPENCODE_SERVER_PASSWORD`.
- Argumentos: `serve --port <p> --hostname 127.0.0.1`.
- `stdin: 'ignore'`, capturar `stdout`/`stderr` → OutputChannel.
- `subprocess.kill('SIGTERM')` en `deactivate()` y al evento `process.exit`.
- Reintento UNA vez si crashea en los primeros 5 s, después mostrar error UI.

## F. REGLAS DE CÓDIGO (cumplir SIN excepciones)

1. TypeScript `strict: true`. Prohibido `any` (usar `unknown` + narrowing).
2. Sin comentarios salvo: workaround documentado (link a issue) o invariante no obvio. NO docstrings JSDoc.
3. Estilos: SOLO variables `var(--vscode-*)` de VSCode. Prohibidos colores hardcoded (excepto `transparent`, `currentColor`).
4. Svelte 5: usar runes (`$state`, `$derived`, `$effect`), no `$:` ni stores legacy. **Montaje SIEMPRE con `mount(App, {target})` importado de `'svelte'`** — NUNCA `new App(...)` (API Svelte 4, deprecada).
5. Mensajes webview/host: SIEMPRE tipados con discriminated union de `E.2`. Cada handler hace exhaustive switch.
6. Sin `innerHTML` con datos del LLM. Markdown SOLO vía `marked` + sanitización.
7. Sin librerías UI externas (no MUI, no Tailwind, no shadcn). CSS plano.
8. Sin telemetría, sin tracking, sin red salvo el server local.
9. Commits: convencional (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`). UNO por tarea de PLAN.
10. Después de cada tarea: ejecutar `pnpm build` localmente. Si falla, arreglar antes de marcar `[x]`.

## G. SETTINGS DE USUARIO EXPUESTAS

| Key | Tipo | Default | Notas |
|---|---|---|---|
| `opencodeChat.cliPath` | string | `"opencode"` | Path al binario |
| `opencodeChat.serverPort` | number | `0` | 0 = libre |
| `opencodeChat.defaultModel` | string | `""` | `provider/model` |
| `opencodeChat.autoApproveTools` | string[] | `[]` | Tools pre-aprobadas |

## H. WORKFLOW HAIKU (cómo trabajar)

1. Leer **AGENT.md** completo al inicio de cada sesión.
2. Abrir **PLAN.md**, buscar la primera tarea sin `[x]`.
3. Leer el bloque de la tarea entero (`Goal`, `Files`, `Steps`, `Done when`, `Commit`).
4. Ejecutar SOLO esa tarea. NO mezclar tareas.
5. Verificar el criterio `Done when`. Si no pasa, NO marcar como hecha.
6. Marcar `[x]` y hacer `git commit` con el mensaje sugerido en la tarea.
7. Actualizar la sección "ESTADO ACTUAL" al final de `PLAN.md` (fase, última tarea hecha, fecha).
8. Detener y reportar si: (a) una dependencia falla install, (b) un endpoint del server responde distinto a E.4, (c) la tarea pide algo ambiguo.

**Prohibiciones absolutas**:
- NO ejecutar `git push` sin permiso del usuario.
- NO ejecutar `pnpm publish:vsce` ni `publish:ovsx` sin permiso del usuario.
- NO modificar versiones de dependencias listadas en B sin permiso del usuario.
- NO añadir librerías externas no listadas en B sin permiso del usuario.
- NO usar `npm` ni `yarn` — solo `pnpm`.
- NO crear documentación adicional (READMEs por carpeta, docstrings, etc.) salvo lo listado en D.

## I. SKILLS DISPONIBLES (invocar vía la herramienta Skill cuando aplique)

Estas skills están instaladas en `~/.claude/skills/`. Usar SOLO cuando la situación lo amerita — no spamear.

| Skill | Cuándo invocarla |
|---|---|
| `executing-plans` | Al inicio de cada sesión, para cargar el patrón "leer tarea → ejecutar → verificar → marcar → commit". |
| `verification-before-completion` | Antes de marcar `[x]` cualquier tarea. Refuerza el chequeo del `Done when`. |
| `git-commit-helper` | Para generar el mensaje convencional del commit de cada tarea. |
| `systematic-debugging` | Cuando un `Done when` falle (server no arranca, SSE no conecta, build rompe). |
| `test-driven-development` | Fases 9.7 (unit) y 9.8 (e2e). |
| `using-git-worktrees` | SOLO si el usuario pide trabajo en paralelo. Por defecto trabajar en main. |
| `requesting-code-review` | Al cerrar cada fase completa (no por tarea), antes de avanzar a la siguiente fase. |
| `cavecrew` / `caveman` | Si la conversación crece y el contexto se ahoga. NO activar a menos que haga falta — comprime output pero puede dificultar debugging. |

**Prohibido**: invocar skills no listadas aquí sin permiso del usuario. Si una skill parece útil pero no está en la tabla, preguntar antes.

## J. MEJORA PENDIENTE — Skill custom de runner

**Recomendación de Opus (no es tarea de Haiku)**: el workflow descrito en sección H se repite ~60 veces (una por tarea de PLAN.md). Esto es candidato ideal para una skill custom que el usuario puede generar con `/skill-creator` en una sesión separada con Opus.

**Skill propuesta**: `opencode-chat-runner`
- **Disparador**: el usuario escribe `/opencode-chat-runner` al inicio de una sesión de Haiku.
- **Comportamiento**: lee `AGENT.md` → busca primera tarea sin `[x]` en `PLAN.md` → ejecuta los `Steps` → verifica `Done when` → marca `[x]` → hace commit con el mensaje sugerido → actualiza "ESTADO ACTUAL" → si quedan tareas en la fase, pasa a la siguiente; si terminó la fase, se detiene y reporta.
- **Beneficio**: elimina el prompt manual de handoff. Cada sesión arranca con un solo comando.
- **Cuándo crearla**: después de que Haiku complete la Fase 0 (ya con scaffolding probado). Antes es prematuro porque podríamos descubrir que el flow necesita ajustes.

Haiku NO debe intentar crear esta skill por su cuenta — requiere taste de diseño y debe nacer en sesión con Opus + el usuario.

## K. RECURSOS EXTERNOS

- **OpenCode docs**: https://opencode.ai/docs/
- **Server API spec**: `http://localhost:<port>/doc` (OpenAPI 3.1, disponible una vez levantado)
- **SDK npm**: https://www.npmjs.com/package/@opencode-ai/sdk
- **VSCode WebviewView API**: https://code.visualstudio.com/api/references/vscode-api#WebviewViewProvider
- **CSP for webviews**: https://code.visualstudio.com/api/extension-guides/webview#content-security-policy
- **Svelte 5 runes**: https://svelte.dev/docs/svelte/what-are-runes
- **Inspiración UX (NO copiar código)**: https://github.com/andrepimenta/claude-code-chat
- **Fork sin mantenimiento (referencia)**: https://github.com/timmagicbeans/opencode-x
