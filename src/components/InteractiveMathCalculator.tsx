'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Sparkles,
  HelpCircle,
  Copy,
  BookOpen,
} from 'lucide-react';

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      'math-field': any;
    }
  }
}

interface InteractiveMathCalculatorProps {
  initialValue?: string;
  onInsert: (latex: string) => void;
  onClose?: () => void;
  title?: string;
  isOpen?: boolean;
  inline?: boolean;
}

export function InteractiveMathCalculator({
  initialValue = '',
  onInsert,
  onClose,
  title = 'Máy tính toán học trực quan (Soạn đề trực tiếp)',
  isOpen = true,
  inline = false,
}: InteractiveMathCalculatorProps) {
  // Clean initial value of outer dollar signs if any
  const cleanedInit = initialValue.replace(/^\$+|\$+$/g, '').trim();
  const [latexValue, setLatexValue] = useState<string>(cleanedInit);
  const [isReady, setIsReady] = useState<boolean>(false);
  const mathfieldRef = useRef<any>(null);

  // Initialize MathLive
  useEffect(() => {
    let mounted = true;
    if (typeof window !== 'undefined') {
      import('mathlive').then(() => {
        if (!mounted) return;
        setIsReady(true);
        if (mathfieldRef.current) {
          mathfieldRef.current.value = cleanedInit;
          setTimeout(() => {
            mathfieldRef.current?.focus();
          }, 100);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [cleanedInit]);

  // Execute command on MathField
  const execCmd = useCallback((cmd: string | [string, ...any[]]) => {
    const mf = mathfieldRef.current;
    if (!mf) return;
    if (typeof cmd === 'string') {
      mf.executeCommand(cmd);
    } else {
      mf.executeCommand(cmd);
    }
    mf.focus();
    setLatexValue(mf.value);
  }, []);

  // Insert string or character
  const insertText = useCallback((text: string) => {
    const mf = mathfieldRef.current;
    if (!mf) return;
    mf.insert(text);
    mf.focus();
    setLatexValue(mf.value);
  }, []);

  // Set explicit LaTeX expression
  const setExpression = useCallback((expr: string) => {
    const mf = mathfieldRef.current;
    if (!mf) return;
    mf.setValue(expr);
    mf.focus();
    setLatexValue(mf.value);
  }, []);

  // Clear all
  const handleClear = useCallback(() => {
    const mf = mathfieldRef.current;
    if (!mf) return;
    mf.setValue('');
    mf.focus();
    setLatexValue('');
  }, []);

  // Submit formula
  const handleConfirm = () => {
    const val = mathfieldRef.current?.value || latexValue;
    onInsert(val.trim());
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const content = (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-2xl w-full mx-auto font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            🧮
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            <p className="text-[11px] text-slate-500">
              Nhập và sửa trực tiếp như trên máy tính Casio &amp; Google Calculator
            </p>
          </div>
        </div>

        {onClose && !inline && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Quick Exam Templates (Đặc thù đề thi Toán THCS / THPT) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
            <span className="flex items-center gap-1 text-indigo-700">
              <BookOpen className="w-3.5 h-3.5" />
              Mẫu đề bài phổ biến (Bấm để chèn ngay):
            </span>
            <span className="text-[10px] text-slate-400">Bấm nút để điền nhanh</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {/* Template 1: Direct match for Image 2! */}
            <button
              type="button"
              onClick={() =>
                setExpression('\\sqrt{(\\sqrt{3} - \\sqrt{2})^2} + \\sqrt{(1 - \\sqrt{2})^2}')
              }
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-xl font-medium shrink-0 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Chèn mẫu câu hỏi Rút gọn căn bậc hai (chuẩn như Ảnh 2)"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Mẫu Ảnh 2: √(√3-√2)² + √(1-√2)²</span>
            </button>

            <button
              type="button"
              onClick={() => execCmd(['insert', '\\sqrt{(#?)^2}'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold font-mono shrink-0 transition cursor-pointer"
              title="Căn bậc hai chứa bình phương bên trong: √( ... )²"
            >
              √(...)²
            </button>

            <button
              type="button"
              onClick={() => execCmd(['insert', '\\frac{#?}{#?}'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold font-mono shrink-0 transition cursor-pointer"
              title="Phân số a/b"
            >
              a/b
            </button>

            <button
              type="button"
              onClick={() => execCmd(['insert', '\\sqrt{#?}'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold font-mono shrink-0 transition cursor-pointer"
              title="Căn bậc hai √x"
            >
              √x
            </button>

            <button
              type="button"
              onClick={() => execCmd(['insert', '\\log_{#?}(#?)'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold font-mono shrink-0 transition cursor-pointer"
              title="Logarit cơ số a của b: log_a(b)"
            >
              logₐb
            </button>

            <button
              type="button"
              onClick={() => execCmd(['insert', '\\ln(#?)'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold font-mono shrink-0 transition cursor-pointer"
              title="Logarit tự nhiên ln(x)"
            >
              ln
            </button>

            <button
              type="button"
              onClick={() => execCmd(['insert', '\\int_{#?}^{#?} #? dx'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold font-mono shrink-0 transition cursor-pointer"
              title="Tích phân xác định cận từ a đến b"
            >
              ∫[a,b]
            </button>

            <button
              type="button"
              onClick={() => execCmd(['insert', '\\lim_{x \\to #?} #?'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold font-mono shrink-0 transition cursor-pointer"
              title="Giới hạn lim"
            >
              lim
            </button>

            <button
              type="button"
              onClick={() => execCmd(['insert', '|#?|'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold font-mono shrink-0 transition cursor-pointer"
              title="Trị tuyệt đối |x|"
            >
              |x|
            </button>

            <button
              type="button"
              onClick={() => execCmd(['insert', '^{2}'])}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl font-bold font-mono shrink-0 transition cursor-pointer"
              title="Bình phương x²"
            >
              x²
            </button>
          </div>
        </div>

        {/* Calculator Display Screen */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 px-1">
            <span>Màn hình hiển thị đề bài (Nhấp chuột hoặc gõ trực tiếp):</span>
            <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Soạn thảo trực tiếp WYSIWYG
            </span>
          </div>

          <div className="p-4 bg-white border-2 border-indigo-500 rounded-2xl shadow-inner min-h-[90px] flex items-center transition-all focus-within:ring-4 focus-within:ring-indigo-100">
            {isReady ? (
              <math-field
                ref={mathfieldRef}
                style={{
                  width: '100%',
                  fontSize: '26px',
                  outline: 'none',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'text',
                  display: 'block',
                }}
                onInput={(e: any) => setLatexValue(e.target.value)}
              />
            ) : (
              <div className="text-slate-400 text-sm italic">Đang tải bàn phím máy tính...</div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 px-1">
            💡 Thầy cô có thể click chuột vào trong dấu căn, số mũ để sửa số, hoặc dùng các nút điều hướng <strong>←</strong> <strong>→</strong>.
          </p>
        </div>

        {/* Calculator Keypad */}
        <div className="space-y-1.5">
          {/* Keypad Grid (7 columns) */}
          <div className="grid grid-cols-7 gap-1.5 text-xs font-bold select-none">
            {/* Row 1: Radicals, Powers, Fractions, Clear */}
            <button
              type="button"
              onClick={() => execCmd(['insert', '\\frac{#?}{#?}'])}
              className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 font-mono transition active:scale-95 cursor-pointer flex flex-col items-center justify-center"
              title="Phân số"
            >
              <span>a/b</span>
            </button>
            <button
              type="button"
              onClick={() => execCmd(['insert', '\\sqrt{#?}'])}
              className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 font-mono transition active:scale-95 cursor-pointer flex flex-col items-center justify-center"
              title="Căn bậc hai"
            >
              <span>√x</span>
            </button>
            <button
              type="button"
              onClick={() => execCmd(['insert', '\\sqrt{(#?)^2}'])}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-mono transition active:scale-95 cursor-pointer flex flex-col items-center justify-center font-bold"
              title="Căn bậc hai có bình phương: √( ... )²"
            >
              <span>√(...)²</span>
            </button>
            <button
              type="button"
              onClick={() => execCmd(['insert', '\\sqrt[#?]{#?}'])}
              className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 font-mono transition active:scale-95 cursor-pointer flex flex-col items-center justify-center"
              title="Căn bậc n"
            >
              <span>ⁿ√x</span>
            </button>
            <button
              type="button"
              onClick={() => execCmd(['insert', '^{2}'])}
              className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 font-mono transition active:scale-95 cursor-pointer flex flex-col items-center justify-center"
              title="Bình phương"
            >
              <span>x²</span>
            </button>
            <button
              type="button"
              onClick={() => execCmd('deleteBackward')}
              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-mono transition active:scale-95 cursor-pointer flex flex-col items-center justify-center"
              title="Xóa lùi (Backspace)"
            >
              <span>CE</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono transition active:scale-95 cursor-pointer flex flex-col items-center justify-center shadow-xs"
              title="Xóa tất cả (Clear All)"
            >
              <span>AC</span>
            </button>

            {/* Row 2: Parentheses, Absolute, 7, 8, 9, Division */}
            <button
              type="button"
              onClick={() => insertText('(')}
              className="p-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 font-mono text-sm transition active:scale-95 cursor-pointer"
              title="Mở ngoặc đơn"
            >
              (
            </button>
            <button
              type="button"
              onClick={() => insertText(')')}
              className="p-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 font-mono text-sm transition active:scale-95 cursor-pointer"
              title="Đóng ngoặc đơn"
            >
              )
            </button>
            <button
              type="button"
              onClick={() => execCmd(['insert', '|#?|'])}
              className="p-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 font-mono transition active:scale-95 cursor-pointer"
              title="Trị tuyệt đối"
            >
              |x|
            </button>
            <button
              type="button"
              onClick={() => insertText('7')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-base font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => insertText('8')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-base font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => insertText('9')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-base font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => execCmd(['insert', '\\div '])}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-base font-bold transition active:scale-95 cursor-pointer"
              title="Phép chia"
            >
              ÷
            </button>

            {/* Row 3: Variables x, y, z, 4, 5, 6, Multiplication */}
            <button
              type="button"
              onClick={() => insertText('x')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-serif italic text-sm transition active:scale-95 cursor-pointer"
              title="Biến x"
            >
              x
            </button>
            <button
              type="button"
              onClick={() => insertText('y')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-serif italic text-sm transition active:scale-95 cursor-pointer"
              title="Biến y"
            >
              y
            </button>
            <button
              type="button"
              onClick={() => execCmd(['insert', '^{#?}'])}
              className="p-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 font-mono transition active:scale-95 cursor-pointer"
              title="Số mũ tùy ý"
            >
              xʸ
            </button>
            <button
              type="button"
              onClick={() => insertText('4')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-base font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => insertText('5')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-base font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => insertText('6')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-base font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => execCmd(['insert', '\\times '])}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-base font-bold transition active:scale-95 cursor-pointer"
              title="Phép nhân"
            >
              ×
            </button>

            {/* Row 4: Pi, Subscript, Brackets, 1, 2, 3, Subtraction */}
            <button
              type="button"
              onClick={() => insertText('\\pi ')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-mono transition active:scale-95 cursor-pointer"
              title="Số Pi"
            >
              π
            </button>
            <button
              type="button"
              onClick={() => execCmd(['insert', '_{#?}'])}
              className="p-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 font-mono transition active:scale-95 cursor-pointer"
              title="Chỉ số dưới"
            >
              x₁
            </button>
            <button
              type="button"
              onClick={() => execCmd(['insert', '(#?)'])}
              className="p-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 font-mono transition active:scale-95 cursor-pointer"
              title="Cặp ngoặc đơn"
            >
              ( )
            </button>
            <button
              type="button"
              onClick={() => insertText('1')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-base font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => insertText('2')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-base font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => insertText('3')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-base font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => insertText('-')}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-base font-bold transition active:scale-95 cursor-pointer"
              title="Phép trừ"
            >
              -
            </button>

            {/* Row 5: Navigation, PlusMinus, 0, Dot, Equal, Addition */}
            <button
              type="button"
              onClick={() => execCmd('moveToPreviousChar')}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-mono transition active:scale-95 cursor-pointer flex items-center justify-center"
              title="Sang trái"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('moveToNextChar')}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-mono transition active:scale-95 cursor-pointer flex items-center justify-center"
              title="Sang phải"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertText('\\pm ')}
              className="p-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 font-mono transition active:scale-95 cursor-pointer"
              title="Cộng trừ"
            >
              ±
            </button>
            <button
              type="button"
              onClick={() => insertText('0')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-base font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => insertText('.')}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 text-base font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            >
              .
            </button>
            <button
              type="button"
              onClick={() => insertText('=')}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 text-base font-bold transition active:scale-95 cursor-pointer shadow-xs"
              title="Dấu bằng"
            >
              =
            </button>
            <button
              type="button"
              onClick={() => insertText('+')}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-base font-bold transition active:scale-95 cursor-pointer"
              title="Phép cộng"
            >
              +
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 truncate max-w-[280px]">
            Mã công thức: <code className="font-mono text-slate-700">{latexValue || '(trống)'}</code>
          </div>

          <div className="flex items-center gap-2">
            {onClose && !inline && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md hover:shadow-indigo-200 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Chèn công thức vào bài</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      {content}
    </div>
  );
}
