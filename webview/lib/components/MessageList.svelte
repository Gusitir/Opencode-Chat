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
  {#if messages.length > 0 && messages[messages.length - 1].role === 'user'}
    <div class="thinking">
      <span>Thinking</span>
      <span class="dots">
        <span>.</span><span>.</span><span>.</span>
      </span>
    </div>
  {/if}
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

  .thinking {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    margin: 4px 0;
    border-radius: 4px;
    background-color: var(--input-bg);
    color: var(--fg);
    font-size: 0.9em;
    align-self: flex-start;
  }

  .dots {
    display: inline-flex;
    gap: 2px;
  }

  .dots span {
    animation: blink 1.4s infinite;
  }

  .dots span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .dots span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes blink {
    0%, 60%, 100% {
      opacity: 0.3;
    }
    30% {
      opacity: 1;
    }
  }
</style>
