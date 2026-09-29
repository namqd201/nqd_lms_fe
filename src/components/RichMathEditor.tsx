'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import katex from 'katex';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import { InteractiveMathCalculator } from '@/components/InteractiveMathCalculator';
import { mediaService } from '@/services/media.service';
import {
  Image as ImageIcon,
  Eye,
  Code,
  Sparkles,
  Loader2,
  Check,
  X,
  Calculator,
  Trash2,
  BookOpen,
  Edit2,
  Info,
} from 'lucide-react';

interface RichMathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  label?: string;
  compact?: boolean;
  allowImageUpload?: boolean;
  helperText?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

interface FormulaItem {
  label: string;
  display: string;
  snippet: string;
  tooltip: string;
  isTemplate?: boolean; // opens calculator with preloaded template
}

const FORMULA_CATEGORIES: { id: string; name: string; items: FormulaItem[] }[] = [
  {
    id: 'basic',
    name: 'Toán cơ bản',
    items: [
      { label: 'Phân số', display: 'a/b', snippet: '\\frac{#?}{#?}', tooltip: 'Phân số a/b', isTemplate: true },
      { label: 'Căn bậc 2', display: '√x', snippet: '\\sqrt{#?}', tooltip: 'Căn bậc hai √x', isTemplate: true },
      {
        label: 'Căn bình phương',
        display: '√( )²',
        snippet: '\\sqrt{(#?)^2}',
        tooltip: 'Căn bậc hai chứa bình phương bên trong: √( ... )² (Đề thi Toán 9)',
        isTemplate: true,
      },
      {
        label: 'Căn hiệu bình phương',
        display: '√(a-b)²',
        snippet: '\\sqrt{(#? - #?)^2}',
        tooltip: 'Căn bậc hai rút gọn dạng √(a - b)²',
        isTemplate: true,
      },
      { label: 'Căn bậc n', display: 'ⁿ√x', snippet: '\\sqrt[#?]{#?}', tooltip: 'Căn bậc n', isTemplate: true },
      { label: 'Bình phương', display: 'x²', snippet: '^{2}', tooltip: 'Bình phương', isTemplate: true },
      { label: 'Lũy thừa n', display: 'xʸ', snippet: '^{#?}', tooltip: 'Lũy thừa tùy ý', isTemplate: true },
      { label: 'Chỉ số dưới', display: 'x₁', snippet: '_{#?}', tooltip: 'Chỉ số dưới', isTemplate: true },
      { label: 'Trị tuyệt đối', display: '|x|', snippet: '|#?|', tooltip: 'Giá trị tuyệt đối', isTemplate: true },
      { label: 'Cộng trừ', display: '±', snippet: '±', tooltip: 'Dấu cộng trừ' },
      { label: 'Nhân', display: '×', snippet: '×', tooltip: 'Dấu nhân' },
      { label: 'Chia', display: '÷', snippet: '÷', tooltip: 'Dấu chia' },
      { label: 'Gần bằng', display: '≈', snippet: '≈', tooltip: 'Gần bằng' },
      { label: 'Khác', display: '≠', snippet: '≠', tooltip: 'Khác nhau' },
      { label: 'Nhỏ hơn bằng', display: '≤', snippet: '≤', tooltip: 'Nhỏ hơn hoặc bằng' },
      { label: 'Lớn hơn bằng', display: '≥', snippet: '≥', tooltip: 'Lớn hơn hoặc bằng' },
      { label: 'Vô cực', display: '∞', snippet: '∞', tooltip: 'Vô cực' },
    ],
  },
  {
    id: 'advanced',
    name: 'Giải tích & Logarit',
    items: [
      {
        label: 'Logarit cơ số a',
        display: 'logₐb',
        snippet: '\\log_{#?}(#?)',
        tooltip: 'Logarit cơ số a của b',
        isTemplate: true,
      },
      { label: 'Logarit tự nhiên', display: 'ln(x)', snippet: '\\ln(#?)', tooltip: 'Logarit tự nhiên ln(x)', isTemplate: true },
      { label: 'Logarit thập phân', display: 'log(x)', snippet: '\\log(#?)', tooltip: 'Logarit thập phân log(x)', isTemplate: true },
      {
        label: 'Tích phân xác định',
        display: '∫[a,b]',
        snippet: '\\int_{#?}^{#?} #? dx',
        tooltip: 'Tích phân cận từ a đến b',
        isTemplate: true,
      },
      { label: 'Tích phân bất định', display: '∫ f(x)dx', snippet: '\\int #? dx', tooltip: 'Tích phân không cận', isTemplate: true },
      { label: 'Đạo hàm', display: 'df/dx', snippet: '\\frac{d#?}{dx}', tooltip: 'Đạo hàm', isTemplate: true },
      { label: 'Giới hạn', display: 'lim', snippet: '\\lim_{x \\to #?} #?', tooltip: 'Giới hạn hàm số', isTemplate: true },
      { label: 'Tổng Sigma', display: '∑', snippet: '\\sum_{i=1}^{n} #?', tooltip: 'Tổng chuỗi Sigma', isTemplate: true },
      {
        label: 'Hệ phương trình',
        display: '{Hệ PT',
        snippet: '\\begin{cases} #? \\\\ #? \\end{cases}',
        tooltip: 'Hệ phương trình nhiều ẩn',
        isTemplate: true,
      },
    ],
  },
  {
    id: 'physics',
    name: 'Vật lý & Ký hiệu',
    items: [
      { label: 'Điện trở Ohm', display: 'Ω (Ohm)', snippet: 'R = #?\\,\\Omega', tooltip: 'Ký hiệu Ohm điện trở', isTemplate: true },
      { label: 'Micro', display: 'μ (micro)', snippet: 'μ', tooltip: 'Tiền tố micro' },
      { label: 'Bước sóng', display: 'λ (lambda)', snippet: 'λ', tooltip: 'Bước sóng lambda' },
      { label: 'Tần số góc', display: 'ω (omega)', snippet: 'ω', tooltip: 'Tần số góc omega' },
      { label: 'Độ biến thiên', display: 'Δ (delta)', snippet: 'Δ', tooltip: 'Độ biến thiên Delta' },
      { label: 'Vectơ', display: 'v⃗', snippet: '\\vec{#?}', tooltip: 'Đại lượng vectơ', isTemplate: true },
      { label: 'Góc', display: '∠ABC', snippet: '\\widehat{#?}', tooltip: 'Góc hình học', isTemplate: true },
      { label: 'Độ C', display: '°C', snippet: '°C', tooltip: 'Độ nhiệt độ Celsius' },
      { label: 'Gia tốc', display: 'm/s²', snippet: 'm/s²', tooltip: 'Đơn vị gia tốc' },
      { label: 'Lực Newton', display: 'N', snippet: 'F = #?\\,\\text{N}', tooltip: 'Đơn vị lực Newton', isTemplate: true },
      { label: 'Alpha', display: 'α', snippet: 'α', tooltip: 'Ký hiệu Alpha' },
      { label: 'Beta', display: 'β', snippet: 'β', tooltip: 'Ký hiệu Beta' },
      { label: 'Pi', display: 'π', snippet: 'π', tooltip: 'Số Pi' },
      { label: 'Theta', display: 'θ', snippet: 'θ', tooltip: 'Góc Theta' },
    ],
  },
];

