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
}

const FORMULA_CATEGORIES: { id: string; name: string; items: FormulaItem[] }[] = [
  {
    id: 'basic',
    name: 'Toán cơ bản',
    items: [
      { label: 'Phân số', display: 'a/b', snippet: '$\\frac{a}{b}$ ', tooltip: 'Phân số a/b' },
      { label: 'Số mũ', display: 'x²', snippet: '$x^{2}$ ', tooltip: 'Số mũ / lũy thừa' },
      { label: 'Chỉ số dưới', display: 'x₁', snippet: '$x_{1}$ ', tooltip: 'Chỉ số dưới' },
      { label: 'Căn bậc 2', display: '√x', snippet: '$\\sqrt{x}$ ', tooltip: 'Căn bậc hai' },
      { label: 'Căn bậc n', display: 'ⁿ√x', snippet: '$\\sqrt[n]{x}$ ', tooltip: 'Căn bậc n' },
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
      },
      {
        label: 'Tích phân bất định',
        display: '∫ f(x)dx',
        snippet: '$\\int f(x)dx$ ',
        tooltip: 'Tích phân không cận',
      },
      {
        label: 'Đạo hàm',
        display: 'df/dx',
        snippet: '$\\frac{df}{dx}$ ',
        tooltip: 'Đạo hàm vi phân',
      },
      {
        label: 'Giới hạn',
        display: 'lim',
        snippet: '$\\lim_{x \\to \\infty} f(x)$ ',
        tooltip: 'Giới hạn hàm số',
      },
      {
        label: 'Tổng Sigma',
        display: '∑',
        snippet: '$\\sum_{i=1}^{n} a_{i}$ ',
        tooltip: 'Tổng chuỗi Sigma',
      },
      {
        label: 'Tích Pi',
        display: '∏',
        snippet: '$\\prod_{i=1}^{n} x_{i}$ ',
        tooltip: 'Tích các phần tử',
      },
      {
        label: 'Hệ phương trình',
        display: '{Hệ PT',
        snippet: '\n$$\n\\begin{cases}\nax + by = c \\\\\ndx + ey = f\n\\end{cases}\n$$\n',
        tooltip: 'Hệ phương trình nhiều ẩn',
      },
      {
        label: 'Ma trận 2x2',
        display: '[Matrix]',
        snippet: '\n$$\n\\begin{pmatrix}\na & b \\\\\nc & d\n\\end{pmatrix}\n$$\n',
        tooltip: 'Ma trận 2x2',
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
  minRows = 4,
  label,
  compact = false,
  allowImageUpload = true,
  helperText,
  required = false,
  className = '',
  disabled = false,
}: RichMathEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [activeCategory, setActiveCategory] = useState<string>('basic');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // Wrap selected text or insert default
  const wrapSelection = useCallback(
    (before: string, after: string, defaultText: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) {
        onChange(value + before + defaultText + after);
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;
      const selected = currentValue.substring(start, end) || defaultText;

      const replacement = before + selected + after;
      const nextValue = currentValue.substring(0, start) + replacement + currentValue.substring(end);
      onChange(nextValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
      }, 0);
    },
    [value, onChange]
  );

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

    // Integral matching
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
          {/* Write / Preview Tab Switcher */}
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'write' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Soạn thảo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trước</span>
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

        {/* Math Formulas Quick Bar (Active in Write tab) */}
        {activeTab === 'write' && (
          <div className="bg-slate-100/60 border-b border-slate-200/60 px-2 py-1.5">
            {!compact ? (
              <div className="space-y-1.5">
                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
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

                {/* Symbols in active category */}
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {FORMULA_CATEGORIES.find((c) => c.id === activeCategory)?.items.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertSnippet(item.snippet)}
                      className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 rounded-lg text-xs font-mono font-bold text-slate-800 transition shadow-2xs cursor-pointer hover:scale-105 transform active:scale-95"
                      title={item.tooltip}
                    >
                      {item.display}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Compact Quick Bar: Essential Math & Physics buttons */
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => insertSnippet('$\\frac{a}{b}$ ')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Phân số"
                >
                  a/b
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('$x^{2}$ ')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Số mũ"
                >
                  x²
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('$x_{1}$ ')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Chỉ số dưới"
                >
                  x₁
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('$\\sqrt{x}$ ')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Căn bậc hai"
                >
                  √x
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('$\\int_{a}^{b} f(x)dx$ ')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Tích phân"
                >
                  ∫[a,b]
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
                <button
                  type="button"
                  onClick={() => insertSnippet('$\\approx$ ')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Gần bằng"
                >
                  ≈
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
        {activeTab === 'write' ? (
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
        ) : (
          <div className="p-4 bg-slate-50/40 min-h-[140px] max-h-[500px] overflow-y-auto">
            {value && value.trim() ? (
              <MathMarkdownRenderer content={value} />
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs italic">
                Chưa có nội dung để xem trước. Hãy chuyển về tab &quot;Soạn thảo&quot; để nhập văn bản hoặc công thức.
              </div>
            )}
          </div>
        )}

        {/* Editor Bottom Bar */}
        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Kẹp công thức giữa cặp dấu <code>$công\_thức$</code> hoặc <code>$$khối\_công\_thức$$</code></span>
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