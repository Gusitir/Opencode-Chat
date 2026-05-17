# HAIKU_BLOCKERS.md

Estado: **AUDITORÍA OPUS Session 3 — 10 BUGS DETECTADOS Y CORREGIDOS ✓**

Resumen: 40 tareas hechas (hasta 5.6). AUDIT-11 → AUDIT-20 resueltos secuencialmente. `pnpm verify` (tsc + build) pasa exit 0.

Regla de oro a recordar: **`pnpm build` + `pnpm tsc -p tsconfig.extension.json --noEmit` + `pnpm tsc -p tsconfig.webview.json --noEmit` deben pasar los TRES antes de marcar cualquier tarea `[x]`**.

Arreglar AUDIT-11 → AUDIT-20 antes de Fase 6.

---

## Tarea AUDIT-11 (CRÍTICA, typecheck): `uuid` no instalado en `bridge.ts`

**Error**: `src/messaging/bridge.ts(2,28): error TS2307: Cannot find module 'uuid'`.

**Causa**: línea 2 importa `import { v4 as uuid } from 'uuid'`. Package NO está en devDependencies (AGENT.md tabla B no lo lista). Además el import NO se usa en ningún lado del archivo.

**Fix**: borrar la línea 2 entera.

**Done when**: `pnpm tsc -p tsconfig.extension.json --noEmit` no muestra este error.

**Commit**: `fix: remove unused uuid import from bridge`

---

## Tarea AUDIT-12 (CRÍTICA, typecheck): `MessagePart` importado sin usar

**Error**: `src/messaging/bridge.ts(3,40): error TS6133: 'MessagePart' is declared but its value is never read`.

**Causa**: `tsconfig.json` tiene `noUnusedLocals: true`. `MessagePart` en el import de `./types` no se referencia.

**Fix**: cambiar línea 3 a `import { WebviewToHost, HostToWebview } from './types';` (quitar `MessagePart`).

**Done when**: error TS6133 desaparece.

**Commit**: `fix: drop unused MessagePart import`

---

## Tarea AUDIT-13 (CRÍTICA, typecheck): status narrowing en stream handler

**Error**: `src/messaging/bridge.ts(144,15): error TS2322: Type 'string' is not assignable to type '"error" | "running" | "done"'`.

**Causa**: línea 144 hace `status: (p.status as string) || 'running'`. `(p.status as string)` es `string`, no se narrowea al union literal `'running' | 'done' | 'error'`.

**Fix**: reemplazar la asignación de `status` en el bloque `tool_call`:
```ts
const rawStatus = p.status;
const status: 'running' | 'done' | 'error' =
  rawStatus === 'done' || rawStatus === 'error' ? rawStatus : 'running';
// ...luego usar `status` en el part literal
```

Reescribir el bloque tool_call para usar la variable narrowed:
```ts
} else if (p.kind === 'tool_call') {
  const rawStatus = p.status;
  const status: 'running' | 'done' | 'error' =
    rawStatus === 'done' || rawStatus === 'error' ? rawStatus : 'running';
  const msg: HostToWebview = {
    type: 'messageDelta',
    sessionId,
    messageId: (evt.messageId as string) || 'current',
    part: {
      kind: 'tool_call',
      toolId: (p.toolId as string) || '',
      name: (p.name as string) || '',
      input: p.input ?? {},
      status,
    },
  };
  post(msg);
}
```

**Done when**: error TS2322 línea 144 desaparece.

**Commit**: `fix: narrow tool_call status to literal union`

---

## Tarea AUDIT-14 (CRÍTICA, typecheck): marked v14 renderer API mismatch

**Error**: `webview/lib/markdown/renderer.ts(10,3): error TS2740: Type '{ code(...) }' is missing properties from type '_Renderer': options, parser, space, blockquote, and 18 more`.

**Causa**: `marked.setOptions({ renderer })` en v14 requiere instancia completa de `Renderer`, no un objeto parcial.

**Fix**: usar `marked.use({ renderer: {...} })` que sí acepta extensiones parciales. Reescribir `renderer.ts`:

```ts
import { marked } from 'marked';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

marked.use({
  renderer: {
    code(this: unknown, { text, lang }: { text: string; lang?: string }): string {
      return `<pre data-lang="${lang || 'text'}">${escapeHtml(text)}</pre>`;
    },
  },
  gfm: true,
});

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
```

Esto resuelve tanto AUDIT-14 como AUDIT-15.

**Done when**: errores TS2740 y TS2322 de `renderer.ts` desaparecen.

**Commit**: `fix: use marked.use for partial renderer override`

---

## Tarea AUDIT-15 (CRÍTICA, typecheck): marked retorna `Promise<string>`

**Error**: `webview/lib/markdown/renderer.ts(21,3): error TS2322: Type 'string | Promise<string>' is not assignable to type 'string'`.

**Cubierto por AUDIT-14**: el fix usa `marked.parse(markdown, { async: false }) as string`. Marcar AUDIT-15 como hecho cuando AUDIT-14 esté.

---

## Tarea AUDIT-16 (ALTA, runtime): CodeBlock detecta tema mal