// Helper to escape HTML characters
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Helper to render KaTeX safely
function renderKatexHtml(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return `<span class="text-rose-500 font-mono text-xs">[Lỗi công thức: ${escapeHtml(latex)}]</span>`;
  }
}

// Convert Markdown to WYSIWYG ContentEditable HTML
function markdownToWysiwygHtml(md: string): string {
  if (!md) return '';

  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|!\[(.*?)\]\((.*?)\)|\$([^$\n]+?)\$|\\\(([\s\S]*?)\\\))/g;
  let lastIndex = 0;
  let html = '';
  let match: RegExpExecArray | null;

  while ((match = regex.exec(md)) !== null) {
    if (match.index > lastIndex) {
      const text = md.slice(lastIndex, match.index);
      html += escapeHtml(text).replace(/\n/g, '<br>');
    }

    const token = match[0];
    if (token.startsWith('$$') || token.startsWith('\\[')) {
      const latex = token.startsWith('$$')
        ? token.slice(2, -2).trim()
        : token.slice(2, -2).trim();
      const rendered = renderKatexHtml(latex, true);
      html += `<div class="math-chip-block my-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/90 text-center select-none cursor-pointer hover:bg-indigo-100/70 hover:border-indigo-400 transition shadow-2xs group relative" contenteditable="false" data-latex="${escapeHtml(latex)}" data-math-type="block"><div class="katex-content pointer-events-none">${rendered}</div><div class="absolute top-1.5 right-2 opacity-0 group-hover:opacity-100 text-[10px] text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-lg font-sans font-bold transition shadow-xs">✎ Bấm để sửa</div></div>`;
    } else if (token.startsWith('![')) {
      const alt = match[2] || 'hình ảnh';
      const src = match[3] || '';
      html += `<span class="image-chip inline-block my-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 select-none relative group" contenteditable="false" data-src="${escapeHtml(src)}" data-alt="${escapeHtml(alt)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="max-h-40 rounded-lg shadow-xs pointer-events-none object-contain" /><button type="button" class="del-img-btn absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shadow hover:bg-rose-700 cursor-pointer" title="Xóa ảnh">×</button></span>`;
    } else {
      const latex = token.startsWith('$')
        ? token.slice(1, -1).trim()
        : token.slice(2, -2).trim();
      const rendered = renderKatexHtml(latex, false);
      html += `<span class="math-chip-inline inline-flex items-center align-middle mx-1 my-0.5 px-2 py-0.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-serif select-none cursor-pointer hover:bg-indigo-100 hover:border-indigo-400 transition shadow-2xs group" contenteditable="false" data-latex="${escapeHtml(latex)}" data-math-type="inline"><span class="katex-content pointer-events-none">${rendered}</span><span class="edit-badge ml-1.5 opacity-0 group-hover:opacity-100 text-[10px] text-indigo-700 bg-white border border-indigo-200 px-1 py-0.2 rounded font-sans font-bold transition">✎ Sửa</span></span>`;
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < md.length) {
    const text = md.slice(lastIndex);
    html += escapeHtml(text).replace(/\n/g, '<br>');
  }

  return html;
}

