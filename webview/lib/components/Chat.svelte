<script lang="ts">
  import MessageList from './MessageList.svelte';
  import InputBar from './InputBar.svelte';
  import { send } from '../api/vscode';
  import { sessionStore } from '../stores/session.svelte';
  import { messagesStore } from '../stores/messages.svelte';
  import type { MessagePart } from '../../../src/messaging/types';

  interface Props {
    error?: string | null;
  }

  let { error = null } = $props();

  function handleNewSession() {
    send({ type: 'newSession' });
  }

  let messages = $derived(
    sessionStore.currentSessionId ? messagesStore.getBySession(sessionStore.currentSessionId) : []
  );
</script>

<div class="chat">
  <div class="chat-header">
    <button onclick={handleNewSession} title="Create new session">+</button>
  </div>
  {#if error}
    <div class="error-banner">
      {error}
    </div>
  {/if}
  <MessageList {messages} />
  <InputBar />
</div>

<style>
  .chat {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 0;
  }

  .chat-header {
    display: flex;
    padding: 8px;
    border-bottom: 1px solid var(--input-border);
    gap: 4px;
  }

  button {
    padding: 4px 8px;
    background-color: var(--button-bg);
    color: var(--button-fg);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: inherit;
  }

  button:hover {
    background-color: var(--button-hover-bg);
  }

  .error-banner {
    padding: 8px 12px;
    background-color: var(--status-error, #aa0000);
    color: white;
    font-size: 0.9em;
    border-radius: 4px;
    margin: 4px 8px;
  }
</style>
