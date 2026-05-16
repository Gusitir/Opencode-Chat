<script lang="ts">
  import { renderMarkdown } from '../markdown/renderer';
  import type { MessagePart } from '../../../src/messaging/types';

  interface Props {
    role: 'user' | 'assistant';
    parts: MessagePart[];
  }

  let { role, parts } = $props();
</script>

<div class="message {role}">
  {#each parts as part (part.kind)}
    {#if part.kind === 'text'}
      <div class="text">
        {@html renderMarkdown(part.text)}
      </div>
    {:else if part.kind === 'tool_call'}
      <div class="tool-call">
        <strong>{part.name}</strong>
        <span class="status {part.status}">{part.status}</span>
      </div>
    {/if}
  {/each}
</div>

<style>
  .message {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    margin: 4px 0;
    border-radius: 4px;
  }

  .message.user {
    align-self: flex-end;
    background-color: var(--selection-bg, rgba(100, 150, 255, 0.2));
    max-width: 80%;
  }

  .message.assistant {
    align-self: flex-start;
    background-color: transparent;
    max-width: 100%;
  }

  .text {
    margin: 0;
    line-height: 1.5;
  }

  .text :global(p) {
    margin: 0 0 8px 0;
  }

  .text :global(p:last-child) {
    margin-bottom: 0;
  }

  .text :global(code) {
    background-color: var(--input-bg);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
    font-family: monospace;
  }

  .tool-call {
    padding: 8px;
    background-color: var(--input-bg);
    border-left: 3px solid var(--accent);
    font-size: 0.9em;
  }

  .status {
    margin-left: 8px;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.85em;
  }

  .status.running {
    background-color: var(--status-running);
    color: black;
  }

  .status.done {
    background-color: var(--status-done);
    color: white;
  }

  .status.error {
    background-color: var(--status-error);
    color: white;
  }
</style>
