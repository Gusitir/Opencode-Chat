<script lang="ts">
  import { onMount } from 'svelte';
  import { codeToHtml } from 'shiki';

  interface Props {
    code: string;
    lang?: string;
  }

  let { code, lang = 'text' } = $props();
  let html = $state('');

  onMount(async () => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = isDark ? 'vitesse-dark' : 'vitesse-light';

    try {
      html = await codeToHtml(code, {
        lang: lang,
        theme: theme,
      });
    } catch {
      html = `<pre>${code}</pre>`;
    }
  });
</script>

{#if html}
  {@html html}
{:else}
  <pre>{code}</pre>
{/if}

<style>
  :global(pre) {
    margin: 0;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.9em;
    line-height: 1.5;
  }
</style>
