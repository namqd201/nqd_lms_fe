'use client';

import React, { useState, useEffect } from 'react';
import { TeacherExamResponse, ExamPaperExportParams } from '@/types/exam';
import {
  FileText,
  X,
  Download,
  School,
  Building2,
  GraduationCap,
  Sparkles,
  Loader2,
  Printer,
  FileDown,
} from 'lucide-react';

interface ExamPaperExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: TeacherExamResponse | null;
  onExport: (params: ExamPaperExportParams, format: 'DOCX' | 'PDF') => Promise<void>;
}

export default function ExamPaperExportModal({
  isOpen,
  onClose,
  exam,
  onExport,
}: ExamPaperExportModalProps) {
  const [institutionName, setInstitutionName] = useState<string>('Trường Tiểu học Đồng Tâm');
  const [departmentName, setDepartmentName] = useState<string>('');
  const [examTitle, setExamTitle] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('Năm học: 2024 - 2025');
  const [subjectName, setSubjectName] = useState<string>('Toán');
  const [durationMinutes, setDurationMinutes] = useState<number>(40);
  const [instructionNote, setInstructionNote] = useState<string>('Khoanh vào trước câu trả lời đúng nhất.');
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'DOCX' | 'PDF'>('DOCX');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && exam) {
      setInstitutionName('Trường Tiểu học Đồng Tâm');
      setDepartmentName('');
      setExamTitle(exam.title ? exam.title.toUpperCase() : 'ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC');
      setAcademicYear('Năm học: 2024 - 2025');
      setSubjectName(exam.subjectName || 'Toán');
      setDurationMinutes(exam.durationMinutes || 40);
      setInstructionNote('Khoanh vào trước câu trả lời đúng nhất.');
      setIncludeAnswerKey(false);
      setExportFormat('DOCX');
      setErrorMessage(null);
    }
  }, [isOpen, exam]);

  if (!isOpen || !exam) return null;

  const handleApplyPreset = (preset: 'TIỂU_HỌC' | 'THCS' | 'THPT' | 'TRUNG_TÂM') => {
    if (preset === 'TIỂU_HỌC') {
      setInstitutionName('Trường Tiểu học Đồng Tâm');
      setDepartmentName('PHÒNG GIÁO DỤC VÀ ĐÀO TẠO');
      setExamTitle('ĐỀ KIỂM TRA CUỐI HỌC KÌ I - LỚP 1');
      setAcademicYear('Năm học: 2014- 2015');
      setInstructionNote('Khoanh vào trước câu trả lời đúng nhất.');
    } else if (preset === 'THCS') {
      setInstitutionName('Trường THCS Chu Văn An');
      setDepartmentName('PHÒNG GIÁO DỤC VÀ ĐÀO TẠO');
      setExamTitle('ĐỀ KIỂM TRA HỌC KỲ I');
      setAcademicYear('Năm học: 2024 - 2025');
      setInstructionNote('Khoanh tròn vào chữ cái trước phương án trả lời đúng.');
    } else if (preset === 'THPT') {
      setInstitutionName('Trường THPT Chuyên Nguyễn Tất Thành');
      setDepartmentName('SỞ GIÁO DỤC VÀ ĐÀO TẠO');
      setExamTitle('ĐỀ KHẢO SÁT CHẤT LƯỢNG HỌC KỲ');
      setAcademicYear('Năm học: 2024 - 2025');
      setInstructionNote('Thí sinh ghi đáp án đúng vào phiếu trả lời.');
    } else {
      setInstitutionName('Trung tâm Bồi dưỡng Văn hóa & Luyện thi NQD');
      setDepartmentName('');
      setExamTitle('ĐỀ THI ĐÁNH GIÁ NĂNG LỰC ĐỊNH KỲ');
      setAcademicYear('Năm học: 2024 - 2025');
      setInstructionNote('Khoanh vào trước câu trả lời đúng nhất.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setErrorMessage(null);
    try {
      await onExport(
        {
          institutionName: institutionName.trim(),
          departmentName: departmentName.trim() || undefined,
          examTitle: examTitle.trim(),
          academicYear: academicYear.trim(),
          subjectName: subjectName.trim(),
          durationMinutes: Number(durationMinutes) || 40,
          instructionNote: instructionNote.trim(),
          includeAnswerKey,
        },
        exportFormat
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tải đề thi thất bại';
      setErrorMessage(msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                In & Tải Đề Thi Chuẩn Bộ GD&ĐT
              </h3>
              <p className="text-xs text-slate-500">
                Bố cục chuẩn form: Tiêu đề 2 cột, bảng Điểm & Giám thị, câu Trắc nghiệm & Tự luận.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Gợi ý mẫu trường học / trung tâm:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('TIỂU_HỌC')}
                className="px-2.5 py-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl font-bold text-slate-700 hover:text-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <School className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tiểu học Đồng Tâm</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('THCS')}
                className="px-2.5 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl font-bold text-slate-700 hover:text-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>Trường THCS</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('THPT')}
                className="px-2.5 py-2 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl font-bold text-slate-700 hover:text-purple-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>Trường THPT</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('TRUNG_TÂM')}
                className="px-2.5 py-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl font-bold text-slate-700 hover:text-amber-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Trung tâm / Học viện</span>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Institution Name */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Tên Trường học / Trung tâm <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="VD: Trường Tiểu học Đồng Tâm"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none font-semibold text-slate-900 transition-all text-xs sm:text-sm"
              />
            </div>

            {/* Department Name */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Phòng / Sở GD&ĐT (Tùy chọn)
              </label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="VD: PHÒNG GIÁO DỤC VÀ ĐÀO TẠO..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none text-slate-900 transition-all text-xs sm:text-sm"
              />
            </div>

            {/* Exam Title */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Tiêu đề Đề kiểm tra <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="VD: ĐỀ KIỂM TRA CUỐI HỌC KÌ I - LỚP 1"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all text-xs sm:text-sm"
              />
            </div>

            {/* Academic Year */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Năm học <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="VD: Năm học: 2014- 2015 hoặc 2024 - 2025"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none text-slate-900 transition-all text-xs sm:text-sm"
              />
            </div>

            {/* Subject Name */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Môn thi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="VD: Toán, Tiếng Việt, Tiếng Anh..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none font-semibold text-slate-900 transition-all text-xs sm:text-sm"
              />
            </div>

            {/* Duration Minutes */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Thời gian làm bài (phút) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="5"
                max="240"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none text-slate-900 transition-all text-xs sm:text-sm"
              />
            </div>

            {/* Instruction Note */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Lời dặn phần Trắc nghiệm
              </label>
              <input
                type="text"
                value={instructionNote}
                onChange={(e) => setInstructionNote(e.target.value)}
                placeholder="VD: Khoanh vào trước câu trả lời đúng nhất."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none text-slate-900 transition-all text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Option: Include Answer Key */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
            <input
              type="checkbox"
              id="includeAnswerKey"
              checked={includeAnswerKey}
              onChange={(e) => setIncludeAnswerKey(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
            />
            <label htmlFor="includeAnswerKey" className="cursor-pointer select-none">
              <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                In kèm Trang Đáp án & Hướng dẫn chấm (Bản dành cho Giáo viên)
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Tự động tạo bảng đáp án trắc nghiệm (1.A, 2.B...) và lời giải chi tiết tự luận ở trang phụ lục cuối cùng.
              </span>
            </label>
          </div>

          {/* Choose Export Format: Word (.docx) or PDF (.pdf) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Chọn định dạng xuất tải về:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('DOCX')}
                className={
                  'p-3.5 rounded-2xl border transition-all text-left flex items-start gap-3 cursor-pointer ' +
                  (exportFormat === 'DOCX'
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50')
                }
              >
                <div
                  className={
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ' +
                    (exportFormat === 'DOCX' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500')
                  }
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Microsoft Word (.docx)</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded">Khuyên dùng</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mở được trên Word để tùy chỉnh thêm câu hỏi hoặc đổi font trước khi photo in cho học sinh.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('PDF')}
                className={
                  'p-3.5 rounded-2xl border transition-all text-left flex items-start gap-3 cursor-pointer ' +
                  (exportFormat === 'PDF'
                    ? 'border-rose-500 bg-rose-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50')
                }
              >
                <div
                  className={
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ' +
                    (exportFormat === 'PDF' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500')
                  }
                >
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Tài liệu PDF (.pdf)</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Định dạng cố định chuẩn trang A4, in trực tiếp ngay không lo bị xô lệch dòng hay lỗi font.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isExporting}
              className={
                'px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ' +
                (exportFormat === 'DOCX'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25')
              }
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo đề thi...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Tải Đề Thi ({exportFormat === 'DOCX' ? '.docx' : '.pdf'})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
