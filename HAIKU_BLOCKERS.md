# HAIKU_BLOCKERS.md

Estado: **SIN BLOQUEOS**

Audits Session 2 completados:
- [x] AUDIT-5: wire bridge to ChatViewProvider
- [x] AUDIT-6: webview listens on window 'message' event
- [x] AUDIT-7: share message types, eliminar `any`
- [x] AUDIT-8: show install message on ENOENT
- [x] AUDIT-9: replace `any` with type guards en OpenCodeClient
- [x] AUDIT-10: drop @opencode-ai/sdk dependency

Build: ✓ pnpm build pasa.
Type-check: ✓ ambos tsconfig pasan.
Refs: ✓ grep "opencode-ai/sdk" src webview → vacío.

Ready para Fase 4 (Chat UI MVP).
