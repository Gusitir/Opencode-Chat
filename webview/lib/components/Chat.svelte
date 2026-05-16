<script lang="ts">
  import MessageList from './MessageList.svelte';
  import InputBar from './InputBar.svelte';
  import { send } from '../api/vscode';
  import type { MessagePart } from '../../../src/messaging/types';

  interface Message {
    id: string;
    role: 'user' | 'assistant';
    parts: MessagePart[];
  }

  let messages = $state<Message[]>([]);

  function handleNewSession() {
    send({ type: 'newSession' });
  }
</script>

<div class="chat">
  <div class="chat-header">
    <button onClick={handleNewSession} title="Create new session">+</button>
  </div>
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
</style>
