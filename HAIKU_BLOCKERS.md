# HAIKU_BLOCKERS.md

Estado: **BLOQUEADO EN TAREA 0.3 — PERSISTE**

## Bloqueador

`package.json` falta devDependencies. Verificación fallida:
- ✗ `pnpm tsc -p tsconfig.extension.json --noEmit` → "tsc" not found
- ✗ `pnpm tsc -p tsconfig.webview.json --noEmit` → idem

Git log muestra solo 3 commits (ignore files, package manifest, tsconfig placeholders). NO hay commits de Opus con devDependencies.

## Qué pasó

Usuario dijo "Opus resolvió bloqueador" pero cambios NO están en repo. Posibles razones:
1. Cambios hechos pero no mergeados a master
2. Cambios en rama local distinta
3. Necesita `pnpm install -D` después de editar package.json

## Lo que necesito

Opus DEBE: editar `package.json`, añadir devDependencies (ver sesión previa para listado), commitear, pushar a master.

O: si la edición YA existe, usuario hace `git pull` y `pnpm install` localmente.

## Tareas

- [x] 0.1 (ignore files)
- [x] 0.2 (package.json + lock)
- [ ] 0.3 (tsconfigs) — BLOQUEADO
- [ ] 0.4–0.8 (pending)

Esperando Opus desbloquee o usuario confirme estado del repo.
