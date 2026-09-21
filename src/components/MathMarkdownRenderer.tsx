'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ZoomIn, RotateCw, X } from 'lucide-react';

interface MathMarkdownRendererProps {
  content: string;
  className?: string;
}

export const MathMarkdownRenderer: React.FC<MathMarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null;

  // Pre-process content: normalize LaTeX block delimiters \[ ... \] to $$ ... $$ and \( ... \) to $ ... $
  const normalizedContent = content
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  return (
    <div className={`prose max-w-none text-slate-900 text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-extrabold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-slate-900 mt-3.5 mb-2 pb-0.5 border-b border-slate-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold text-slate-900 mt-3 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-bold text-slate-900 mt-2.5 mb-1 text-indigo-950">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold text-slate-800 mt-2 mb-1">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-semibold text-slate-700 mt-2 mb-1">
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-slate-800 text-sm my-2">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-800">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-2 pl-1 text-slate-800 text-sm">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 pl-1 text-slate-800 text-sm">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-slate-800">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500 pl-3.5 py-1.5 my-2.5 bg-indigo-50/50 text-slate-700 rounded-r-xl text-sm italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 text-slate-800 font-bold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-200 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-bold text-slate-800">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs text-slate-700">
              {children}
            </td>
          ),
          code: ({ inline, className: codeClassName, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && (match || codeString.includes('\n'))) {
              return <CodeBlock language={match ? match[1] : 'code'} code={codeString} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-slate-100 text-indigo-700 font-mono text-xs border border-slate-200"
                {...props}
              >
                {children}
              </code>
            );
          },
          img: ({ src, alt }: any) => (
            <ZoomableImage src={src} alt={alt} />
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

const ZoomableImage: React.FC<{ src: string; alt?: string }> = ({ src, alt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const fullSrc = src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:'))
    ? src
    : `${baseUrl}${src?.startsWith('/') ? '' : '/'}${src || ''}`;

  return (
    <>
      <span
        className="block my-3 text-center group cursor-zoom-in relative inline-block max-w-full"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={fullSrc}
          alt={alt || 'Hình ảnh minh họa'}
          className="max-h-96 max-w-full rounded-2xl mx-auto border border-slate-200 shadow-xs object-contain group-hover:border-indigo-400 group-hover:shadow-md transition-all duration-200"
          loading="lazy"
        />
        <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 bg-white/90 border border-slate-200 shadow-xs px-2.5 py-0.5 rounded-full mt-1.5 font-semibold group-hover:bg-indigo-50 transition">
          <ZoomIn className="w-3 h-3" />
          <span>{alt || 'Bấm để phóng to ảnh'}</span>
        </span>
      </span>

      {isOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="relative max-w-5xl w-full max-h-[95vh] flex flex-col bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-3.5 px-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="font-bold text-xs text-slate-300 line-clamp-1">{alt || 'Xem ảnh chi tiết'}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 transition cursor-pointer"
                  title="Xoay ảnh 90 độ"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Xoay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1))}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1 transition cursor-pointer"
                  title="Phóng to / Thu nhỏ"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Zoom ({Math.round(zoom * 100)}%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[60vh] bg-slate-950">
              <img
                src={fullSrc}
                alt={alt || 'Xem ảnh'}
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 font-mono">
        <span>{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-xs font-mono">
        <pre>{code}</pre>
      </div>
    </div>
  );
};