// Convert WYSIWYG DOM back to clean Markdown
function wysiwygDomToMarkdown(rootNode: HTMLElement): string {
  let result = '';

  function traverse(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || '';
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;

      // Inline math chip
      if (el.classList.contains('math-chip-inline')) {
        const latex = el.getAttribute('data-latex') || '';
        result += ` $${latex}$ `;
        return;
      }

      // Block math chip
      if (el.classList.contains('math-chip-block')) {
        const latex = el.getAttribute('data-latex') || '';
        result += `\n\n$$\n${latex}\n$$\n\n`;
        return;
      }

      // Image chip
      if (el.classList.contains('image-chip')) {
        const src = el.getAttribute('data-src') || '';
        const alt = el.getAttribute('data-alt') || 'ảnh minh họa';
        result += `\n![${alt}](${src})\n`;
        return;
      }

      // Line break
      if (el.tagName === 'BR') {
        result += '\n';
        return;
      }

      // Block tags
      const isBlock = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName);
      for (let i = 0; i < el.childNodes.length; i++) {
        traverse(el.childNodes[i]);
      }
      if (isBlock && el !== rootNode && el.nextSibling) {
        result += '\n';
      }
    }
  }

  for (let i = 0; i < rootNode.childNodes.length; i++) {
    traverse(rootNode.childNodes[i]);
  }

  // Clean extra spaces & newlines
  return result
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function RichMathEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung câu hỏi, chèn công thức toán học và ảnh minh họa trực tiếp...',
  minRows = 4,
  label,
  compact = false,
  allowImageUpload = true,
  helperText,
  required = false,
  className = '',
  disabled = false,
}: RichMathEditorProps) {
  // Mode: 'wysiwyg' (Soạn trực quan - Default), 'code' (Mã nguồn LaTeX), 'preview' (Xem mẫu hoàn chỉnh)
  const [mode, setMode] = useState<'wysiwyg' | 'code' | 'preview'>('wysiwyg');
  const [activeCategory, setActiveCategory] = useState<string>('basic');

  // Math Calculator Modal
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [calculatorInitialValue, setCalculatorInitialValue] = useState<string>('');
  const [editingChip, setEditingChip] = useState<HTMLElement | null>(null);

  // Floating Chip Action Bar
  const [selectedChip, setSelectedChip] = useState<HTMLElement | null>(null);
  const [chipPosition, setChipPosition] = useState<{ top: number; left: number } | null>(null);

  // AI Formula Modal
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiResult, setAiResult] = useState<string | null>(null);

  // Image Uploading
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  // Sync external value to WYSIWYG DOM when mounted or when mode changes to wysiwyg
  useEffect(() => {
    if (mode === 'wysiwyg' && editorRef.current) {
      const currentMd = wysiwygDomToMarkdown(editorRef.current);
      if (currentMd !== value.trim()) {
        editorRef.current.innerHTML = markdownToWysiwygHtml(value);
      }
    }
  }, [mode, value]);

  // Save current selection range in WYSIWYG editor
  const saveSelection = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  // Restore saved selection
  const restoreSelection = useCallback(() => {
    if (typeof window === 'undefined' || !savedRangeRef.current) return false;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      return true;
    }
    return false;
  }, []);

  // Insert rendered Math Chip into WYSIWYG DOM
  const insertMathChipIntoWysiwyg = useCallback(
    (latex: string, isBlock: boolean = false) => {
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();
      restoreSelection();

      const sel = window.getSelection();
      let range: Range;
      if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        range = sel.getRangeAt(0);
        range.deleteContents();
      } else {
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
      }

      const chip = document.createElement(isBlock ? 'div' : 'span');
      if (isBlock) {
        chip.className =
          'math-chip-block my-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/90 text-center select-none cursor-pointer hover:bg-indigo-100/70 hover:border-indigo-400 transition shadow-2xs group relative';
        chip.setAttribute('contenteditable', 'false');
        chip.setAttribute('data-latex', latex);
        chip.setAttribute('data-math-type', 'block');
        chip.innerHTML = `<div class="katex-content pointer-events-none">${renderKatexHtml(latex, true)}</div><div class="absolute top-1.5 right-2 opacity-0 group-hover:opacity-100 text-[10px] text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-lg font-sans font-bold transition shadow-xs">✎ Bấm để sửa</div>`;
      } else {
        chip.className =
          'math-chip-inline inline-flex items-center align-middle mx-1 my-0.5 px-2 py-0.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-serif select-none cursor-pointer hover:bg-indigo-100 hover:border-indigo-400 transition shadow-2xs group';
        chip.setAttribute('contenteditable', 'false');
        chip.setAttribute('data-latex', latex);
        chip.setAttribute('data-math-type', 'inline');
        chip.innerHTML = `<span class="katex-content pointer-events-none">${renderKatexHtml(latex, false)}</span><span class="edit-badge ml-1.5 opacity-0 group-hover:opacity-100 text-[10px] text-indigo-700 bg-white border border-indigo-200 px-1 py-0.2 rounded font-sans font-bold transition">✎ Sửa</span>`;
      }

      range.insertNode(chip);

      // Add a trailing space so teacher can continue typing immediately
      const space = document.createTextNode(' ');
      chip.after(space);

      // Move caret after the space
      range.setStartAfter(space);
      range.setEndAfter(space);
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }

      // Sync Markdown to parent
      const newMd = wysiwygDomToMarkdown(editor);
      onChange(newMd);
    },
    [onChange, restoreSelection]
  );

  // Insert text / snippet into Code mode or WYSIWYG mode
  const insertSnippet = useCallback(
    (snippet: string) => {
      if (mode === 'code') {
        const textarea = textareaRef.current;
        if (!textarea) {
          onChange(value + snippet);
          return;
        }
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = textarea.value;
        const nextValue = currentValue.substring(0, start) + snippet + currentValue.substring(end);
        onChange(nextValue);
        setTimeout(() => {
          textarea.focus();
          const nextCursor = start + snippet.length;
          textarea.setSelectionRange(nextCursor, nextCursor);
        }, 0);
      } else {
        // WYSIWYG mode: insert text at selection
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();
        restoreSelection();

        const sel = window.getSelection();
        let range: Range;
        if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
          range = sel.getRangeAt(0);
          range.deleteContents();
        } else {
          range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
        }

        const textNode = document.createTextNode(snippet);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }

        onChange(wysiwygDomToMarkdown(editor));
      }
    },
    [mode, value, onChange, restoreSelection]
  );

  // Handle clicking on a toolbar formula button
  const handleFormulaButtonClick = (item: FormulaItem) => {
    saveSelection();
    if (item.isTemplate) {
      // Open visual math calculator with preloaded template!
      setEditingChip(null);
      setCalculatorInitialValue(item.snippet);
      setShowCalculator(true);
    } else {
      // Direct text / symbol insertion (e.g. ±, ×, ÷, π, α, β)
      insertSnippet(item.snippet);
    }
  };

  // Open calculator for blank formula or selected text
  const handleOpenBlankCalculator = () => {
    saveSelection();
    setEditingChip(null);
    setCalculatorInitialValue('');
    setShowCalculator(true);
  };

  // Handle clicking on elements inside the WYSIWYG editor
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Check if clicked image delete button
    if (target.classList.contains('del-img-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const chip = target.closest('.image-chip');
      if (chip && editorRef.current) {
        chip.remove();
        onChange(wysiwygDomToMarkdown(editorRef.current));
      }
      return;
    }

    // Check if clicked on a math chip
    const mathChip = target.closest('.math-chip-inline, .math-chip-block') as HTMLElement | null;
    if (mathChip && editorRef.current) {
      e.preventDefault();
      e.stopPropagation();

      // Highlight selected chip
      document.querySelectorAll('.math-chip-active').forEach((el) => {
        el.classList.remove('math-chip-active', 'ring-2', 'ring-indigo-500', 'bg-indigo-100');
      });
      mathChip.classList.add('math-chip-active', 'ring-2', 'ring-indigo-500', 'bg-indigo-100');

      setSelectedChip(mathChip);
      const rect = mathChip.getBoundingClientRect();
      const parentRect = editorRef.current.getBoundingClientRect();
      setChipPosition({
        top: rect.bottom - parentRect.top + 6,
        left: Math.max(8, rect.left - parentRect.left),
      });
      return;
    }

    // Clicked elsewhere in editor: deselect chip
    setSelectedChip(null);
    setChipPosition(null);
    document.querySelectorAll('.math-chip-active').forEach((el) => {
      el.classList.remove('math-chip-active', 'ring-2', 'ring-indigo-500', 'bg-indigo-100');
    });
  };

  // Double click on a math chip: directly edit it!
  const handleEditorDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const mathChip = target.closest('.math-chip-inline, .math-chip-block') as HTMLElement | null;
    if (mathChip) {
      e.preventDefault();
      e.stopPropagation();
      const latex = mathChip.getAttribute('data-latex') || '';
      setEditingChip(mathChip);
      setCalculatorInitialValue(latex);
      setShowCalculator(true);
    }
  };

  // Handle calculator confirm (for new chip OR updating existing chip)
  const handleCalculatorConfirm = (latex: string) => {
    if (editingChip && editorRef.current) {
      // Update existing chip in-place
      editingChip.setAttribute('data-latex', latex);
      const isBlock = editingChip.getAttribute('data-math-type') === 'block';
      const rendered = renderKatexHtml(latex, isBlock);
      const contentEl = editingChip.querySelector('.katex-content');
      if (contentEl) {
        contentEl.innerHTML = rendered;
      }
      setEditingChip(null);
      setSelectedChip(null);
      setChipPosition(null);
      onChange(wysiwygDomToMarkdown(editorRef.current));
    } else {
      // Insert brand new chip at saved selection
      const isBlock = latex.includes('\\begin{cases}') || latex.includes('\\begin{pmatrix}');
      insertMathChipIntoWysiwyg(latex, isBlock);
    }
    setShowCalculator(false);
  };

  // Handle native typing in WYSIWYG ContentEditable
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    saveSelection();
    const md = wysiwygDomToMarkdown(editorRef.current);
    onChange(md);
  };

  // Auto-convert typing $formula$ into rendered math chip upon typing closing $
  const handleEditorKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '$' || e.key === ' ') {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const text = node.textContent.slice(0, range.startOffset);
        const match = text.match(/\$([^$]+)\$$/);
        if (match) {
          const rawLatex = match[1].trim();
          if (rawLatex && editorRef.current) {
            const fullText = node.textContent;
            const matchIndex = text.lastIndexOf(match[0]);
            const beforeText = fullText.slice(0, matchIndex);
            const afterText = fullText.slice(range.startOffset);

            const parent = node.parentNode;
            if (parent) {
              const beforeNode = document.createTextNode(beforeText);
              const chip = document.createElement('span');
              chip.className =
                'math-chip-inline inline-flex items-center align-middle mx-1 my-0.5 px-2 py-0.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-serif select-none cursor-pointer hover:bg-indigo-100 hover:border-indigo-400 transition shadow-2xs group';
              chip.setAttribute('contenteditable', 'false');
              chip.setAttribute('data-latex', rawLatex);
              chip.setAttribute('data-math-type', 'inline');
              chip.innerHTML = `<span class="katex-content pointer-events-none">${renderKatexHtml(rawLatex, false)}</span><span class="edit-badge ml-1.5 opacity-0 group-hover:opacity-100 text-[10px] text-indigo-700 bg-white border border-indigo-200 px-1 py-0.2 rounded font-sans font-bold transition">✎ Sửa</span>`;

              const afterNode = document.createTextNode(afterText || ' ');

              parent.replaceChild(afterNode, node);
              parent.insertBefore(chip, afterNode);
              if (beforeText) {
                parent.insertBefore(beforeNode, chip);
              }

              // Set caret after the chip
              const newRange = document.createRange();
              newRange.setStart(afterNode, 1);
              newRange.setEnd(afterNode, 1);
              sel.removeAllRanges();
              sel.addRange(newRange);

              onChange(wysiwygDomToMarkdown(editorRef.current));
            }
          }
        }
      }
    }
  };

  // Image Uploading
  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Chỉ hỗ trợ tải lên tệp định dạng hình ảnh (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const res = await mediaService.uploadImage(file);
      if (mode === 'wysiwyg' && editorRef.current) {
        // Insert image chip into WYSIWYG
        const editor = editorRef.current;
        editor.focus();
        restoreSelection();
        const sel = window.getSelection();
        let range: Range;
        if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
          range = sel.getRangeAt(0);
          range.deleteContents();
        } else {
          range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
        }

        const altName = file.name.replace(/\.[^/.]+$/, '');
        const imageChip = document.createElement('span');
        imageChip.className =
          'image-chip inline-block my-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 select-none relative group';
        imageChip.setAttribute('contenteditable', 'false');
        imageChip.setAttribute('data-src', res.url);
        imageChip.setAttribute('data-alt', altName);
        imageChip.innerHTML = `<img src="${res.url}" alt="${altName}" class="max-h-40 rounded-lg shadow-xs pointer-events-none object-contain" /><button type="button" class="del-img-btn absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shadow hover:bg-rose-700 cursor-pointer" title="Xóa ảnh">×</button>`;

        range.insertNode(imageChip);
        const space = document.createTextNode(' ');
        imageChip.after(space);
        range.setStartAfter(space);
        range.setEndAfter(space);
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
        onChange(wysiwygDomToMarkdown(editor));
      } else {
        const imageSnippet = `\n![${file.name.replace(/\.[^/.]+$/, '')}](${res.url})\n`;
        insertSnippet(imageSnippet);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Không thể tải lên hình ảnh. Vui lòng thử lại.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
  };

  // Support paste image from clipboard
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleUploadFile(file);
          return;
        }
      }
    }
  };

  // AI Rule-based formula assistant
  const handleGenerateFormula = () => {
    if (!aiPrompt.trim()) return;
    const prompt = aiPrompt.toLowerCase().trim();
    let generated = '';

    if (prompt.includes('tích phân') || prompt.includes('integral')) {
      generated = '\\int_{0}^{1} x^2 dx';
    } else if (prompt.includes('phân số')) {
      generated = '\\frac{a}{b}';
    } else if (prompt.includes('căn')) {
      generated = '\\sqrt{(\\sqrt{3} - \\sqrt{2})^2}';
    } else if (prompt.includes('log') || prompt.includes('logarit')) {
      generated = '\\log_{a}(b)';
    } else if (prompt.includes('hệ phương trình') || prompt.includes('he pt')) {
      generated = '\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}';
    } else {
      generated = aiPrompt.trim();
    }
    setAiResult(generated);
  };

  return (
    <div className={`space-y-2 font-sans ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Soạn thảo trực quan WYSIWYG chuẩn Word &amp; Notion
          </span>
        </div>
      )}

      {/* Editor Main Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden focus-within:border-indigo-500 transition-all relative">
        {/* Main Toolbar */}
        <div className="bg-slate-50/90 border-b border-slate-200/90 p-2 flex flex-wrap items-center justify-between gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('wysiwyg')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'wysiwyg' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Soạn thảo trực quan: Ký hiệu toán học và hình ảnh hiển thị trực tiếp"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Soạn trực quan (WYSIWYG)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('code')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'code' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem và chỉnh sửa trực tiếp mã LaTeX / Markdown"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Mã nguồn (LaTeX)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem trước kết quả hiển thị trên bài thi của học sinh"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Xem trước mẫu</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Online Math Calculator Main Button */}
            <button
              type="button"
              onClick={handleOpenBlankCalculator}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
              title="Mở máy tính trực quan để gõ và bấm như Casio / Google Calculator"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>🧮 Máy tính online</span>
            </button>

            {/* Image Upload Button */}
            {allowImageUpload && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Chèn ảnh minh họa đồ thị, hình vẽ, mạch điện"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>Đang tải...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Chèn ảnh</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* AI Formula Generator */}
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 hover:bg-purple-100 text-purple-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Nhờ AI chuyển mô tả tiếng Việt thành công thức toán"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">AI Công thức</span>
            </button>
          </div>
        </div>

        {/* Formulas Toolbar (Active in WYSIWYG & Code modes) */}
        {mode !== 'preview' && (
          <div className="bg-slate-100/70 border-b border-slate-200/70 px-2 py-1.5 space-y-1.5">
            {!compact ? (
              <>
                {/* Category Tabs */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
                  <div className="flex items-center gap-1 shrink-0">
                    {FORMULA_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                          activeCategory === cat.id
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    💡 Click ký hiệu để chèn hoặc gõ <code>$công_thức$</code>
                  </span>
                </div>

                {/* Symbols in active category */}
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {FORMULA_CATEGORIES.find((c) => c.id === activeCategory)?.items.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleFormulaButtonClick(item)}
                      className={`px-2.5 py-1 bg-white hover:bg-indigo-50 border rounded-lg text-xs font-mono font-bold transition shadow-2xs cursor-pointer hover:scale-105 transform active:scale-95 flex items-center gap-1 ${
                        item.isTemplate
                          ? 'border-indigo-200 text-indigo-900 bg-indigo-50/30'
                          : 'border-slate-200/80 text-slate-800'
                      }`}
                      title={item.tooltip + (item.isTemplate ? ' (Mở máy tính trực quan)' : '')}
                    >
                      <span>{item.display}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* Compact Quick Bar */
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => handleFormulaButtonClick({ label: 'Phân số', display: 'a/b', snippet: '\\frac{#?}{#?}', tooltip: 'Phân số', isTemplate: true })}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                >
                  a/b
                </button>
                <button
                  type="button"
                  onClick={() => handleFormulaButtonClick({ label: 'Căn bậc 2', display: '√x', snippet: '\\sqrt{#?}', tooltip: 'Căn bậc 2', isTemplate: true })}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                >
                  √x
                </button>
                <button
                  type="button"
                  onClick={() => handleFormulaButtonClick({ label: 'Căn bình phương', display: '√( )²', snippet: '\\sqrt{(#?)^2}', tooltip: 'Căn bình phương', isTemplate: true })}
                  className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-mono font-bold hover:bg-amber-100 cursor-pointer shrink-0"
                >
                  √( )²
                </button>
                <button
                  type="button"
                  onClick={() => handleFormulaButtonClick({ label: 'Logarit', display: 'logₐb', snippet: '\\log_{#?}(#?)', tooltip: 'Logarit', isTemplate: true })}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                >
                  logₐb
                </button>
                <button
                  type="button"
                  onClick={() => handleFormulaButtonClick({ label: 'Tích phân', display: '∫', snippet: '\\int_{#?}^{#?} #? dx', tooltip: 'Tích phân', isTemplate: true })}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                >
                  ∫
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="p-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
            <span>{uploadError}</span>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-rose-600 hover:text-rose-900 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Editor Body Area */}
        <div className="relative min-h-[140px]">
          {/* 1. WYSIWYG Mode (Default) */}
          {mode === 'wysiwyg' && (
            <div className="relative p-4">
              <div
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleEditorInput}
                onClick={handleEditorClick}
                onDoubleClick={handleEditorDoubleClick}
                onKeyUp={handleEditorKeyUp}
                onPaste={handlePaste}
                className={`w-full min-h-[120px] outline-none text-slate-900 leading-relaxed text-sm font-sans focus:outline-none ${
                  disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
                }`}
                style={{ wordBreak: 'break-word' }}
              />

              {/* Floating Action Menu for Selected Math Chip */}
              {selectedChip && chipPosition && (
                <div
                  className="absolute z-20 flex items-center gap-1.5 p-1.5 bg-slate-900 text-white rounded-xl shadow-xl text-xs animate-in fade-in zoom-in-95"
                  style={{ top: chipPosition.top, left: chipPosition.left }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const latex = selectedChip.getAttribute('data-latex') || '';
                      setEditingChip(selectedChip);
                      setCalculatorInitialValue(latex);
                      setShowCalculator(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Sửa trực quan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editorRef.current) {
                        selectedChip.remove();
                        setSelectedChip(null);
                        setChipPosition(null);
                        onChange(wysiwygDomToMarkdown(editorRef.current));
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Xóa công thức này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChip(null);
                      setChipPosition(null);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Đóng menu"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Code Mode (Raw LaTeX / Markdown) */}
          {mode === 'code' && (
            <textarea
              ref={textareaRef}
              rows={minRows}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder}
              className={`w-full p-4 text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 outline-none resize-y bg-slate-50/40 leading-relaxed ${
                disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
              }`}
            />
          )}

          {/* 3. Preview Mode */}
          {mode === 'preview' && (
            <div className="p-4 bg-slate-50/40 min-h-[140px] max-h-[500px] overflow-y-auto">
              {value && value.trim() ? (
                <MathMarkdownRenderer content={value} />
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  Chưa có nội dung để xem trước. Hãy chuyển về chế độ &quot;Soạn trực quan&quot; để nhập văn bản hoặc công thức.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Editor Bottom Info Bar */}
        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Info className="w-3 h-3 text-slate-400" />
            <span>
              {mode === 'wysiwyg'
                ? 'Nhấp chuột vào công thức bất kỳ để sửa bằng máy tính trực quan'
                : 'Chế độ mã nguồn: Kẹp công thức giữa $...$ hoặc $$...$$'}
            </span>
          </span>
          <span>{value.length} ký tự</span>
        </div>
      </div>

      {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}

      {/* AI Formula Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Trợ lý AI Viết Công Thức Toán - Lý</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAiModal(false);
                  setAiResult(null);
                  setAiPrompt('');
                }}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Gõ mô tả bằng tiếng Việt (ví dụ: &quot;căn bậc hai của 3 trừ căn 2 tất cả bình phương&quot;), AI sẽ chuyển thành công thức chuẩn.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerateFormula();
                  }
                }}
                placeholder="Ví dụ: tích phân từ 0 đến 1 của x^2 dx, logarit cơ số a của b..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-500"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateFormula}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tạo công thức</span>
                </button>
              </div>
            </div>

            {aiResult && (
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2 text-xs">
                <span className="font-bold text-purple-900 block">Kết quả công thức:</span>
                <div className="p-2 bg-white rounded-xl border border-purple-100 text-center">
                  <div dangerouslySetInnerHTML={{ __html: renderKatexHtml(aiResult, false) }} />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      insertMathChipIntoWysiwyg(aiResult);
                      setShowAiModal(false);
                      setAiResult(null);
                      setAiPrompt('');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Chèn vào bài viết</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Math Calculator Modal */}
      {showCalculator && (
        <InteractiveMathCalculator
          isOpen={showCalculator}
          initialValue={calculatorInitialValue}
          title={editingChip ? 'Chỉnh sửa công thức toán học' : 'Chèn công thức toán học'}
          onClose={() => {
            setShowCalculator(false);
            setEditingChip(null);
          }}
          onInsert={handleCalculatorConfirm}
        />
      )}
    </div>
  );
}