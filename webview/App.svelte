<script lang="ts">
  import { onMount } from 'svelte';
  import { send, on } from './lib/api/vscode';
  import { sessionStore } from './lib/stores/session.svelte';
  import { messagesStore } from './lib/stores/messages.svelte';
  import Chat from './lib/components/Chat.svelte';
  import type { HostToWebview } from '../src/messaging/types';
  import './lib/styles/global.css';

  let connected = $state(false);
  let error = $state<string | null>(null);

  onMount(() => {
    const unsubscribeState = on('state', (msg) => {
      sessionStore.sessions = msg.sessions;
      sessionStore.currentSessionId = msg.currentSessionId;
      connected = true;
      error = null;
    });

    const unsubscribeDelta = on('messageDelta', (msg: Extract<HostToWebview, { type: 'messageDelta' }>) => {
      const existing = messagesStore.messages.find((m) => m.id === msg.messageId);
      if (existing) {
        const idx = existing.parts.findIndex((p) => p.kind === msg.part.kind);
        if (idx !== -1) {
          const part = existing.parts[idx];
          if (part.kind === 'text' && msg.part.kind === 'text') {
            part.text += msg.part.text;
          } else {
            existing.parts[idx] = msg.part;
          }
          existing.parts = [...existing.parts];
        } else {
          existing.parts = [...existing.parts, msg.part];
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

    const unsubscribeError = on('error', (msg: Extract<HostToWebview, { type: 'error' }>) => {
      error = msg.message;
    });

    send({ type: 'ready' });
    return () => {
      unsubscribeState();
      unsubscribeDelta();
      unsubscribeError();
    };
  });
</script>

{#if connected}
  <Chat {error} />
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
