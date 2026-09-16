import { useState, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CodeBlock = memo(function CodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const textContent = String(children).replace(/\n$/, '');

  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded-md bg-neutral-800 text-amber-200 font-mono text-xs border border-neutral-700/60"
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800/80 text-neutral-400">
        <span className="text-[11px] font-medium tracking-wide uppercase">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3 overflow-x-auto text-neutral-200 leading-relaxed font-mono">
        <pre>{children}</pre>
      </div>
    </div>
  );
});

const markdownComponents = {
  code: CodeBlock as any,
  p: ({ children }: any) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 my-2 space-y-1 text-neutral-200">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 my-2 space-y-1 text-neutral-200">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }: any) => (
    <h1 className="text-xl font-bold text-white mt-4 mb-2 pb-1 border-b border-neutral-800">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-lg font-semibold text-white mt-3 mb-1.5">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-base font-semibold text-neutral-100 mt-2.5 mb-1">
      {children}
    </h3>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-2 border-amber-500/60 pl-3 my-2 text-neutral-300 italic">
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full text-left border-collapse border border-neutral-800 text-xs sm:text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-neutral-850 border-b border-neutral-800">{children}</thead>,
  th: ({ children }: any) => (
    <th className="px-3 py-2 font-semibold text-neutral-300 border border-neutral-800">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-1.5 text-neutral-300 border border-neutral-800">
      {children}
    </td>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  ),
};

export const MarkdownRenderer = memo(function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content text-sm sm:text-base leading-relaxed text-neutral-200 space-y-2.5 break-words">
      <ReactMarkdown components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
