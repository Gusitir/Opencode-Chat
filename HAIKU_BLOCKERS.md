# HAIKU_BLOCKERS.md

Estado: **AUDITORÍA OPUS Session 2 — 5 BUGS + 1 DECISIÓN ANTES DE FASE 4**

Resumen: 22 tareas + 4 audits previos completados. Build pasa. Pero auditoría detectó que el "ready handshake" (3.4) es un **false positive**: el webview envía `ready` pero el host nunca responde porque el bridge no está conectado al ChatViewProvider. App.svelte nunca verá "Connected" en runtime.

Arreglar AUDIT-5 → AUDIT-9 antes de Fase 4. AUDIT-10 requiere decisión del usuario.

---

## Tarea AUDIT-5 (CRÍTICA): Bridge no conectado al ChatViewProvider

**Síntoma**: F5 → sidebar muestra "Opencode Chat — initializing…" para siempre. App.svelte envía `ready`, host nunca recibe.

**Causa**: `src/providers/ChatViewProvider.ts` resuelve el HTML pero NUNCA llama a `createBridge(...)`. Línea por línea: `resolveWebviewView` setea `webview.html` y termina. `webview.onDidReceiveMessage` no está suscrito a nada.

**Fix**: en `ChatViewProvider.ts`:
1. Constructor recibe también `deps: { /* lo que el bridge necesite */ }` o más simple por ahora: una factory `createBridgeFor(webview)`.
2. En `resolveWebviewView`, después de setear `webview.html`, llamar `createBridge({ webview: webviewView.webview })`.

Snippet mínimo:
```ts
import { createBridge } from '../messaging/bridge';
// ...
resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
  // ... config + html setup ...
  webviewView.webview.html = html;
  createBridge({ webview: webviewView.webview });
  info('ChatViewProvider resolved');
}
```

**Done when**: F5 → sidebar muestra "Connected" (App.svelte cambia el texto al recibir `state`). OutputChannel loguea `Webview ready`.

**Commit**: `fix: wire bridge to chat view provider`

---

## Tarea AUDIT-6 (CRÍTICA): webview API usa `api.onMessage` inexistente

**Síntoma**: incluso con AUDIT-5 arreglado, webview nunca renderiza "Connected" porque no escucha mensajes del host.

**Causa**: `webview/lib/api/vscode.ts:29` hace `api.onMessage((msg) => ...)`. La API real de VSCode (`acquireVsCodeApi()`) sólo expone `postMessage`, `getState`, `setState`. **NO existe `onMessage`**.

Para recibir mensajes del host, el webview debe escuchar el evento `message` en `window`:
```ts
window.addEventListener('message', (event) => {
  const msg = event.data as HostToWebview;
  // ...
});
```

**Fix**: reemplazar el bloque `api.onMessage(...)` por:
```ts
window.addEventListener('message', (event: MessageEvent<HostToWebview>) => {
  const msg = event.data;
  const handlers = listeners.get(msg.type);
  if (handlers) {
    handlers.forEach((handler) => handler(msg));
  }
});
```

**Done when**: tras AUDIT-5+AUDIT-6, F5 → sidebar muestra "Connected" instantáneo.

**Commit**: `fix: webview listens on window message event`

---

## Tarea AUDIT-7 (ALTA): tipos duplicados + `any` en webview API

**Causa**: `webview/lib/api/vscode.ts` duplica `WebviewToHost` / `HostToWebview` de `src/messaging/types.ts` y usa `any` (`sessions: any[]`, `models: any[]`, `part: any`). Viola:
- AGENT.md F.1 "Prohibido `any` (usar `unknown` + narrowing)".
- AGENT.md F.5 "SIEMPRE tipados con discriminated union de E.2" (single source).

**Fix**: importar tipos desde `src/messaging/types.ts` directamente:
```ts
import type { WebviewToHost, HostToWebview } from '../../../src/messaging/types';
```

Vite/Svelte 5 con `moduleResolution: 'Bundler'` resuelve sin problema. Borrar las definiciones duplicadas de `webview/lib/api/vscode.ts`.

**Done when**:
- `pnpm tsc -p tsconfig.webview.json --noEmit` pasa.
- No queda `any` en `webview/lib/api/vscode.ts`.
- `WebviewToHost` y `HostToWebview` se definen UNA SOLA VEZ (en `src/messaging/types.ts`).

**Commit**: `refactor: share message types between host and webview`

---

## Tarea AUDIT-8 (ALTA): ENOENT showErrorMessage faltante

**Causa**: PLAN.md tarea 2.2 pide: "Si `spawn` falla con `ENOENT`, mostrar `vscode.window.showErrorMessage('OpenCode CLI not found', 'Install Guide')`". Actualmente `OpenCodeServer.ts` sólo loguea en `this.process.on('error', ...)`. No hay UI de error.

**Fix**: en `OpenCodeServer.ts`, dentro de `start()`, después del `spawn` añadir handler que detecte ENOENT:

```ts
this.process.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'ENOENT') {
    void vscode.window.showErrorMessage(
      'OpenCode CLI not found',
      'Install Guide'
    ).then((choice) => {
      if (choice === 'Install Guide') {
        void vscode.env.openExternal(vscode.Uri.parse('https://opencode.ai/docs/'));
      }
    });
  }
  error('OpenCode process error', err);
});
```

Necesita `import * as vscode from 'vscode';` en top del archivo.

**Done when**: borrar `opencode` del PATH (o setear `opencodeChat.cliPath` a path inexistente) y arrancar la extensión → aparece el messageBox "OpenCode CLI not found" con botón "Install Guide".

