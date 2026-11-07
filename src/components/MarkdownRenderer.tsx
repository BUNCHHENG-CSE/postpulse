'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return <div className="text-slate-500 italic text-xs py-2">No content to preview</div>;

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
        const codeText = codeBlockLines.join('\n');
        elements.push(
          <CodeSnippetBlock
            key={`code-${index}`}
            code={codeText}
            language={codeBlockLanguage}
          />
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
        <h1 key={`h1-${index}`} className="text-xl md:text-2xl font-extrabold text-foreground mt-6 mb-3 tracking-tight">
          {formatInline(line.slice(2))}
        </h1>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg md:text-xl font-bold text-foreground/90 mt-5 mb-2 tracking-tight">
          {formatInline(line.slice(3))}
        </h2>
      );
      return;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-base md:text-lg font-bold text-primary mt-4 mb-1.5">
          {formatInline(line.slice(4))}
        </h3>
      );
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${index}`}
          className="border-l-4 border-primary pl-4 py-2 my-3 text-muted-foreground italic bg-muted/40 rounded-r-lg text-sm"
        >
          {formatInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Bullet list
    if (line.match(/^[\*\-]\s+(.+)/)) {
      const match = line.match(/^[\*\-]\s+(.+)/);
      elements.push(
        <li key={`li-${index}`} className="ml-5 list-disc text-foreground/90 my-1 text-sm leading-relaxed">
          {formatInline(match ? match[1] : line)}
        </li>
      );
      return;
    }

    // Numbered list
    if (line.match(/^\d+\.\s+(.+)/)) {
      const match = line.match(/^\d+\.\s+(.+)/);
      elements.push(
        <li key={`nli-${index}`} className="ml-5 list-decimal text-foreground/90 my-1 text-sm leading-relaxed">
          {formatInline(match ? match[1] : line)}
        </li>
      );
      return;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={`empty-${index}`} className="h-2.5" />);
      return;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${index}`} className="text-foreground/90 leading-relaxed my-2 text-sm sm:text-[15px]">
        {formatInline(line)}
      </p>
    );
  });

  return <div className="markdown-preview select-text space-y-0.5">{elements}</div>;
}

function CodeSnippetBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border bg-card shadow-xs">
      <div className="bg-muted/70 px-3.5 py-1.5 text-xs text-muted-foreground font-mono border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span>{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs sm:text-sm font-mono text-foreground/90 bg-muted/20 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
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
        <strong key={`b-${match.index}`} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`c-${match.index}`}
          className="bg-muted border border-border text-primary px-1.5 py-0.5 rounded text-xs font-mono font-medium"
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
            className="text-primary hover:underline underline-offset-2 font-medium"
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
