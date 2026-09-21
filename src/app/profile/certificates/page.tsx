'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/RoleGuard';
import { certificateService } from '@/services/certificate.service';
import { CertificateResponse } from '@/types/certificate';
import { formatErrorMessage } from '@/utils/errorMessage';
import {
  Award,
  GraduationCap,
  Calendar,
  Download,
  ExternalLink,
  Share2,
  Copy,
  Check,
  BookOpen,
  Loader2,
  Sparkles,
  ShieldCheck,
  Search,
  CheckCircle2,
} from 'lucide-react';

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await certificateService.getMyCertificates();
      setCertificates(data);
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải danh sách chứng chỉ'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (code: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/verify/${code}`;
      navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (c.courseName || '').toLowerCase().includes(q) ||
      (c.certificateCode || '').toLowerCase().includes(q) ||
      (c.subjectName || '').toLowerCase().includes(q)
    );
  });

  return (
    <RoleGuard allowedRoles={['ROLE_STUDENT', 'ROLE_TEACHER', 'ROLE_ADMIN', 'STUDENT', 'TEACHER', 'ADMIN']}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 mb-1">
              <Award className="w-4 h-4" />
              <span>Chứng Chỉ & Bằng Khen Của Tôi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Chứng Nhận Hoàn Thành Khóa Học
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Hệ thống tự động cấp chứng chỉ chính thức ngay khi bạn hoàn thành 100% khóa học.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile/progress"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>Xem tiến độ học tập</span>
            </Link>
            <Link
              href="/courses"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Học tiếp khóa học</span>
            </Link>
          </div>
        </div>

        {/* Search & Counter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-extrabold">
              {certificates.length}
            </span>
            <span>chứng chỉ đã được trao cho bạn</span>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên khóa học, mã chứng chỉ..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 text-sm border border-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Content list */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-amber-600 mx-auto" />
            <p className="text-sm font-medium text-slate-500">Đang tải danh sách chứng chỉ...</p>
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {searchQuery ? 'Không tìm thấy chứng chỉ phù hợp' : 'Bạn chưa có chứng chỉ nào'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {searchQuery
                  ? 'Hãy thử tìm kiếm với từ khóa khác.'
                  : 'Hãy hoàn thành 100% bài học và vượt qua các bài thi trong khóa học để nhận chứng chỉ hoàn thành tự động!'}
              </p>
            </div>
            {!searchQuery && (
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-emerald-600/20"
              >
                <span>Bắt đầu học ngay</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCerts.map((cert) => {
              const isCopied = copiedCode === cert.certificateCode;
              return (
                <div
                  key={cert.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative"
                >
                  {/* Top Certificate Header Banner */}
                  <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3 relative z-10">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                          ĐÃ HOÀN THÀNH 100%
                        </span>
                        <p className="text-xs font-mono font-bold text-slate-300 mt-2">#{cert.certificateCode}</p>
                      </div>

                      <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-400 flex items-center justify-center font-bold shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="font-black text-base text-white mt-3 line-clamp-2 leading-snug">
                      {cert.courseName}
                    </h3>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Môn học:</span>
                        <strong className="text-slate-800">{cert.subjectName || 'Chung'}</strong>
                      </div>

                      <div className="flex items-center justify-between text-slate-500">
                        <span>Ngày cấp:</span>
                        <strong className="text-slate-800">
                          {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('vi-VN') : '--'}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-slate-500">
                        <span>Trạng thái:</span>
                        <span className="text-emerald-600 font-black flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Có hiệu lực
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Download PDF button */}
                        <a
                          href={certificateService.getDownloadPdfUrl(cert.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Tải PDF</span>
                        </a>

                        {/* Public Verify Link */}
                        <Link
                          href={`/verify/${cert.certificateCode}`}
                          target="_blank"
                          className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Xem xác thực</span>
                        </Link>
                      </div>

                      {/* Share Link Button */}
                      <button
                        onClick={() => handleCopyLink(cert.certificateCode)}
                        className="w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200/60"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Đã sao chép liên kết công khai!' : 'Sao chép link chia sẻ'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
