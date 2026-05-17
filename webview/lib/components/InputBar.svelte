<script lang="ts">
  import { send } from '../api/vscode';
  import { sessionStore } from '../stores/session.svelte';
  import type { WebviewToHost } from '../../../src/messaging/types';

  let text = $state('');
  let textarea: HTMLTextAreaElement;

  const maxHeight = 10 * 24; // ~10 lines

  function handleInput() {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  }

  function sendMessage() {
    if (!text.trim() || !sessionStore.currentSessionId) return;
    const msg: WebviewToHost = {
      type: 'sendPrompt',
      sessionId: sessionStore.currentSessionId,
      text,
    };
    send(msg);
    text = '';
    textarea.style.height = 'auto';
  }
</script>

<div class="input-bar">
  <textarea
    bind:this={textarea}
    bind:value={text}
    oninput={handleInput}
    onkeydown={handleKeydown}
    placeholder="Type a message..."
    disabled={false}
  ></textarea>
  <button onclick={sendMessage} disabled={!text.trim()}>Send</button>
</div>

<style>
  .input-bar {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid var(--vscode-widget-border, transparent);
    background-color: var(--bg);
  }

  textarea {
    flex: 1;
    padding: 8px;
    border: 1px solid var(--input-border);
    background-color: var(--input-bg);
    color: var(--input-fg);
    border-radius: 4px;
    font-family: inherit;
    font-size: inherit;
    line-height: 1.5;
    resize: none;
    overflow-y: auto;
    min-height: 32px;
    max-height: 240px;
  }

  textarea:focus {
    outline: none;
    border-color: var(--accent);
  }

  button {
    padding: 8px 16px;
    background-color: var(--button-bg);
    color: var(--button-fg);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: inherit;
    align-self: flex-end;
  }

  button:hover:not(:disabled) {
    background-color: var(--button-hover-bg);
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
