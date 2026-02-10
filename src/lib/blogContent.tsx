import type { ReactNode } from 'react';

function createTextNode(text: string, key: string): ReactNode {
  return <span key={key}>{text}</span>;
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;
  const nodes: ReactNode[] = [];
  let match: RegExpExecArray | null = null;
  let startIndex = 0;
  let tokenIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    const fullMatch = match[0];
    const matchIndex = match.index;
    if (matchIndex > startIndex) {
      nodes.push(createTextNode(text.slice(startIndex, matchIndex), `${keyPrefix}-text-${tokenIndex}`));
      tokenIndex += 1;
    }

    if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-strong-${tokenIndex}`}>{fullMatch.slice(2, -2)}</strong>);
    } else if (fullMatch.startsWith('*') && fullMatch.endsWith('*')) {
      nodes.push(<em key={`${keyPrefix}-em-${tokenIndex}`}>{fullMatch.slice(1, -1)}</em>);
    } else if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
      nodes.push(<code key={`${keyPrefix}-code-${tokenIndex}`}>{fullMatch.slice(1, -1)}</code>);
    } else {
      const linkMatch = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(fullMatch);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        nodes.push(
          <a key={`${keyPrefix}-link-${tokenIndex}`} href={href} target="_blank" rel="noreferrer">
            {label}
          </a>,
        );
      } else {
        nodes.push(createTextNode(fullMatch, `${keyPrefix}-raw-${tokenIndex}`));
      }
    }

    tokenIndex += 1;
    startIndex = matchIndex + fullMatch.length;
  }

  if (startIndex < text.length) {
    nodes.push(createTextNode(text.slice(startIndex), `${keyPrefix}-tail`));
  }

  return nodes.length > 0 ? nodes : [createTextNode(text, `${keyPrefix}-full`)];
}

export function renderMarkdownLite(content: string): ReactNode[] {
  const blocks = content
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return blocks.map((block, blockIndex) => {
    if (block.startsWith('### ')) {
      return <h3 key={`h3-${blockIndex}`}>{renderInlineMarkdown(block.slice(4), `h3-${blockIndex}`)}</h3>;
    }
    if (block.startsWith('## ')) {
      return <h2 key={`h2-${blockIndex}`}>{renderInlineMarkdown(block.slice(3), `h2-${blockIndex}`)}</h2>;
    }
    if (block.startsWith('# ')) {
      return <h1 key={`h1-${blockIndex}`}>{renderInlineMarkdown(block.slice(2), `h1-${blockIndex}`)}</h1>;
    }

    const lines = block.split('\n').map((line) => line.trimEnd());
    const isUnorderedList = lines.every((line) => /^\s*[-*]\s+/.test(line));
    if (isUnorderedList) {
      return (
        <ul key={`ul-${blockIndex}`}>
          {lines.map((line, lineIndex) => (
            <li key={`ul-${blockIndex}-${lineIndex}`}>
              {renderInlineMarkdown(line.replace(/^\s*[-*]\s+/, ''), `ul-${blockIndex}-${lineIndex}`)}
            </li>
          ))}
        </ul>
      );
    }

    const isOrderedList = lines.every((line) => /^\s*\d+\.\s+/.test(line));
    if (isOrderedList) {
      return (
        <ol key={`ol-${blockIndex}`}>
          {lines.map((line, lineIndex) => (
            <li key={`ol-${blockIndex}-${lineIndex}`}>
              {renderInlineMarkdown(line.replace(/^\s*\d+\.\s+/, ''), `ol-${blockIndex}-${lineIndex}`)}
            </li>
          ))}
        </ol>
      );
    }

    if (lines.every((line) => line.trim().startsWith('> '))) {
      return (
        <blockquote key={`quote-${blockIndex}`}>
          {lines.map((line, lineIndex) => (
            <p key={`quote-${blockIndex}-${lineIndex}`}>
              {renderInlineMarkdown(line.replace(/^\s*>\s?/, ''), `quote-${blockIndex}-${lineIndex}`)}
            </p>
          ))}
        </blockquote>
      );
    }

    return <p key={`p-${blockIndex}`}>{renderInlineMarkdown(block, `p-${blockIndex}`)}</p>;
  });
}

export function formatPublishedDate(value: string | null, long = false): string {
  if (!value) return 'Unscheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: long ? 'long' : 'short',
    day: 'numeric',
  });
}
