'use client';

import React, { useState, useEffect } from 'react';
import { ExportCustomizationParams, ExportFormat } from '@/types/report';
import {
  FileSpreadsheet,
  FileText,
  X,
  Download,
  School,
  Building2,
  GraduationCap,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';

interface ExportCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (params: ExportCustomizationParams) => Promise<void>;
  title?: string;
  defaultInstitutionName?: string;
  defaultReportTitle?: string;
  defaultAcademicYear?: string;
  defaultSignerTitle?: string;
  format?: ExportFormat;
}

export default function ExportCustomizationModal({
  isOpen,
  onClose,
  onExport,
  title = 'Tùy biến Bảng điểm & Báo cáo',
  defaultInstitutionName = 'HỆ THỐNG GIÁO DỤC TRỰC TUYẾN NQD LMS',
  defaultReportTitle = '',
  defaultAcademicYear = 'Năm học 2025 - 2026',
  defaultSignerTitle = 'GIÁO VIÊN BỘ MÔN / BAN GIÁM HIỆU',
  format = 'EXCEL',
}: ExportCustomizationModalProps) {
  const [institutionName, setInstitutionName] = useState<string>(defaultInstitutionName);
  const [reportTitle, setReportTitle] = useState<string>(defaultReportTitle);
  const [academicYear, setAcademicYear] = useState<string>(defaultAcademicYear);
  const [signerTitle, setSignerTitle] = useState<string>(defaultSignerTitle);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInstitutionName(defaultInstitutionName);
      setReportTitle(defaultReportTitle);
      setAcademicYear(defaultAcademicYear);
      setSignerTitle(defaultSignerTitle);
      setErrorMessage(null);
    }
  }, [isOpen, defaultInstitutionName, defaultReportTitle, defaultAcademicYear, defaultSignerTitle]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetType: 'SCHOOL' | 'CENTER' | 'ACADEMY') => {
    if (presetType === 'SCHOOL') {
      setInstitutionName('TRƯỜNG THPT CHUYÊN NGUYỄN TẤT THÀNH');
      setSignerTitle('HIỆU TRƯỞNG / BAN GIÁM HIỆU');
    } else if (presetType === 'CENTER') {
      setInstitutionName('TRUNG TÂM BỒI DƯỠNG VĂN HÓA & LUYỆN THI NQD');
      setSignerTitle('GIÁM ĐỐC TRUNG TÂM');
    } else {
      setInstitutionName('HỌC VIỆN ĐÀO TẠO & KHẢO THÍ NQD LMS');
      setSignerTitle('BAN ĐÀO TẠO & KHẢO THÍ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setErrorMessage(null);
    try {
      await onExport({
        institutionName: institutionName.trim(),
        reportTitle: reportTitle.trim() || undefined,
        academicYear: academicYear.trim() || undefined,
        signerTitle: signerTitle.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xuất dữ liệu thất bại';
      setErrorMessage(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const isExcel = format === 'EXCEL';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${
                isExcel
                  ? 'bg-emerald-100 text-emerald-700 shadow-emerald-500/20'
                  : 'bg-rose-100 text-rose-700 shadow-rose-500/20'
              }`}
            >
              {isExcel ? <FileSpreadsheet className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                Định dạng xuất:{' '}
                <strong className={isExcel ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {isExcel ? 'Excel (.xlsx)' : 'PDF (.pdf)'}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Mẫu cơ quan / tổ chức gợi ý:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('SCHOOL')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <School className="w-3.5 h-3.5 text-indigo-600" />
              <span>Trường học</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('CENTER')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Trung tâm</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('ACADEMY')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Học viện</span>
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Tên Trường học / Trung tâm đào tạo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="VD: TRƯỜNG THPT CHUYÊN NGUYỄN HUỆ..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Tiêu đề Bảng điểm / Báo cáo <span className="text-slate-400 font-normal">(để trống sẽ dùng mặc định)</span>
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="VD: BẢNG ĐIỂM TỔNG KẾT KHÓA LUYỆN THI ĐẠI HỌC..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Niên khóa / Kỷ báo cáo</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="VD: Năm học 2025 - 2026"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Chức danh người ký duyệt</label>
              <input
                type="text"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                placeholder="VD: HIỆU TRƯỞNG / GIÁM ĐỐC"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isExporting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isExporting || !institutionName.trim()}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                isExcel
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo file...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Tải xuống ngay ({isExcel ? '.xlsx' : '.pdf'})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
