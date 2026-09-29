'use client';

import React, { useState, useRef, useCallback } from 'react';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import { InteractiveMathCalculator } from '@/components/InteractiveMathCalculator';
import { mediaService } from '@/services/media.service';
import {
  Image as ImageIcon,
  Eye,
  Edit3,
  Sparkles,
  Loader2,
  Check,
  X,
  Columns2,
  Calculator,
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
      { label: 'Số mũ n', display: 'xʸ', snippet: '$x^{n}$ ', tooltip: 'Lũy thừa bậc n' },
      { label: 'Chỉ số dưới', display: 'x₁', snippet: '$x_{1}$ ', tooltip: 'Chỉ số dưới' },
      { label: 'Căn bậc 2', display: '√x', snippet: '$\\sqrt{x}$ ', tooltip: 'Căn bậc hai' },
      {
        label: 'Căn bậc 2 bình phương',
        display: '√( )²',
        snippet: '$\\sqrt{(a - b)^2}$ ',
        tooltip: 'Căn bậc hai chứa bình phương bên trong (Dạng bài rút gọn như đề thi)',
      },
      { label: 'Căn bậc n', display: 'ⁿ√x', snippet: '$\\sqrt[n]{x}$ ', tooltip: 'Căn bậc n' },
      { label: 'Trị tuyệt đối', display: '|x|', snippet: '$|x|$ ', tooltip: 'Giá trị tuyệt đối' },
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
  minRows = 3,
  label,
  compact = false,
  allowImageUpload = true,
  helperText,
  required = false,
  className = '',
  disabled = false,
}: RichMathEditorProps) {
  // Mode: 'split' (Soạn & Xem trực tiếp), 'write' (Chỉ soạn thảo), 'calc' (Máy tính trực tiếp), 'preview' (Xem toàn bộ)
  const [viewMode, setViewMode] = useState<'split' | 'write' | 'calc' | 'preview'>('split');
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [calculatorInitialValue, setCalculatorInitialValue] = useState<string>('');

  const handleOpenCalculator = (customInitVal?: string) => {
    if (customInitVal !== undefined) {
      setCalculatorInitialValue(customInitVal);
    } else {
      const textarea = textareaRef.current;
      if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
        const selected = textarea.value
          .substring(textarea.selectionStart, textarea.selectionEnd)
          .replace(/^\$+|\$+$/g, '')
          .trim();
        setCalculatorInitialValue(selected);
      } else {
        const mathMatch = value.match(/\$([^$]+)\$/);
        if (mathMatch) {
          setCalculatorInitialValue(mathMatch[1].trim());
        } else {
          setCalculatorInitialValue('');
        }
      }
    }
    setShowCalculator(true);
  };

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

  // Handle clicking on a formula button: Direct insert without annoying dialogs
  const handleFormulaItemClick = (item: FormulaItem) => {
    insertSnippet(item.snippet);
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
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleUploadFile(file);
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
          <span className="text-[11px] text-slate-400 font-medium">Hỗ trợ công thức LaTeX &amp; ảnh</span>
        </div>
      )}

      {/* Editor Box */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden focus-within:border-indigo-500 transition-all">
        {/* Main Toolbar */}
        <div className="bg-slate-50/80 border-b border-slate-200/80 p-2 flex flex-wrap items-center justify-between gap-2">
          {/* Mode Switcher: Split (Default) | Write | Calc | Preview */}
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
              <span>Soạn &amp; Xem</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calc')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'calc' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Gõ và bấm phím trực tiếp trên máy tính toán học như Casio / Google Calculator"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>🧮 Máy tính online</span>
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
            {/* Interactive Math Calculator Modal Button */}
            <button
              type="button"
              onClick={() => handleOpenCalculator()}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Mở máy tính trực quan để gõ và bấm như Casio / Google Calculator"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Máy tính online</span>
            </button>

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
        {viewMode !== 'preview' && viewMode !== 'calc' && (
          <div className="bg-slate-100/60 border-b border-slate-200/60 px-2 py-1.5 space-y-1.5">
            {!compact ? (
              <>
                {/* Category Pills */}
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

                  <button
                    type="button"
                    onClick={() => handleOpenCalculator()}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center gap-1 cursor-pointer shrink-0"
                    title="Mở máy tính toán học để nhập biểu thức phức tạp trực quan"
                  >
                    <Calculator className="w-3 h-3 text-indigo-600" />
                    <span>Mở máy tính trực quan</span>
                  </button>
                </div>

                {/* Symbols in active category */}
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {FORMULA_CATEGORIES.find((c) => c.id === activeCategory)?.items.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleFormulaItemClick(item)}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 rounded-lg text-xs font-mono font-bold text-slate-800 transition shadow-2xs cursor-pointer hover:scale-105 transform active:scale-95 flex items-center gap-1"
                      title={item.tooltip}
                    >
                      <span>{item.display}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* Compact Quick Bar: Essential Math buttons */
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
                  onClick={() => insertSnippet('$\\sqrt{(a - b)^2}$ ')}
                  className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-mono font-bold hover:bg-amber-100 cursor-pointer shrink-0"
                  title="Căn thức bậc 2 có bình phương: √(a-b)²"
                >
                  √( )²
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('$\\sqrt[n]{x}$ ')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Căn bậc n"
                >
                  ⁿ√x
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('$|x|$ ')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 hover:bg-indigo-50 cursor-pointer shrink-0"
                  title="Trị tuyệt đối"
                >
                  |x|
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
        {viewMode === 'calc' ? (
          <div className="p-3 sm:p-5 bg-slate-50/70 border-b border-slate-200">
            <InteractiveMathCalculator
              inline={true}
              initialValue={calculatorInitialValue || (value.match(/\$([^$]+)\$/)?.[1]?.trim() ?? '')}
              onInsert={(latex) => {
                insertSnippet(`$${latex}$ `);
                setViewMode('split');
              }}
            />
          </div>
        ) : viewMode !== 'preview' ? (
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/80">
                      <Eye className="w-3 h-3 text-indigo-600" />
                      Xem trước trực quan
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      (Ký hiệu toán hiển thị trực tiếp theo chuẩn đề thi)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCalculator()}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
                      title="Mở máy tính toán học để sửa hoặc gõ tiếp công thức này trực tiếp như Ảnh 2"
                    >
                      <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Mở máy tính sửa trực tiếp</span>
                    </button>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đồng bộ tức thì
                    </span>
                  </div>
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
                  <span>💡 <strong>Mẹo cho giáo viên:</strong> Bấm nút <strong>&quot;Mở máy tính sửa trực tiếp&quot;</strong> để tạo các công thức lồng nhau phức tạp như căn lồng căn hay bình phương.</span>
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
                Chưa có nội dung để xem trước. Hãy chuyển về chế độ &quot;Soạn &amp; Xem trực tiếp&quot; để nhập văn bản hoặc công thức.
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

      {/* Interactive Math Calculator Modal */}
      {showCalculator && (
        <InteractiveMathCalculator
          isOpen={showCalculator}
          initialValue={calculatorInitialValue}
          onClose={() => setShowCalculator(false)}
          onInsert={(latex) => {
            insertSnippet(`$${latex}$ `);
            setShowCalculator(false);
          }}
        />
      )}
    </div>
  );
}