'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import { mediaService } from '@/services/media.service';
import {
  Image as ImageIcon,
  Eye,
  Edit3,
  Sparkles,
  Loader2,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2,
  Check,
  X,
  Plus,
  Columns2,
  Calculator,
  Wand2,
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
  visualId?: string;
}

interface VisualFormulaField {
  key: string;
  label: string;
  placeholder: string;
  defaultValue: string;
}

interface VisualFormulaConfig {
  id: string;
  title: string;
  description: string;
  fields: VisualFormulaField[];
  generateLatex: (values: Record<string, string>) => string;
}

const VISUAL_FORMULA_CONFIGS: Record<string, VisualFormulaConfig> = {
  frac: {
    id: 'frac',
    title: 'Chèn Phân số (a/b)',
    description: 'Nhập tử số và mẫu số để tạo phân số chuẩn',
    fields: [
      { key: 'num', label: 'Tử số (a)', placeholder: 'Ví dụ: 1 hoặc 2x + 1', defaultValue: 'a' },
      { key: 'den', label: 'Mẫu số (b)', placeholder: 'Ví dụ: 2 hoặc 3', defaultValue: 'b' },
    ],
    generateLatex: (v) => `\\frac{${v.num?.trim() || 'a'}}{${v.den?.trim() || 'b'}}`,
  },
  nthroot: {
    id: 'nthroot',
    title: 'Chèn Căn bậc n (ⁿ√x)',
    description: 'Nhập bậc căn n và biểu thức trong căn x',
    fields: [
      { key: 'n', label: 'Bậc căn (n)', placeholder: 'Ví dụ: 3 (để trống nếu căn bậc 2)', defaultValue: 'n' },
      { key: 'x', label: 'Biểu thức trong căn (x)', placeholder: 'Ví dụ: x^2 + 1 hoặc 8', defaultValue: 'x' },
    ],
    generateLatex: (v) =>
      v.n?.trim() ? `\\sqrt[${v.n.trim()}]{${v.x?.trim() || 'x'}}` : `\\sqrt{${v.x?.trim() || 'x'}}`,
  },
  sqrt: {
    id: 'sqrt',
    title: 'Chèn Căn bậc hai (√x)',
    description: 'Nhập biểu thức nằm dưới dấu căn',
    fields: [
      { key: 'x', label: 'Biểu thức trong căn (x)', placeholder: 'Ví dụ: 2x - 3 hoặc x^2', defaultValue: 'x' },
    ],
    generateLatex: (v) => `\\sqrt{${v.x?.trim() || 'x'}}`,
  },
  pow: {
    id: 'pow',
    title: 'Chèn Số mũ / Lũy thừa (x²)',
    description: 'Nhập cơ số và số mũ lũy thừa',
    fields: [
      { key: 'base', label: 'Cơ số (x)', placeholder: 'Ví dụ: x hoặc 2', defaultValue: 'x' },
      { key: 'exp', label: 'Số mũ (n)', placeholder: 'Ví dụ: 2 hoặc n+1', defaultValue: '2' },
    ],
    generateLatex: (v) => `${v.base?.trim() || 'x'}^{${v.exp?.trim() || '2'}}`,
  },
  sub: {
    id: 'sub',
    title: 'Chèn Chỉ số dưới (x₁)',
    description: 'Nhập ký hiệu chính và chỉ số dưới',
    fields: [
      { key: 'base', label: 'Ký hiệu chính (x)', placeholder: 'Ví dụ: x hoặc a', defaultValue: 'x' },
      { key: 'sub', label: 'Chỉ số dưới (1)', placeholder: 'Ví dụ: 1 hoặc n', defaultValue: '1' },
    ],
    generateLatex: (v) => `${v.base?.trim() || 'x'}_{${v.sub?.trim() || '1'}}`,
  },
  integral_def: {
    id: 'integral_def',
    title: 'Chèn Tích phân xác định (∫[a,b])',
    description: 'Nhập cận dưới, cận trên và hàm số tích phân',
    fields: [
      { key: 'a', label: 'Cận dưới (a)', placeholder: 'Ví dụ: 0 hoặc a', defaultValue: 'a' },
      { key: 'b', label: 'Cận trên (b)', placeholder: 'Ví dụ: 1 hoặc b hoặc \\infty', defaultValue: 'b' },
      { key: 'fx', label: 'Hàm số f(x)dx', placeholder: 'Ví dụ: x^2 dx', defaultValue: 'f(x)dx' },
    ],
    generateLatex: (v) => `\\int_{${v.a?.trim() || 'a'}}^{${v.b?.trim() || 'b'}} ${v.fx?.trim() || 'f(x)dx'}`,
  },
  integral_indef: {
    id: 'integral_indef',
    title: 'Chèn Tích phân bất định (∫ f(x)dx)',
    description: 'Nhập biểu thức tích phân không có cận',
    fields: [
      { key: 'fx', label: 'Hàm số f(x)dx', placeholder: 'Ví dụ: (2x + 1)dx', defaultValue: 'f(x)dx' },
    ],
    generateLatex: (v) => `\\int ${v.fx?.trim() || 'f(x)dx'}`,
  },
  derivative: {
    id: 'derivative',
    title: 'Chèn Đạo hàm vi phân (df/dx)',
    description: 'Nhập hàm số và biến lấy đạo hàm',
    fields: [
      { key: 'num', label: 'Hàm số (f)', placeholder: 'Ví dụ: f hoặc y', defaultValue: 'df' },
      { key: 'den', label: 'Biến đạo hàm (x)', placeholder: 'Ví dụ: x hoặc t', defaultValue: 'dx' },
    ],
    generateLatex: (v) => `\\frac{${v.num?.trim() || 'df'}}{${v.den?.trim() || 'dx'}}`,
  },
  lim: {
    id: 'lim',
    title: 'Chèn Giới hạn (lim)',
    description: 'Nhập biến tiến tới và hàm số',
    fields: [
      { key: 'to', label: 'Biến tiến đến', placeholder: 'Ví dụ: x \\to \\infty hoặc x \\to 0', defaultValue: 'x \\to \\infty' },
      { key: 'fx', label: 'Biểu thức f(x)', placeholder: 'Ví dụ: \\frac{1}{x}', defaultValue: 'f(x)' },
    ],
    generateLatex: (v) => `\\lim_{${v.to?.trim() || 'x \\to \\infty'}} ${v.fx?.trim() || 'f(x)'}`,
  },
  sum: {
    id: 'sum',
    title: 'Chèn Tổng chuỗi Sigma (∑)',
    description: 'Nhập chỉ số chạy từ, đến và biểu thức chuỗi',
    fields: [
      { key: 'from', label: 'Từ (chỉ số đầu)', placeholder: 'Ví dụ: i=1', defaultValue: 'i=1' },
      { key: 'to', label: 'Đến (chỉ số cuối)', placeholder: 'Ví dụ: n hoặc \\infty', defaultValue: 'n' },
      { key: 'ai', label: 'Biểu thức a_i', placeholder: 'Ví dụ: a_i hoặc i^2', defaultValue: 'a_{i}' },
    ],
    generateLatex: (v) => `\\sum_{${v.from?.trim() || 'i=1'}}^{${v.to?.trim() || 'n'}} ${v.ai?.trim() || 'a_{i}'}`,
  },
  prod: {
    id: 'prod',
    title: 'Chèn Tích chuỗi Pi (∏)',
    description: 'Nhập chỉ số chạy từ, đến và biểu thức tích',
    fields: [
      { key: 'from', label: 'Từ (chỉ số đầu)', placeholder: 'Ví dụ: i=1', defaultValue: 'i=1' },
      { key: 'to', label: 'Đến (chỉ số cuối)', placeholder: 'Ví dụ: n', defaultValue: 'n' },
      { key: 'xi', label: 'Biểu thức x_i', placeholder: 'Ví dụ: x_i', defaultValue: 'x_{i}' },
    ],
    generateLatex: (v) => `\\prod_{${v.from?.trim() || 'i=1'}}^{${v.to?.trim() || 'n'}} ${v.xi?.trim() || 'x_{i}'}`,
  },
  cases: {
    id: 'cases',
    title: 'Chèn Hệ phương trình',
    description: 'Nhập các phương trình trong hệ',
    fields: [
      { key: 'eq1', label: 'Phương trình 1', placeholder: 'Ví dụ: 2x + y = 5', defaultValue: 'ax + by = c' },
      { key: 'eq2', label: 'Phương trình 2', placeholder: 'Ví dụ: x - y = 1', defaultValue: 'dx + ey = f' },
    ],
    generateLatex: (v) => `\\begin{cases}\n${v.eq1?.trim() || 'ax + by = c'} \\\\\n${v.eq2?.trim() || 'dx + ey = f'}\n\\end{cases}`,
  },
  matrix: {
    id: 'matrix',
    title: 'Chèn Ma trận 2x2',
    description: 'Nhập 4 phần tử của ma trận',
    fields: [
      { key: 'a', label: 'Hàng 1 Cột 1', placeholder: 'a', defaultValue: 'a' },
      { key: 'b', label: 'Hàng 1 Cột 2', placeholder: 'b', defaultValue: 'b' },
      { key: 'c', label: 'Hàng 2 Cột 1', placeholder: 'c', defaultValue: 'c' },
      { key: 'd', label: 'Hàng 2 Cột 2', placeholder: 'd', defaultValue: 'd' },
    ],
    generateLatex: (v) => `\\begin{pmatrix}\n${v.a?.trim() || 'a'} & ${v.b?.trim() || 'b'} \\\\\n${v.c?.trim() || 'c'} & ${v.d?.trim() || 'd'}\n\\end{pmatrix}`,
  },
};

