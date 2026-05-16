<script>
  import { onMount } from 'svelte';
  import { send, on } from './lib/api/vscode';
  import { sessionStore } from './lib/stores/session.svelte';
  import Chat from './lib/components/Chat.svelte';
  import './lib/styles/global.css';

  let connected = $state(false);

  onMount(() => {
    const unsubscribe = on('state', (msg) => {
      sessionStore.sessions = msg.sessions;
      sessionStore.currentSessionId = msg.currentSessionId;
      connected = true;
    });
    send({ type: 'ready' });
    return () => unsubscribe();
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
