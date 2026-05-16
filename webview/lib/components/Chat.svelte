<script lang="ts">
  import MessageList from './MessageList.svelte';
  import InputBar from './InputBar.svelte';
  import type { MessagePart } from '../../../src/messaging/types';

  interface Message {
    id: string;
    role: 'user' | 'assistant';
    parts: MessagePart[];
  }

  let messages = $state<Message[]>([]);
</script>

<div class="chat">
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
</style>