const FORMULA_CATEGORIES: { id: string; name: string; items: FormulaItem[] }[] = [
  {
    id: 'basic',
    name: 'Toán cơ bản',
    items: [
      { label: 'Phân số', display: 'a/b', snippet: '$\\frac{a}{b}$ ', tooltip: 'Phân số a/b', visualId: 'frac' },
      { label: 'Số mũ', display: 'x²', snippet: '$x^{2}$ ', tooltip: 'Số mũ / lũy thừa', visualId: 'pow' },
      { label: 'Chỉ số dưới', display: 'x₁', snippet: '$x_{1}$ ', tooltip: 'Chỉ số dưới', visualId: 'sub' },
      { label: 'Căn bậc 2', display: '√x', snippet: '$\\sqrt{x}$ ', tooltip: 'Căn bậc hai', visualId: 'sqrt' },
      { label: 'Căn bậc n', display: 'ⁿ√x', snippet: '$\\sqrt[n]{x}$ ', tooltip: 'Căn bậc n', visualId: 'nthroot' },
      { label: 'Cộng trừ', display: '±', snippet: '$\\pm$ ', tooltip: 'Dấu cộng trừ' },
      { label: 'Nhân', display: '×', snippet: '$\\times$ ', tooltip: 'Dấu nhân' },
      { label: 'Chia', display: '÷', snippet: '$\\div$ ', tooltip: 'Dấu chia' },
      { label: 'Gần bằng', display: '≈', snippet: '$\\approx$ ', tooltip: 'Gần bằng' },
      { label: 'Khác', display: '≠', snippet: '$\\neq$ ', tooltip: 'Khác nhau' },
      { label: 'Nhỏ hơn bằng', display: '≤', snippet: '$\\le$ ', tooltip: 'Nhỏ hơn hoặc bằng' },
      { label: 'Lớn hơn bằng', display: '≥', snippet: '$\\ge$ ', tooltip: 'Lớn hơn hoặc bằng' },
      { label: 'Vô cực', display: '∞', snippet: '$\\infty$ ', tooltip: 'Vô cực' },
    ],
  },
  {
    id: 'calculus',
    name: 'Giải tích & Nâng cao',
    items: [
      {
        label: 'Tích phân xác định',
        display: '∫[a,b]',
        snippet: '$\\int_{a}^{b} f(x)dx$ ',
        tooltip: 'Tích phân cận từ a đến b',
        visualId: 'integral_def',
      },
      {
        label: 'Tích phân bất định',
        display: '∫ f(x)dx',
        snippet: '$\\int f(x)dx$ ',
        tooltip: 'Tích phân không cận',
        visualId: 'integral_indef',
      },
      {
        label: 'Đạo hàm',
        display: 'df/dx',
        snippet: '$\\frac{df}{dx}$ ',
        tooltip: 'Đạo hàm vi phân',
        visualId: 'derivative',
      },
      {
        label: 'Giới hạn',
        display: 'lim',
        snippet: '$\\lim_{x \\to \\infty} f(x)$ ',
        tooltip: 'Giới hạn hàm số',
        visualId: 'lim',
      },
      {
        label: 'Tổng Sigma',
        display: '∑',
        snippet: '$\\sum_{i=1}^{n} a_{i}$ ',
        tooltip: 'Tổng chuỗi Sigma',
        visualId: 'sum',
      },
      {
        label: 'Tích Pi',
        display: '∏',
        snippet: '$\\prod_{i=1}^{n} x_{i}$ ',
        tooltip: 'Tích các phần tử',
        visualId: 'prod',
      },
      {
        label: 'Hệ phương trình',
        display: '{Hệ PT',
        snippet: '\n$$\n\\begin{cases}\nax + by = c \\\\\ndx + ey = f\n\\end{cases}\n$$\n',
        tooltip: 'Hệ phương trình nhiều ẩn',
        visualId: 'cases',
      },
      {
        label: 'Ma trận 2x2',
        display: '[Matrix]',
        snippet: '\n$$\n\\begin{pmatrix}\na & b \\\\\nc & d\n\\end{pmatrix}\n$$\n',
        tooltip: 'Ma trận 2x2',
        visualId: 'matrix',
      },
    ],
  },
  {
    id: 'physics',
    name: 'Vật lý & Ký hiệu',
    items: [
      { label: 'Điện trở Ohm', display: 'Ω (Ohm)', snippet: '$R = 100\\,\\Omega$ ', tooltip: 'Ký hiệu Ohm điện trở' },
      { label: 'Micro', display: 'μ (micro)', snippet: '$\\mu$ ', tooltip: 'Tiền tố micro' },
      { label: 'Bước sóng', display: 'λ (lambda)', snippet: '$\\lambda$ ', tooltip: 'Bước sóng' },
      { label: 'Tần số góc', display: 'ω (omega)', snippet: '$\\omega$ ', tooltip: 'Tần số góc' },
      { label: 'Độ biến thiên', display: 'Δ (delta)', snippet: '$\\Delta t$ ', tooltip: 'Độ biến thiên Delta' },
      { label: 'Vectơ', display: 'v⃗ (vector)', snippet: '$\\vec{v}$ ', tooltip: 'Đại lượng vectơ' },
      { label: 'Góc', display: '∠ABC', snippet: '$\\widehat{ABC}$ ', tooltip: 'Góc hình học' },
      { label: 'Độ C', display: '°C', snippet: '$25^\\circ\\text{C}$ ', tooltip: 'Độ nhiệt độ Celsius' },
      { label: 'Gia tốc', display: 'm/s²', snippet: '$\\text{m/s}^2$ ', tooltip: 'Đơn vị gia tốc' },
      { label: 'Lực Newton', display: 'N (Newton)', snippet: '$F = 50\\,\\text{N}$ ', tooltip: 'Đơn vị lực Newton' },
      { label: 'Alpha', display: 'α', snippet: '$\\alpha$ ', tooltip: 'Ký hiệu Alpha' },
      { label: 'Beta', display: 'β', snippet: '$\\beta$ ', tooltip: 'Ký hiệu Beta' },
      { label: 'Gamma', display: 'γ', snippet: '$\\gamma$ ', tooltip: 'Ký hiệu Gamma' },
      { label: 'Pi', display: 'π', snippet: '$\\pi$ ', tooltip: 'Số Pi' },
      { label: 'Góc Theta', display: 'θ', snippet: '$\\theta$ ', tooltip: 'Góc Theta' },
    ],
  },
];