**Causa**: `webview/lib/markdown/CodeBlock.svelte:14` usa `window.matchMedia('(prefers-color-scheme: dark)')`. Esto refleja el tema del **OS**, no el de VSCode. Si el OS está en dark pero VSCode tema light, el syntax highlight queda inconsistente.

VSCode webview agrega clases al `<body>`: `.vscode-dark`, `.vscode-light`, `.vscode-high-contrast`.

**Fix**: en `CodeBlock.svelte` cambiar la detección dentro de `onMount`:
```ts
const isDark =
  document.body.classList.contains('vscode-dark') ||
  document.body.classList.contains('vscode-high-contrast');
const theme = isDark ? 'vitesse-dark' : 'vitesse-light';
```

Considerar también que el tema puede cambiar en runtime — pero por ahora estático en mount es aceptable. Apuntar reactividad a futuro.

**Done when**: cambiar tema VSCode entre Dark+/Light+ y reload webview muestra highlight coherente.

**Commit**: `fix: detect vscode theme via body class in codeblock`

---

## Tarea AUDIT-17 (ALTA, runtime): key de `{#each}` puede colisionar

**Causa**: `webview/lib/components/Message.svelte:14` hace `{#each parts as part (part.kind)}`. Si un mensaje tiene varias partes `text` (caso común con streaming), todas comparten key `'text'` → Svelte 5 detectará colisión y romperá render incremental.

**Fix**: usar índice como key:
```svelte
{#each parts as part, i (i)}
```

O mejor, key compuesta si hay riesgo de reordenamiento. Por ahora con append-only (streaming), el índice es seguro.

**Done when**: streaming de respuesta con múltiples partes text/tool_call no produce warnings en consola del webview.

**Commit**: `fix: stable each key in message parts`

---

## Tarea AUDIT-18 (ALTA, runtime): CSS vars de status faltan en theme.css

**Causa**: `Message.svelte` usa `var(--status-running)`, `var(--status-done)`, `var(--status-error)`. No están definidas en `webview/lib/styles/theme.css`. Resultado: background-color queda vacío, badges invisibles.

**Fix**: agregar a `theme.css` dentro de `:root {}`:
```css
--status-running: var(--vscode-editorWarning-foreground, #cca700);
--status-done: var(--vscode-testing-iconPassed, #73c991);
--status-error: var(--vscode-editorError-foreground, #f48771);
```

**Done when**: mock de tool_call con status `running`/`done`/`error` muestra colores distintos.

**Commit**: `feat: add status color tokens to theme`

---

## Tarea AUDIT-19 (MEDIA): SessionMeta duplicado

**Causa**: `src/providers/SessionStore.ts:3-8` define `interface SessionMeta` localmente. Ya existe en `src/messaging/types.ts:26`. Duplicación → drift cuando los campos cambien.

**Fix**: en `SessionStore.ts`:
1. Borrar la interface local.
2. Agregar `import type { SessionMeta } from '../messaging/types';` al top.

**Done when**: `SessionMeta` se define UNA SOLA VEZ (en `messaging/types.ts`). Typecheck pasa.

**Commit**: `refactor: share SessionMeta type from messaging`

---

## Tarea AUDIT-20 (BAJA): TODO comment en bridge.ts

**Causa**: `bridge.ts:91` contiene `// TODO: implement abort via OpenCode API or signal`. Viola F.2 (no comments salvo workaround documentado).

**Fix**: borrar la línea. La tarea queda en PLAN.md 5.6 igual, no necesita TODO en código.

**Done when**: archivo sin ese TODO.

**Commit**: `chore: remove TODO comment from bridge`

---

## Verificación final tras AUDIT-11..AUDIT-20

Antes de marcar Phase 5 cerrada y pasar a Phase 6, ejecutar OBLIGATORIO:

```
pnpm build
pnpm tsc -p tsconfig.extension.json --noEmit
pnpm tsc -p tsconfig.webview.json --noEmit
```

Los TRES deben terminar con exit 0. Si alguno falla, NO marcar audits hechos.

F5 manual:
- Sidebar abre, "Connected" aparece.
- Click "+" (newSession) crea sesión visible.
- Escribir prompt + Ctrl+Enter envía.
- Respuesta llega streameada token-by-token.
- Markdown con ```ts ... ``` se highlightea (AUDIT-16 dependiente del tema).
- Status badges en tool_call tienen color (AUDIT-18).

Si algo falla en runtime, parar y reportar en este archivo antes de Phase 6.

---

## Recordatorio sobre el flujo

A partir de ahora, **antes de hacer commit de cualquier tarea**, correr los 3 comandos de arriba. `pnpm build` solo NO basta — esbuild transpila sin chequear tipos. Sólo `tsc --noEmit` valida types.

Si Haiku puede crear un script `pnpm verify` que corra los 3 secuencialmente y devuelva exit 0 sólo si pasan todos, agregar al `package.json` scripts. Sugerencia (no obligatoria esta sesión):

```json
"verify": "pnpm tsc -p tsconfig.extension.json --noEmit && pnpm tsc -p tsconfig.webview.json --noEmit && pnpm build"
```

Opcional, se puede agregar como tarea aparte después de los audits.
