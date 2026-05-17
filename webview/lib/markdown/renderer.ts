import { marked } from 'marked';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

marked.use({
  renderer: {
    code(this: unknown, { text, lang }: { text: string; lang?: string }): string {
      return `<pre data-lang="${lang || 'text'}">${escapeHtml(text)}</pre>`;
    },
  },
  gfm: true,
});

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
