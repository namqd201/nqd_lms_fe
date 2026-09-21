'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Award,
  Users,
  ShieldCheck,
  BrainCircuit,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectRole = async (role: 'STUDENT' | 'TEACHER') => {
    setSelectedRole(role);
    setIsSubmitting(true);
    try {
      await authService.completeOnboarding();
      await refreshUser();

      if (role === 'STUDENT') {
        router.push('/');
      } else {
        router.push('/become-teacher');
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      // Even if API fails, navigate accordingly
      if (role === 'STUDENT') {
        router.push('/');
      } else {
        router.push('/become-teacher');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#83C75D]/15 text-[#4e8231] text-xs font-bold border border-[#83C75D]/30">
            <Sparkles className="w-4 h-4" />
            <span>Chào mừng bạn đến với NQD LMS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {user?.fullName ? `Xin chào, ${user.fullName}!` : 'Chọn mục tiêu của bạn'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Vui lòng cho chúng tôi biết bạn tham gia NQD LMS với vai trò chính là gì để hệ thống chuẩn bị giao diện tối ưu nhất cho bạn:
          </p>
        </div>

        {/* Role Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Card 1: Học sinh / Sinh viên */}
          <div
            onClick={() => !isSubmitting && handleSelectRole('STUDENT')}
            className={`group relative bg-white border-2 rounded-3xl p-6 sm:p-8 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between ${
              selectedRole === 'STUDENT'
                ? 'border-[#83C75D] ring-4 ring-[#83C75D]/20'
                : 'border-slate-200/80 hover:border-[#83C75D]/60'
            }`}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Học tập & Luyện thi
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-[#4e8231] transition-colors">
                  Tôi là Học sinh / Sinh viên
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Tôi muốn tìm kiếm các khóa học chất lượng, làm bài tập rèn luyện và chuẩn bị tốt nhất cho các kỳ thi.
                </p>
              </div>

              <ul className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#83C75D] shrink-0" />
                  <span>Học bài học video, lý thuyết & tài liệu chuẩn</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#83C75D] shrink-0" />
                  <span>Luyện thi đề thi tự luận & trắc nghiệm có chấm điểm</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <BrainCircuit className="w-4 h-4 text-[#83C75D] shrink-0" />
                  <span>Trợ lý gia sư AI đồng hành hướng dẫn giải bài 24/7</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Award className="w-4 h-4 text-[#83C75D] shrink-0" />
                  <span>Nhận chứng chỉ điện tử sau khi hoàn thành khóa</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <button
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 group-hover:bg-[#83C75D] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting && selectedRole === 'STUDENT' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang thiết lập...</span>
                  </>
                ) : (
                  <>
                    <span>Vào trang học tập ngay</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Giáo viên / Giảng viên / Gia sư */}
          <div
            onClick={() => !isSubmitting && handleSelectRole('TEACHER')}
            className={`group relative bg-white border-2 rounded-3xl p-6 sm:p-8 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between ${
              selectedRole === 'TEACHER'
                ? 'border-amber-500 ring-4 ring-amber-500/20'
                : 'border-slate-200/80 hover:border-amber-400'
            }`}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                  <BookOpen className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Dành cho Giảng dạy
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                  Tôi là Giáo viên / Gia sư
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Bao gồm giáo viên chính quy, sinh viên dạy kèm làm thêm và chuyên gia muốn chia sẻ kiến thức.
                </p>
              </div>

              <ul className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Xuất bản khóa học trực tuyến & bán bài giảng</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Xây dựng ngân hàng câu hỏi & tạo đề thi tự động</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Users className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Theo dõi và phân tích kết quả học tập của học viên</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Xét duyệt linh hoạt (chấp nhận Thẻ sinh viên hoặc Bằng cấp)</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <button
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-600 group-hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting && selectedRole === 'TEACHER' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang chuẩn bị...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng ký xét duyệt giảng dạy</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-400">
          💡 Lưu ý: Bạn có thể cập nhật thông tin hoặc đăng ký xét duyệt làm Giáo viên bất kỳ lúc nào trong phần cài đặt tài khoản.
        </p>
      </div>
    </div>
  );
}