**Commit**: `fix: show install message on cli enoent`

---

## Tarea AUDIT-9 (MEDIA): OpenCodeClient usa `any`

**Causa**: `src/server/OpenCodeClient.ts` tiene varios `(response as any)`:
- `createSession`: `(response as any).id ?? (response as any).sessionId`
- `listProviders`: `(response as any).providers ?? []`
- `findFiles`: `(response as any).results ?? []`

Viola F.1 (no `any`).

**Fix**: definir tipos para las respuestas y hacer narrowing:
```ts
function isSessionResponse(x: unknown): x is { id: string } {
  return typeof x === 'object' && x !== null && typeof (x as { id?: unknown }).id === 'string';
}

async createSession(): Promise<string> {
  try {
    const response = await this.post('/session', {});
    if (!isSessionResponse(response)) {
      throw new OpenCodeError('No session ID in response');
    }
    info(`Created session: ${response.id}`);
    return response.id;
  } catch (err) {
    throw this.wrapError(err, 'createSession');
  }
}
```

Patrón similar para `listProviders` y `findFiles` (typeguards mínimos sobre `unknown`).

**Done when**: `pnpm tsc -p tsconfig.extension.json --noEmit` pasa. No queda `any` en `OpenCodeClient.ts`.

**Commit**: `refactor: replace any with typed narrowing in client`

---

## Tarea AUDIT-10 (DECIDIDO — Opción A): eliminar `@opencode-ai/sdk` de deps

**Decisión del usuario (2026-05-16)**: mantener `fetch` hand-rolled. Eliminar SDK no usado.

**Pasos**:
1. Quitar `"@opencode-ai/sdk": "^1.1.18"` de `package.json` devDependencies.
2. `pnpm install` (actualiza lockfile).
3. En `AGENT.md` tabla B: borrar fila `OpenCode SDK @opencode-ai/sdk ^1.1.18`.
4. En `AGENT.md` tarea 2.3 (sección no aplica directamente — está en PLAN.md). En PLAN.md tarea 2.3 ya hecha, no tocar. Sólo nota: el spec de 2.3 quedó como guía histórica, implementación actual usa `fetch`.
5. Verificar build: `pnpm build` pasa.

**Done when**:
- `package.json` no contiene `@opencode-ai/sdk`.
- `pnpm-lock.yaml` regenerado.
- `grep -r "opencode-ai/sdk" src webview` devuelve vacío.
- `pnpm build` pasa.

**Commit**: `chore: drop unused @opencode-ai/sdk dependency`

---

## Tarea AUDIT-10-LEGACY (REFERENCIA HISTÓRICA — IGNORAR)

Texto original previo a decisión, conservado por trazabilidad:

**Contexto**: AGENT.md tarea 2.3 dice **"Instancia `@opencode-ai/sdk` client"**. Haiku implementó OpenCodeClient con `fetch` puro (no usa el SDK). SDK está en devDependencies pero no se importa en ningún lado.

**Trade-off**:
- **Mantener fetch** (estado actual): control fino, cero capa de abstracción, fácil debuggear. SDK queda como dep muerta — eliminar de package.json.
- **Adoptar SDK**: menos código, tipos generados por OpenCode, actualizaciones del API gratis. Riesgo: si SDK cambia el API o se desactualiza, romper extensión.

**Recomendación Opus**: mantener `fetch` (lo que ya hay) Y eliminar `@opencode-ai/sdk` de devDependencies. Cubre exactamente los 6 endpoints de E.4, no más. Decisión simple, código auditable.

**Acción si usuario confirma "mantener fetch"**:
1. Borrar `"@opencode-ai/sdk": "^1.1.18"` de `package.json` devDependencies.
2. `pnpm install` para actualizar lockfile.
3. Actualizar AGENT.md tabla B (quitar fila SDK) y tarea 2.3 (cambiar redacción).
4. Commit: `chore: drop unused opencode-ai sdk`.

**Acción si usuario confirma "usar SDK"**:
1. Refactorizar OpenCodeClient para importar `@opencode-ai/sdk` y delegar llamadas.
2. Mantener `OpenCodeError` como wrapper.

**Bloqueante**: Haiku NO continúa con AUDIT-10 hasta que el usuario decida. Pausar y preguntar.

---

## Después de AUDIT-5..AUDIT-9 (sin AUDIT-10 todavía)

1. Marcar tareas hechas en este archivo.
2. Sobreescribir con `Estado: SIN BLOQUEOS` (sólo si AUDIT-10 está decidido también).
3. Si AUDIT-10 sigue pendiente: dejar nota "Esperando decisión usuario sobre SDK", continuar a Fase 4 igual (no afecta UI).
4. Fase 4 (4.1–4.7): theme, InputBar, Message, MessageList, markdown, Chat compose, stores.

---

## Verificación end-to-end requerida después de AUDIT-5+AUDIT-6

Antes de tocar Fase 4, F5 debe mostrar:
- Sidebar abierta automáticamente con activity bar icon.
- Texto cambia de "Opencode Chat — initializing…" → "Connected".
- OutputChannel "Opencode Chat" loguea:
  - `Activating Opencode Chat extension`
  - `Starting OpenCode server on port <N>`
  - `OpenCode server health check passed` (si el binario `opencode` existe)
  - `ChatViewProvider resolved`
  - `Webview ready`
  - `SSE connected`

Si alguno falta, parar y reportar en este archivo antes de Fase 4.
