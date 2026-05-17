# Opencode Chat

Native chat UI for the [OpenCode](https://opencode.ai) AI coding agent, built for VSCode and VSCodium.

> **Status**: In development (pre-0.1.0). Not yet functional. See [PLAN.md](./PLAN.md) for the implementation roadmap.

## What this is

A side-panel chat interface in your editor — similar to Claude Code or Cursor — powered by OpenCode running locally on your machine. Unlike the official `sst-dev.opencode` extension (which just wraps the terminal TUI), this is a full graphical chat experience: streaming responses, session management, model picker, file attachments, and visual permission prompts.

## Why

- The official OpenCode VSCode extension is a terminal wrapper, not a chat UI.
- `opencode-x` (the only existing alternative GUI fork) is unmaintained and broken in current OpenCode versions.
- VSCodium users have no friendly OpenCode chat experience today.

## How it works

The extension spawns a local `opencode serve` process and talks to it over HTTP + Server-Sent Events using the official `@opencode-ai/sdk`. The chat UI is a Svelte 5 webview docked in the activity bar.

```
VSCode/VSCodium <-> Extension Host <-> opencode serve <-> LLM provider
```

## Requirements

- VSCode `>=1.85` or VSCodium equivalent
- Node.js `>=18`
- [OpenCode CLI](https://opencode.ai/docs/) installed and authenticated (`opencode auth login`)

## Development

This project is built by Claude (Opus 4.7 plans + Sonnet 4.6 executes) following the spec in [AGENT.md](./AGENT.md), task list in [PLAN.md](./PLAN.md) and pending audits in [BLOCKERS.md](./BLOCKERS.md). Contributions should follow the same workflow.

```bash
pnpm install
pnpm dev        # build + watchers
# Press F5 in VSCode to launch Extension Development Host
```

## License

MIT — see [LICENSE](./LICENSE).
