<script lang="ts">
  import { onMount } from 'svelte';
  import { send, on } from './lib/api/vscode';
  import { sessionStore } from './lib/stores/session.svelte';
  import { messagesStore } from './lib/stores/messages.svelte';
  import Chat from './lib/components/Chat.svelte';
  import type { HostToWebview } from '../src/messaging/types';
  import './lib/styles/global.css';

  let connected = $state(false);

  onMount(() => {
    const unsubscribeState = on('state', (msg) => {
      sessionStore.sessions = msg.sessions;
      sessionStore.currentSessionId = msg.currentSessionId;
      connected = true;
    });

    const unsubscribeDelta = on('messageDelta', (msg: Extract<HostToWebview, { type: 'messageDelta' }>) => {
      const existing = messagesStore.messages.find((m) => m.id === msg.messageId);
      if (existing) {
        const idx = existing.parts.findIndex((p) => p.kind === msg.part.kind);
        if (idx !== -1) {
          existing.parts[idx] = msg.part;
        } else {
          existing.parts.push(msg.part);
        }
      } else {
        messagesStore.addMessage({
          id: msg.messageId,
          sessionId: msg.sessionId,
          role: 'assistant',
          parts: [msg.part],
        });
      }
    });

    send({ type: 'ready' });
    return () => {
      unsubscribeState();
      unsubscribeDelta();
    };
  });
</script>

{#if connected}
  <Chat />
{:else}
  <div class="loading">
    <p>Opencode Chat — initializing…</p>
  </div>
{/if}

<style>
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--fg);
  }

  p {
    margin: 0;
  }
</style>
