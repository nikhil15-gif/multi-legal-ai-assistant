import React from 'react';

const BLOCK_START = /^(#{1,6}\s+|[-*]\s+|\d+\.\s+|>\s?|```|---\s*$)/;
const INLINE_TOKEN = /\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)/g;

function renderInline(text, keyPrefix) {
  const nodes = [];
  let cursor = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(INLINE_TOKEN)) {
    const token = match[0];
    const start = match.index;
    if (start > cursor) nodes.push(text.slice(cursor, start));

    const key = `${keyPrefix}-${tokenIndex++}`;
    if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      nodes.push(<code key={key} className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('*') || token.startsWith('_')) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
      if (link) {
        try {
          const url = new URL(link[2]);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            nodes.push(
              <a key={key} href={url.href} target="_blank" rel="noreferrer" className="text-teal-700 dark:text-teal-400 underline underline-offset-2">
                {link[1]}
              </a>
            );
          } else {
            nodes.push(link[1]);
          }
        } catch {
          nodes.push(link[1]);
        }
      } else {
        nodes.push(token);
      }
    }
    cursor = start + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function headingMatch(line) {
  return line.match(/^(#{1,6})\s+(.+)$/);
}

function isBlockStart(line) {
  return BLOCK_START.test(line) || Boolean(headingMatch(line));
}

export default function MarkdownContent({ content }) {
  const lines = String(content || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let index = 0;
  let blockKey = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const key = `markdown-block-${blockKey++}`;
    const heading = headingMatch(line);
    if (heading) {
      const level = Math.min(heading[1].length, 4);
      const Heading = `h${level}`;
      blocks.push(<Heading key={key} className="text-base font-semibold text-slate-900 dark:text-white">{renderInline(heading[2], key)}</Heading>);
      index += 1;
      continue;
    }

    if (/^```/.test(line)) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^\s*```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(<pre key={key} className="overflow-x-auto rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-xs"><code>{codeLines.join('\n')}</code></pre>);
      continue;
    }

    if (/^---\s*$/.test(line)) {
      blocks.push(<hr key={key} className="border-slate-200 dark:border-slate-700" />);
      index += 1;
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      const items = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(/^[-*]\s+(.+)$/);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      blocks.push(
        <ul key={key} className="list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>)}
        </ul>
      );
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      const items = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(/^\d+\.\s+(.+)$/);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }
      blocks.push(
        <ol key={key} className="list-decimal space-y-1 pl-5">
          {items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>)}
        </ol>
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, '').trim());
        index += 1;
      }
      blocks.push(
        <blockquote key={key} className="border-l-2 border-teal-500 pl-3 text-slate-600 dark:text-slate-300">
          {renderInline(quoteLines.join(' '), key)}
        </blockquote>
      );
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={key}>{renderInline(paragraph.join(' '), key)}</p>);
  }

  return <div className="space-y-3">{blocks}</div>;
}
