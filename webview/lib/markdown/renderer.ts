import { marked } from 'marked';

const renderer = {
  code({ text, lang }: { text: string; lang?: string }): string {
    return `<pre data-lang="${lang || 'text'}">${escapeHtml(text)}</pre>`;
  },
};

marked.setOptions({
  renderer,
  gfm: true,
});

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function renderMarkdown(markdown: string): string {
  return marked(markdown);
}
