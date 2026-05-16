<script>
  import { onMount } from 'svelte';
  import { send, on } from './lib/api/vscode';

  let message = 'Opencode Chat — initializing…';

  onMount(() => {
    const unsubscribe = on('state', () => {
      message = 'Connected';
    });
    send({ type: 'ready' });
    return () => unsubscribe();
  });
</script>

<div class="container">
  <h1>{message}</h1>
</div>

<style>
  .container {
    padding: 16px;
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto');
    color: var(--vscode-foreground);
    background-color: var(--vscode-editor-background);
  }

  h1 {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
  }
</style>
