'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return <div className="text-muted-foreground italic">No content to preview</div>;

  // Split lines and parse blocks cleanly
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockLines: string[] = [];

  lines.forEach((line, index) => {
    // Code block start / end
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // Ending code block
        elements.push(
          <div key={`code-${index}`} className="my-4 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
            {codeBlockLanguage && (
              <div className="bg-slate-900 px-4 py-1.5 text-xs text-slate-400 font-mono border-b border-slate-800 flex justify-between">
                <span>{codeBlockLanguage}</span>
                <span>snippet</span>
              </div>
            )}
            <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-emerald-400">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLanguage = '';
        codeBlockLines = [];
      } else {
        // Starting code block
        inCodeBlock = true;
        codeBlockLanguage = line.slice(3).trim();
        codeBlockLines = [];
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Headers
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${index}`} className="text-xl md:text-2xl font-bold text-slate-100 mt-6 mb-3 tracking-tight">
          {formatInline(line.slice(2))}
        </h1>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg md:text-xl font-semibold text-slate-100 mt-5 mb-2 tracking-tight">
          {formatInline(line.slice(3))}
        </h2>
      );
      return;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-base md:text-lg font-medium text-indigo-300 mt-4 mb-2">
          {formatInline(line.slice(4))}
        </h3>
      );
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${index}`} className="border-l-4 border-indigo-500 pl-4 py-1 my-3 text-slate-300 italic bg-indigo-950/20 rounded-r">
          {formatInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Bullet list
    if (line.match(/^[\*\-]\s+(.+)/)) {
      const match = line.match(/^[\*\-]\s+(.+)/);
      elements.push(
        <li key={`li-${index}`} className="ml-5 list-disc text-slate-300 my-1 leading-relaxed">
          {formatInline(match ? match[1] : line)}
        </li>
      );
      return;
    }

    // Numbered list
    if (line.match(/^\d+\.\s+(.+)/)) {
      const match = line.match(/^\d+\.\s+(.+)/);
      elements.push(
        <li key={`nli-${index}`} className="ml-5 list-decimal text-slate-300 my-1 leading-relaxed">
          {formatInline(match ? match[1] : line)}
        </li>
      );
      return;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={`empty-${index}`} className="h-3" />);
      return;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${index}`} className="text-slate-300 leading-relaxed my-2 text-sm md:text-base">
        {formatInline(line)}
      </p>
    );
  });

  return <div className="markdown-preview select-text">{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  // Simple regex for bold, inline code, and links
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${match.index}`} className="font-semibold text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`c-${match.index}`}
          className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={`a-${match.index}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
