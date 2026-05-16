<script>
  import { onMount } from 'svelte';
  import { send, on } from './lib/api/vscode';
  import './lib/styles/global.css';

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
  }

  h1 {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
  }
</style>
