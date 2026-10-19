const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

const decode = (text: string) => text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m);
const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function htmlToMarkup(html: string | null | undefined) {
  if (!html) return '';
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;
  const lists: { ordered: boolean; next: number }[] = [];
  let inItem = false;
  const text = html
    .replace(/\r/g, '')
    .replace(/<\s*(\/?)\s*([a-z0-9]+)\b[^>]*>/gi, (_m, slash: string, raw: string) => {
      const tag = raw.toLowerCase();
      const closing = slash === '/';
      if (tag === 'strong' || tag === 'b') return '**';
      if (tag === 'em' || tag === 'i') return '_';
      if (tag === 'ul' || tag === 'ol') {
        if (closing) lists.pop();
        else lists.push({ ordered: tag === 'ol', next: 1 });
        return '\n';
      }
      if (tag === 'li') {
        if (closing) {
          inItem = false;
          return '';
        }
        inItem = true;
        const list = lists.at(-1);
        return list?.ordered ? `\n${list.next++}. ` : '\n- ';
      }
      if (tag === 'br') return '\n';
      if (closing && (tag === 'p' || tag === 'div' || /^h\d$/.test(tag))) return inItem ? '' : '\n\n';
      return '';
    });
  return decode(text)
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const inlineHtml = (text: string) =>
  escape(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])_(.+?)_(?=[^\w]|$)/g, '$1<em>$2</em>');

export function markupToHtml(markup: string) {
  const lines = markup.replace(/\r/g, '').split('\n');
  const html: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  const close = () => {
    if (list) html.push(`</${list}>`);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const number = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || number) {
      const kind = bullet ? 'ul' : 'ol';
      if (list !== kind) {
        close();
        html.push(`<${kind}>`);
        list = kind;
      }
      html.push(`<li><p>${inlineHtml((bullet ?? number)![1]!)}</p></li>`);
      continue;
    }
    close();
    if (line.trim()) html.push(`<p>${inlineHtml(line)}</p>`);
  }
  close();
  return html.length ? html.join('') : null;
}

export interface InlineRun {
  text: string;
  bold: boolean;
  italic: boolean;
}

export function inlineRuns(text: string): InlineRun[] {
  const runs: InlineRun[] = [];
  const pattern = /\*\*(.+?)\*\*|(^|[^\w])_(.+?)_(?=[^\w]|$)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (match[1] !== undefined) {
      if (at > last) runs.push({ text: text.slice(last, at), bold: false, italic: false });
      runs.push({ text: match[1], bold: true, italic: false });
    } else {
      const lead = match[2] ?? '';
      if (at + lead.length > last)
        runs.push({ text: text.slice(last, at + lead.length), bold: false, italic: false });
      runs.push({ text: match[3] ?? '', bold: false, italic: true });
    }
    last = at + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), bold: false, italic: false });
  return runs;
}
