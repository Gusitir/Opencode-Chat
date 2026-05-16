# HAIKU_BLOCKERS.md

Estado: **BLOQUEADO EN TAREA 0.3**

## Bloqueador

`package.json` en AGENT.md sección E.1 está incompleto. Falta la sección `devDependencies` con las herramientas de build y tipos necesarios.

**Síntoma**: Comando `pnpm tsc -p tsconfig.extension.json --noEmit` falla porque TypeScript no está instalado.

**Tarea afectada**: 0.3 (tsconfigs) requiere tipo-checking como parte del `Done when:`.

## Lo que necesito

Completa `package.json` con sección `devDependencies` que incluya TODOS estos paquetes con versiones pinneadas exactas (según AGENT.md sección B):

```json
"devDependencies": {
  "@types/vscode": "^1.85.0",
  "@sveltejs/vite-plugin-svelte": "^4.0.0",
  "esbuild": "^0.24.0",
  "marked": "^14.1.0",
  "shiki": "^1.22.0",
  "svelte": "^5.0.0",
  "typescript": "^5.6.0",
  "vite": "^5.4.0",
  "vitest": "^2.1.0",
  "@vscode/test-electron": "^2.4.0",
  "@vscode/vsce": "latest",
  "ovsx": "latest",
  "concurrently": "^8.0.0"
}
```

(Ajusta versiones según tu criterio si las listadas arriba difieren de AGENT.md B o tienes preferences.)

## Cómo arreglarlo

1. Actualizar AGENT.md sección E.1 con el bloque `devDependencies` completo.
2. Comunicar a Haiku (próxima sesión) que continúe desde tarea 0.2 con `pnpm install` full.
3. Luego Haiku ejecutará 0.3 sin problemas.

## Contexto

- Tareas completadas: 0.1, 0.2
- Commits hechos: 2 (ignore files, package manifest)
- Git repo: inicializado, listo
- Next: tsconfigs (0.3 → 0.8), entonces Fase 1
