# HAIKU_BLOCKERS.md

Estado: **RESUELTO** — proceder con 0.3 → 0.8 normal.

---

## Resolución (sesión Opus 2026-05-16)

### Cambios aplicados

1. **`AGENT.md` sección E.1**: añadido bloque `devDependencies` completo con versiones pinneadas según sección B. Todas las libs van en `devDependencies` (no `dependencies`) porque `vsce package --no-dependencies` skipea `node_modules` y todo se bundlea (esbuild para el host, Vite para el webview).

2. **`package.json` (worktree)**: añadido el mismo bloque `devDependencies` + campo `pnpm.onlyBuiltDependencies`.

3. **`.npmrc`**: añadida línea `verify-deps-before-run=false` para evitar que pnpm 11 reejecute install antes de cada comando.

4. **`pnpm-workspace.yaml`** (archivo NUEVO, no estaba en AGENT.md D): pnpm 11 lo creó automáticamente para gestionar permisos de build scripts. Contenido:
   ```yaml
   allowBuilds:
     '@vscode/vsce-sign': true
     esbuild: true
     keytar: true
   ```
   Sin esto, `pnpm install` deja warnings que pnpm 11 trata como error en `runDepsStatusCheck`. **NO borrar**.

5. **`@types/node ^18.0.0`**: añadido a devDependencies aunque no estaba en AGENT.md sección B. Necesario porque target host es `node18` y se usarán `child_process`, `net`, `crypto`, etc. en Fase 2.

### Verificación

- `pnpm install` → OK (562 packages, build scripts ejecutados).
- `pnpm tsc -p tsconfig.extension.json --noEmit` → exit 0.
- `pnpm tsc -p tsconfig.webview.json --noEmit` → exit 0.

### Next para Haiku

- Tarea **0.3** ya cumple su `Done when`. Si los tsconfigs y placeholders existentes son correctos, marcar `[x]` 0.3 con commit `chore: add tsconfig`.
- Continuar con **0.4** (`esbuild.config.mjs`) → **0.8**.
- En 0.8 (`pnpm install`): ya está instalado, sólo verificar que no haya cambios y commit como `chore: install dependencies` puede saltarse — o hacer commit vacío con `--allow-empty` si querés mantener la trazabilidad del PLAN.

### Notas de Opus para futuras fases (no bloqueante, informativo)

- **Fase 2.4 (SSE)**: AGENT.md menciona `eventsource` package no listado en tabla B. **Recomendación Opus**: usar `undici` (ya transitivo) con `fetch` streaming en vez de añadir `eventsource`. Si Haiku llega a 2.4 sin instrucciones, pausar y preguntar.
- **`@opencode-ai/sdk`**: versión instalada `1.15.0` (semver mayor a `^1.1.18`). Compatible. Si la API cambió, ajustar en Fase 2.3.
