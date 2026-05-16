# HAIKU_BLOCKERS.md

Estado: **AUDITORÍA OPUS — 3 BUGS A CORREGIR ANTES DE FASE 2.3**

Resumen: 15 tareas completadas (0.1–0.8, 1.1–1.5, 2.1–2.2). Build pasa. Pero auditoría detectó bugs runtime que romperán Fase 1.5 (webview "Hello") al ejecutar. Arreglar antes de 2.3.

---

## Tarea AUDIT-1 (CRÍTICA): vite output path mismatch

**Síntoma esperado**: F5 → sidebar carga, panel vacío, OutputChannel `ENOENT dist/webview/index.html`.

**Causa**: `vite.config.mjs` usa `rollupOptions.input: 'webview/index.html'`. Rollup preserva la ruta del input → escribe a `dist/webview/webview/index.html`. ChatViewProvider lee `dist/webview/index.html`.

**Fix**: en `vite.config.mjs` cambiar a:
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

**Done when**:
- `pnpm build` produce `dist/webview/index.html` (sin doble carpeta).
- `find dist -type f` muestra: `dist/webview/index.html`, `dist/webview/assets/*`.

**Commit**: `fix: vite output path for webview`

---

## Tarea AUDIT-2 (CRÍTICA): Svelte 5 mount API

**Síntoma esperado**: webview muestra error en consola devtools del Extension Host, app no monta.

**Causa**: `webview/main.ts` usa la API de Svelte 4:
```ts
const app = new App({ target: document.getElementById('app')! });
```

Svelte 5 deprecó constructor mode. PLAN.md 1.5 explícitamente requiere `mount(App, {...})`.

**Fix**: reemplazar `webview/main.ts` por:
```ts
import { mount } from 'svelte';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
```

**Done when**:
- `pnpm build` pasa.
- F5 abre Extension Development Host, sidebar muestra "Opencode Chat — initializing…" sin errores en consola devtools.

**Commit**: `fix: use svelte 5 mount api`

---

## Tarea AUDIT-3 (MEDIA): nonce con CSPRNG

**Causa**: `src/providers/ChatViewProvider.ts:35-40` usa `Math.random()` para generar nonce CSP. No es criptográficamente seguro. CSP nonces deben usar CSPRNG.

**Fix**: reemplazar método `getNonce` por:
```ts
import { randomBytes } from 'crypto';
// ...
private getNonce(): string {
  return randomBytes(16).toString('base64');
}
```

**Done when**: nonces ahora son `crypto.randomBytes`. `pnpm tsc -p tsconfig.extension.json --noEmit` pasa.

**Commit**: `fix: use crypto-strong nonce for csp`

---

## Tarea AUDIT-4 (BAJA): limpiar comment en extension.ts

**Causa**: `src/extension.ts:29` contiene `// Server will be started in task 2.5`. AGENT.md F.2: prohibido comentarios salvo workaround documentado.

**Fix**: borrar la línea del comment, dejar el `try/catch` limpio.

**Done when**: archivo sin ese comment.

**Commit**: `chore: remove planning comment`

---

## Después de los 4 fixes

1. Marcar tareas AUDIT-1 a AUDIT-4 hechas en este archivo.
2. Sobreescribir este archivo con `Estado: SIN BLOQUEOS`.
3. Continuar **Fase 2.3** (`OpenCodeClient` wrapper).
4. **IMPORTANTE Fase 2.4**: AGENT.md menciona `eventsource` no listado en tabla B. Opus recomienda usar `undici` fetch streaming (ya transitivo). Si llegas a 2.4 y no hay decisión clara, pausar y preguntar al usuario.

---

## Drift documentado (no requiere fix, solo registro)

- `package.json` tiene `"type": "module"`. Necesario para `vite.config.mjs`. AGENT.md E.1 no lo listaba — aceptado por Opus.
- `vite.config.ts` (PLAN.md 0.5) implementado como `vite.config.mjs`. Funcionalmente equivalente con `"type": "module"`. Aceptado.
- `@types/node ^18.0.0` añadido a devDependencies (no estaba en tabla B). Necesario para `child_process`/`net`/`crypto`. Aceptado.