export function RichMathEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung, hỗ trợ công thức toán học $...$ và chèn ảnh minh họa...',
  minRows = 3,
  label,
  compact = false,
  allowImageUpload = true,
  helperText,
  required = false,
  className = '',
  disabled = false,
}: RichMathEditorProps) {
  // Mode: 'split' (Soạn & Xem trực tiếp), 'write' (Chỉ soạn thảo), 'preview' (Xem toàn bộ)
  const [viewMode, setViewMode] = useState<'split' | 'write' | 'preview'>('split');
  const [activeCategory, setActiveCategory] = useState<string>('basic');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Visual Formula Builder state
  const [useVisualBuilder, setUseVisualBuilder] = useState<boolean>(true);
  const [activeVisualFormula, setActiveVisualFormula] = useState<VisualFormulaConfig | null>(null);
  const [visualValues, setVisualValues] = useState<Record<string, string>>({});

  // AI Formula Assistant state
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiResult, setAiResult] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Insert snippet at current cursor position
  const insertSnippet = useCallback(
    (snippet: string) => {
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

      // Focus back and position cursor after inserted snippet
      setTimeout(() => {
        textarea.focus();
        const nextCursor = start + snippet.length;
        textarea.setSelectionRange(nextCursor, nextCursor);
      }, 0);
    },
    [value, onChange]
  );

  // Handle clicking on a formula button
  const handleFormulaItemClick = (item: FormulaItem) => {
    if (useVisualBuilder && item.visualId && VISUAL_FORMULA_CONFIGS[item.visualId]) {
      const config = VISUAL_FORMULA_CONFIGS[item.visualId];
      const initialVals: Record<string, string> = {};
      config.fields.forEach((f) => {
        initialVals[f.key] = f.defaultValue;
      });
      setVisualValues(initialVals);
      setActiveVisualFormula(config);
    } else {
      insertSnippet(item.snippet);
    }
  };

  // Handle image file upload
  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Chỉ hỗ trợ tải lên tệp định dạng hình ảnh (PNG, JPG, WEBP, GIF, SVG)');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const res = await mediaService.uploadImage(file);
      const imageSnippet = `\n![${file.name.replace(/\.[^/.]+$/, '')}](${res.url})\n`;
      insertSnippet(imageSnippet);
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
    if (file) {
      handleUploadFile(file);
    }
  };

  // Support paste image from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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

  // Support drag & drop image onto textarea
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleUploadFile(file);
      }
    }
  };

  // Rule-based AI Formula Converter for common Vietnamese expressions
  const handleGenerateFormula = () => {
    if (!aiPrompt.trim()) return;
    const prompt = aiPrompt.toLowerCase().trim();
    let generated = '';

    if (prompt.includes('tích phân') || prompt.includes('integral')) {
      const bounds = prompt.match(/từ\s+([a-zA-Z0-9_\-]+)\s+đến\s+([a-zA-Z0-9_\-]+)/);
      if (bounds) {
        generated = `$\\int_{${bounds[1]}}^{${bounds[2]}} f(x)dx$`;
      } else {
        generated = '$\\int_{a}^{b} f(x)dx$';
      }
    } else if (prompt.includes('phân số') || prompt.includes('chia')) {
      generated = '$\\frac{a}{b}$';
    } else if (prompt.includes('căn')) {
      generated = '$\\sqrt{x^2 + 1}$';
    } else if (prompt.includes('hệ phương trình') || prompt.includes('he pt')) {
      generated = '$$\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}$$';
    } else if (prompt.includes('ohm') || prompt.includes('điện trở')) {
      generated = '$R = 50\\,\\Omega$';
    } else if (prompt.includes('đạo hàm')) {
      generated = '$\\frac{df}{dx} = 2x$';
    } else if (prompt.includes('giới hạn') || prompt.includes('lim')) {
      generated = '$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$';
    } else {
      generated = `$${aiPrompt}$`;
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
          <span className="text-[11px] text-slate-400 font-medium">Hỗ trợ công thức LaTeX & ảnh</span>
        </div>
      )}

      {/* Editor Box */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden focus-within:border-indigo-500 transition-all">
        {/* Main Toolbar */}
        <div className="bg-slate-50/80 border-b border-slate-200/80 p-2 flex flex-wrap items-center justify-between gap-2">
          {/* Mode Switcher: Split (Default) | Write | Preview */}
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'split' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vừa soạn thảo vừa xem công thức hiển thị trực quan ở dưới"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Soạn & Xem trực tiếp</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('write')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'write' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Chỉ hiển thị khung soạn thảo"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉ soạn thảo</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem toàn bộ kết quả đề bài hoàn chỉnh"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trước mẫu</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
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
                  title="Chèn ảnh từ máy tính hoặc kéo thả ảnh vào khung soạn thảo"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>Đang tải ảnh...</span>
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

            {/* AI Formula Generator Button */}
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 hover:bg-purple-100 text-purple-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Nhờ AI chuyển đổi mô tả tiếng Việt thành công thức toán học"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">AI Công thức</span>
            </button>
          </div>
        </div>

        {/* Math Formulas Quick Bar (Active in Split or Write mode) */}
        {viewMode !== 'preview' && (
          <div className="bg-slate-100/60 border-b border-slate-200/60 px-2 py-1.5 space-y-1.5">
            {!compact ? (
              <>
                {/* Category Pills + Visual Builder Toggle */}
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

                  {/* Toggle Visual Helper */}
                  <button
                    type="button"
                    onClick={() => setUseVisualBuilder(!useVisualBuilder)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0 border ${
                      useVisualBuilder
                        ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Bật/Tắt hộp thoại trợ lý điền công thức trực quan khi click ký hiệu"
                  >
                    <Wand2 className="w-3 h-3 text-purple-600" />
                    <span>Hỗ trợ điền trực quan: {useVisualBuilder ? 'BẬT' : 'TẮT'}</span>
                  </button>
                </div>

                {/* Symbols in active category */}
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {FORMULA_CATEGORIES.find((c) => c.id === activeCategory)?.items.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleFormulaItemClick(item)}
                      className={`px-2 py-1 bg-white hover:bg-indigo-50 border rounded-lg text-xs font-mono font-bold text-slate-800 transition shadow-2xs cursor-pointer hover:scale-105 transform active:scale-95 flex items-center gap-1 ${
                        item.visualId && useVisualBuilder
                          ? 'border-indigo-200 text-indigo-950 font-semibold'
                          : 'border-slate-200/80 hover:border-indigo-300'
                      }`}
                      title={item.tooltip + (item.visualId && useVisualBuilder ? ' (Mở trợ lý điền trực quan)' : '')}
                    >
                      <span>{item.display}</span>
                      {item.visualId && useVisualBuilder && (
                        <span className="w-1 h-1 rounded-full bg-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* Compact Quick Bar: Essential Math & Physics buttons */
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() =>
                    handleFormulaItemClick({
                      label: 'Phân số',
                      display: 'a/b',
                      snippet: '$\\frac{a}{b}$ ',
                      tooltip: 'Phân số',
                      visualId: 'frac',
                    })
                  }
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Phân số"
                >
                  a/b
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleFormulaItemClick({
                      label: 'Số mũ',
                      display: 'x²',
                      snippet: '$x^{2}$ ',
                      tooltip: 'Số mũ',
                      visualId: 'pow',
                    })
                  }
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Số mũ"
                >
                  x²
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleFormulaItemClick({
                      label: 'Chỉ số dưới',
                      display: 'x₁',
                      snippet: '$x_{1}$ ',
                      tooltip: 'Chỉ số dưới',
                      visualId: 'sub',
                    })
                  }
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Chỉ số dưới"
                >
                  x₁
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleFormulaItemClick({
                      label: 'Căn bậc 2',
                      display: '√x',
                      snippet: '$\\sqrt{x}$ ',
                      tooltip: 'Căn bậc hai',
                      visualId: 'sqrt',
                    })
                  }
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Căn bậc hai"
                >
                  √x
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleFormulaItemClick({
                      label: 'Căn bậc n',
                      display: 'ⁿ√x',
                      snippet: '$\\sqrt[n]{x}$ ',
                      tooltip: 'Căn bậc n',
                      visualId: 'nthroot',
                    })
                  }
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Căn bậc n"
                >
                  ⁿ√x
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('$R = 100\\,\\Omega$ ')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Điện trở Ohm"
                >
                  Ω (Ohm)
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('$\\pi$ ')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Số Pi"
                >
                  π
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('$\\pm$ ')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Cộng trừ"
                >
                  ±
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

        {/* Content Area */}
        {viewMode !== 'preview' ? (
          <div>
            {/* Textarea Editor */}
            <textarea
              ref={textareaRef}
              rows={minRows}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              placeholder={placeholder}
              className={`w-full p-3.5 text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 outline-none resize-y bg-white leading-relaxed ${
                disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
              }`}
            />

            {/* Live Realtime Preview (Rendered Math Symbols right below textarea) */}
            {viewMode === 'split' && (
              <div className="border-t border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/80">
                      <Eye className="w-3 h-3 text-indigo-600" />
                      Xem trước trực quan
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      (Ký hiệu toán hiển thị trực tiếp theo chuẩn đề thi)
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đồng bộ tức thì
                  </span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-xl min-h-[65px] max-h-[320px] overflow-y-auto text-slate-900 leading-relaxed shadow-2xs">
                  {value && value.trim() ? (
                    <MathMarkdownRenderer content={value} />
                  ) : (
                    <div className="py-3 text-center text-slate-400 text-xs italic">
                      Ký hiệu toán học (căn bậc n, phân số, số mũ...) và hình ảnh minh họa sẽ tự động hiển thị trực quan tại đây ngay khi bạn gõ hoặc bấm nút chèn.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>💡 <strong>Mẹo cho giáo viên:</strong> Chỉnh sửa số hoặc chữ ở khung soạn thảo phía trên, công thức bên dưới sẽ tự động thay đổi theo.</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Full Preview Mode */
          <div className="p-4 bg-slate-50/40 min-h-[160px] max-h-[500px] overflow-y-auto">
            {value && value.trim() ? (
              <MathMarkdownRenderer content={value} />
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs italic">
                Chưa có nội dung để xem trước. Hãy chuyển về chế độ &quot;Soạn & Xem trực tiếp&quot; để nhập văn bản hoặc công thức.
              </div>
            )}
          </div>
        )}

        {/* Editor Bottom Bar */}
        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Kẹp công thức giữa cặp dấu <code>$công\_thức$</code> hoặc <code>$$khối\_công\_thức$$</code>
          </span>
          <span>{value.length} ký tự</span>
        </div>
      </div>

      {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}

      {/* Visual Formula Builder Modal (Popover for Teachers) */}
      {activeVisualFormula && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <Calculator className="w-4 h-4 text-indigo-600" />
                <span>{activeVisualFormula.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveVisualFormula(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {activeVisualFormula.description}. Nhập giá trị vào các ô bên dưới, hệ thống sẽ tự động ghép thành ký hiệu toán học chuẩn.
            </p>

            {/* Input Fields */}
            <div className="space-y-3">
              {activeVisualFormula.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {field.label}:
                  </label>
                  <input
                    type="text"
                    value={visualValues[field.key] ?? field.defaultValue}
                    onChange={(e) =>
                      setVisualValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              ))}
            </div>

            {/* Realtime Formula Preview */}
            <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-1.5">
              <span className="text-[11px] font-bold text-indigo-900 block">
                👁️ Ký hiệu hiển thị thực tế:
              </span>
              <div className="p-2.5 bg-white rounded-xl border border-indigo-100 text-center min-h-[44px] flex items-center justify-center">
                <MathMarkdownRenderer
                  content={
                    activeVisualFormula.id === 'cases' || activeVisualFormula.id === 'matrix'
                      ? `$$\n${activeVisualFormula.generateLatex(visualValues)}\n$$`
                      : `$${activeVisualFormula.generateLatex(visualValues)}$`
                  }
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  const defaultSnippet = FORMULA_CATEGORIES
                    .flatMap((c) => c.items)
                    .find((i) => i.visualId === activeVisualFormula.id)?.snippet;
                  if (defaultSnippet) {
                    insertSnippet(defaultSnippet);
                  }
                  setActiveVisualFormula(null);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Chèn mã code mẫu
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveVisualFormula(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const latex = activeVisualFormula.generateLatex(visualValues);
                    const isBlock = activeVisualFormula.id === 'cases' || activeVisualFormula.id === 'matrix';
                    const snippet = isBlock ? `\n$$\n${latex}\n$$\n` : `$${latex}$ `;
                    insertSnippet(snippet);
                    setActiveVisualFormula(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Chèn vào bài</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              Gõ mô tả bằng tiếng Việt, AI sẽ chuyển thành công thức chuẩn LaTeX để chèn vào bài.
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
                placeholder="Ví dụ: tích phân từ a đến b của f(x)dx, hoặc điện trở R = 100 ohm..."
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
                <div className="p-2 bg-white rounded-xl border border-purple-100">
                  <MathMarkdownRenderer content={aiResult} />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      insertSnippet(aiResult + ' ');
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
    </div>
  );
}