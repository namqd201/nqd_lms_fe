'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { certificateService } from '@/services/certificate.service';
import { CertificateVerificationResponse } from '@/types/certificate';
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Download,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  BookOpen,
  QrCode,
  ExternalLink,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function CertificateVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || '';

  const [verification, setVerification] = useState<CertificateVerificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (code) {
      verifyCode(code);
    }
  }, [code]);

  const verifyCode = async (certCode: string) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await certificateService.verifyCertificate(certCode);
      setVerification(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể xác thực mã chứng chỉ này');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            N
          </div>
          <div>
            <span className="font-black text-lg text-white tracking-tight">NQD LMS</span>
            <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Hệ thống Giáo dục Trực tuyến
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
            title="Sao chép liên kết xác thực"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Đã sao chép' : 'Chia sẻ'}</span>
          </button>

          <Link
            href="/courses"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <span>Khám phá khóa học</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Certificate Card Section */}
      <div className="max-w-3xl w-full mx-auto my-auto py-8">
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Đang tra cứu dữ liệu chứng chỉ trên hệ thống...</p>
          </div>
        ) : errorMsg || !verification || !verification.valid ? (
          <div className="bg-white/5 backdrop-blur-md border border-rose-500/30 rounded-3xl p-8 sm:p-10 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Chứng Chỉ Không Hợp Lệ Hoặc Đã Bị Thu Hồi</h2>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Mã chứng chỉ <strong className="text-rose-300 font-mono font-bold">#{code}</strong> không tồn tại trong hệ thống NQD-LMS hoặc đã bị thu hồi/hết hạn.
              </p>
            </div>

            {verification?.revocationReason && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 max-w-md mx-auto text-left">
                <strong>Lý do thu hồi:</strong> {verification.revocationReason}
              </div>
            )}

            <div className="pt-4 flex justify-center gap-3">
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Trở về trang chủ</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Verified Badge Header */}
            <div className="flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-4 rounded-full text-xs font-bold w-fit mx-auto shadow-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Chứng chỉ trực tuyến đã được xác thực bởi NQD-LMS</span>
            </div>

            {/* Certificate Paper Style Container */}
            <div className="bg-gradient-to-b from-white via-slate-50 to-slate-100 rounded-3xl p-6 sm:p-10 text-slate-900 shadow-2xl border-4 border-amber-400/40 relative overflow-hidden">
              {/* Corner Ornaments */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

              {/* Certificate Inner Frame */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center space-y-6">
                {/* Organization Header */}
                <div className="space-y-1">
                  <span className="text-[11px] font-black tracking-widest text-emerald-700 uppercase">
                    NQD LEARNING MANAGEMENT SYSTEM
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    CHỨNG NHẬN HOÀN THÀNH
                  </h1>
                  <p className="text-xs font-bold tracking-wider text-amber-600 uppercase">
                    Certificate of Course Completion
                  </p>
                </div>

                <div className="text-xs text-slate-500 font-medium">Chứng nhận này được trân trọng trao tặng cho</div>

                {/* Student Full Name */}
                <div className="py-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight uppercase border-b-2 border-emerald-600/30 pb-2 inline-block px-6">
                    {verification.studentName}
                  </h2>
                </div>

                {/* Reason Text */}
                <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Đã hoàn thành xuất sắc 100% nội dung và vượt qua tất cả các bài kiểm tra đánh giá năng lực của khóa học:
                </p>

                {/* Course Title Banner */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg space-y-1 max-w-xl mx-auto">
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{verification.subjectName || 'Khóa học Trực Tuyến'}</span>
                    {verification.courseCode && (
                      <span className="font-mono text-slate-300">#{verification.courseCode}</span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white">{verification.courseName}</h3>
                </div>

                {/* Certificate Meta Grid */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-xs">
                  <div className="text-left space-y-1">
                    <span className="text-slate-400 font-bold">MÃ CHỨNG CHỈ:</span>
                    <p className="font-mono font-black text-slate-900 text-sm">{verification.certificateCode}</p>
                    <p className="text-[11px] text-slate-500">
                      Ngày cấp: {verification.issuedAt ? new Date(verification.issuedAt).toLocaleDateString('vi-VN') : '--'}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center font-black shadow-xs">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black tracking-wider text-amber-800 uppercase">
                      Official Verified Seal
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-slate-400 font-bold">ĐƠN VỊ CẤP CHỨNG NHẬN:</span>
                    <p className="font-bold text-slate-900">{verification.issuerName}</p>
                    <p className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đã ký số điện tử
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleCopyLink}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-2 border border-white/10 cursor-pointer"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{isCopied ? 'Đã sao chép liên kết!' : 'Chia sẻ chứng chỉ'}</span>
              </button>

              <Link
                href="/courses"
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Học thêm khóa học khác</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 pt-6 border-t border-white/10">
        &copy; {new Date().getFullYear()} NQD Learning Management System. Chứng chỉ được cấp tự động và bảo mật theo chuẩn số hóa.
      </div>
    </div>
  );
}
