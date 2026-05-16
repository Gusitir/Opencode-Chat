<script lang="ts">
  import Message from './Message.svelte';
  import type { MessagePart } from '../../../src/messaging/types';

  interface Message {
    id: string;
    role: 'user' | 'assistant';
    parts: MessagePart[];
  }

  interface Props {
    messages: Message[];
  }

  let { messages } = $props();
  let container: HTMLDivElement;

  $effect(() => {
    if (!container) return;

    messages;

    setTimeout(() => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom < 200) {
        container.scrollTop = scrollHeight;
      }
    }, 0);
  });
</script>

<div class="message-list" bind:this={container}>
  {#each messages as msg (msg.id)}
    <Message role={msg.role} parts={msg.parts} />
  {/each}
</div>

<style>
  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
