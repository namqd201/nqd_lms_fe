'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { teacherApplicationService } from '@/services/teacher-application.service';
import {
  TeacherApplicantType,
  TeacherApplicationRequest,
  TeacherApplicationResponse,
} from '@/types/teacher-application';
import {
  GraduationCap,
  Sparkles,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Eye,
  Video,
  UserCheck,
} from 'lucide-react';

export default function BecomeTeacherPage() {
  const router = useRouter();
  const { user, isAuthenticated, loginWithGoogle } = useAuth();

  const isAlreadyTeacher = user?.roles?.some(
    (r) => r === 'TEACHER' || r === 'ROLE_TEACHER' || r === 'ADMIN' || r === 'ROLE_ADMIN'
  );

  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<TeacherApplicationResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [applicantType, setApplicantType] = useState<TeacherApplicantType>('STUDENT_TUTOR');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [majorOrSubject, setMajorOrSubject] = useState('');
  const [bio, setBio] = useState('');
  const [sampleVideoUrl, setSampleVideoUrl] = useState('');
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [idCardFrontUrl, setIdCardFrontUrl] = useState<string>('');
  const [idCardBackUrl, setIdCardBackUrl] = useState<string>('');

  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isUploadingIdFront, setIsUploadingIdFront] = useState(false);
  const [isUploadingIdBack, setIsUploadingIdBack] = useState(false);

  // Lightbox preview for images
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    async function loadMyApplication() {
      setIsLoading(true);
      try {
        const app = await teacherApplicationService.getMyApplication();
        setApplication(app);
        if (app) {
          setApplicantType(app.applicantType);
          setFullName(app.fullName || '');
          setPhoneNumber(app.phoneNumber || '');
          setEmail(app.email || '');
          setInstitutionName(app.institutionName || '');
          setMajorOrSubject(app.majorOrSubject || '');
          setBio(app.bio || '');
          setSampleVideoUrl(app.sampleVideoUrl || '');
          setDocumentUrls(app.documentUrls || []);
          setIdCardFrontUrl(app.idCardFrontUrl || '');
          setIdCardBackUrl(app.idCardBackUrl || '');
        } else if (user) {
          setFullName(user.fullName || '');
          setEmail(user.email || '');
          setPhoneNumber(user.phoneNumber || '');
        }
      } catch (err) {
        console.error('Failed to load teacher application:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadMyApplication();
  }, [isAuthenticated, user]);

  const handleUploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'DOC' | 'ID_FRONT' | 'ID_BACK'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng tệp không được vượt quá 5MB');
      return;
    }

    if (type === 'DOC') setIsUploadingDoc(true);
    if (type === 'ID_FRONT') setIsUploadingIdFront(true);
    if (type === 'ID_BACK') setIsUploadingIdBack(true);

    try {
      const url = await teacherApplicationService.uploadDocument(file);
      if (type === 'DOC') {
        setDocumentUrls((prev) => [...prev, url]);
      } else if (type === 'ID_FRONT') {
        setIdCardFrontUrl(url);
      } else if (type === 'ID_BACK') {
        setIdCardBackUrl(url);
      }
    } catch (err: any) {
      alert(err.message || 'Tải tệp tin lên thất bại');
    } finally {
      if (type === 'DOC') setIsUploadingDoc(false);
      if (type === 'ID_FRONT') setIsUploadingIdFront(false);
      if (type === 'ID_BACK') setIsUploadingIdBack(false);
      e.target.value = '';
    }
  };

  const handleRemoveDoc = (index: number) => {
    setDocumentUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !phoneNumber.trim() || !email.trim() || !institutionName.trim() || !majorOrSubject.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc có dấu (*)');
      return;
    }

    if (documentUrls.length === 0) {
      setErrorMessage('Vui lòng tải lên ít nhất 1 ảnh bằng chứng (Thẻ sinh viên, Bằng cấp hoặc Chứng chỉ)');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: TeacherApplicationRequest = {
        applicantType,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        institutionName: institutionName.trim(),
        majorOrSubject: majorOrSubject.trim(),
        bio: bio.trim(),
        documentUrls,
        idCardFrontUrl: idCardFrontUrl || undefined,
        idCardBackUrl: idCardBackUrl || undefined,
        sampleVideoUrl: sampleVideoUrl.trim() || undefined,
      };

      let res: TeacherApplicationResponse;
      if (application && application.status === 'REJECTED') {
        res = await teacherApplicationService.updateMyApplication(payload);
      } else {
        res = await teacherApplicationService.submitApplication(payload);
      }

      setApplication(res);
      setIsEditing(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gửi hồ sơ thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const getFullFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Đăng ký Xét duyệt Giáo viên</h2>
          <p className="text-xs text-slate-500">
            Vui lòng đăng nhập vào tài khoản NQD LMS để nộp hồ sơ xét duyệt giảng dạy và chia sẻ doanh thu.
          </p>
          <button
            onClick={loginWithGoogle}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Đăng nhập với Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[#83C75D] animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Đang tải hồ sơ của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#4e8231] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </Link>

        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#83C75D]/15 text-[#4e8231] border border-[#83C75D]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NQD LMS Đối tác Giảng dạy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Đăng ký Xét duyệt Tài khoản Giáo viên
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                Áp dụng cho Giáo viên chính quy, Sinh viên làm thêm / Gia sư và các Chuyên gia kỹ năng thực tế. Hồ sơ sẽ được Ban Quản Trị xem xét và duyệt cấp quyền giảng dạy.
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
              <UserCheck className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Status: Already Teacher */}
        {isAlreadyTeacher && (
          <div className="bg-white border border-emerald-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Tài khoản của bạn đã là Giáo viên chính thức!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Bạn có toàn quyền sử dụng các công cụ giảng dạy, xuất bản khóa học, quản lý đề thi và theo dõi học viên.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/teacher/courses"
                className="px-5 py-2.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Quản lý Khóa học</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/teacher/exams"
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Quản lý Đề thi
              </Link>
              <Link
                href="/teacher/questions"
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Ngân hàng Câu hỏi
              </Link>
            </div>
          </div>
        )}

        {/* Status: PENDING */}
        {!isAlreadyTeacher && application && application.status === 'PENDING' && !isEditing && (
          <div className="bg-white border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    Hồ sơ đang chờ Ban Quản Trị xét duyệt
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                    Đang xử lý
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hồ sơ của bạn đã được gửi thành công vào lúc{' '}
                  <strong className="text-slate-700">
                    {new Date(application.createdAt).toLocaleString('vi-VN')}
                  </strong>
                  . Ban Quản Trị sẽ tiến hành thẩm định trong vòng 24 - 48 giờ làm việc. Bạn sẽ nhận được thông báo ngay khi có kết quả.
                </p>
              </div>
            </div>

            {/* Application Overview Details */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 text-xs">
              <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                Thông tin hồ sơ đã nộp
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="text-slate-400 block">Họ và tên:</span>
                  <span className="font-bold text-slate-800">{application.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Hình thức giảng dạy:</span>
                  <span className="font-bold text-slate-800">
                    {application.applicantType === 'STUDENT_TUTOR'
                      ? '🧑‍🎓 Sinh viên làm thêm / Gia sư'
                      : application.applicantType === 'CERTIFIED_TEACHER'
                      ? '🎓 Giáo viên / Giảng viên có bằng cấp'
                      : '💼 Chuyên gia kỹ năng thực tế'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Trường học / Đơn vị:</span>
                  <span className="font-bold text-slate-800">{application.institutionName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Môn giảng dạy / Chuyên ngành:</span>
                  <span className="font-bold text-slate-800">{application.majorOrSubject}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Số điện thoại:</span>
                  <span className="font-bold text-slate-800">{application.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email liên hệ:</span>
                  <span className="font-bold text-slate-800">{application.email}</span>
                </div>
              </div>

              {/* Uploaded Documents */}
              {application.documentUrls && application.documentUrls.length > 0 && (
                <div className="pt-3 border-t border-slate-200/80 space-y-2">
                  <span className="text-slate-400 block font-semibold">Tài liệu / Ảnh bằng chứng đã gửi ({application.documentUrls.length} ảnh):</span>
                  <div className="flex flex-wrap gap-3">
                    {application.documentUrls.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImage(getFullFileUrl(url))}
                        className="w-20 h-20 rounded-xl border border-slate-200 overflow-hidden relative cursor-pointer group hover:ring-2 hover:ring-[#83C75D]"
                      >
                        <img
                          src={getFullFileUrl(url)}
                          alt="Document"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Chỉnh sửa thông tin hồ sơ
              </button>
            </div>
          </div>
        )}

        {/* Status: REJECTED */}
        {!isAlreadyTeacher && application && application.status === 'REJECTED' && !isEditing && (
          <div className="bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    Hồ sơ chưa được phê duyệt
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                    Cần cập nhật
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ban Quản Trị đã xem xét hồ sơ của bạn và có phản hồi sau. Bạn có thể cập nhật lại tài liệu để được duyệt ngay.
                </p>
              </div>
            </div>

            {/* Rejection Reason Alert */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-1">
              <span className="font-bold text-rose-800 block flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Lý do từ Ban Quản Trị:</span>
              </span>
              <p className="text-rose-700 pl-5 leading-relaxed font-medium">
                {application.rejectReason || 'Hồ sơ chưa cung cấp đầy đủ hình ảnh bằng chứng hoặc thẻ sinh viên/bằng cấp chưa rõ nét.'}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Cập nhật & Nộp lại hồ sơ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Application Form (For new submission or editing) */}
        {(!application || isEditing) && !isAlreadyTeacher && (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Chọn đối tượng */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-extrabold text-slate-900 block">
                  1. Bạn đăng ký với tư cách đối tượng nào? <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Chọn đúng đối tượng để chuẩn bị tài liệu xác minh phù hợp và được duyệt nhanh nhất.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option: Student Tutor */}
                <div
                  onClick={() => setApplicantType('STUDENT_TUTOR')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    applicantType === 'STUDENT_TUTOR'
                      ? 'border-[#83C75D] bg-[#83C75D]/5 ring-2 ring-[#83C75D]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🧑‍🎓</span>
                      <input
                        type="radio"
                        checked={applicantType === 'STUDENT_TUTOR'}
                        onChange={() => setApplicantType('STUDENT_TUTOR')}
                        className="text-[#83C75D] focus:ring-[#83C75D]"
                      />
                    </div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Sinh viên làm thêm / Gia sư
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Chưa tốt nghiệp. Cần chụp <strong>Thẻ sinh viên 2 mặt</strong> và <strong>Bảng điểm hoặc giải thưởng / điểm thi ĐH</strong>.
                    </p>
                  </div>
                </div>

                {/* Option: Certified Teacher */}
                <div
                  onClick={() => setApplicantType('CERTIFIED_TEACHER')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    applicantType === 'CERTIFIED_TEACHER'
                      ? 'border-[#83C75D] bg-[#83C75D]/5 ring-2 ring-[#83C75D]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🎓</span>
                      <input
                        type="radio"
                        checked={applicantType === 'CERTIFIED_TEACHER'}
                        onChange={() => setApplicantType('CERTIFIED_TEACHER')}
                        className="text-[#83C75D] focus:ring-[#83C75D]"
                      />
                    </div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Giáo viên có bằng cấp
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Đã tốt nghiệp Đại học/Cao đẳng. Cần chụp <strong>Bằng tốt nghiệp</strong> hoặc <strong>Chứng chỉ sư phạm</strong>.
                    </p>
                  </div>
                </div>

                {/* Option: Industry Expert */}
                <div
                  onClick={() => setApplicantType('INDUSTRY_EXPERT')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    applicantType === 'INDUSTRY_EXPERT'
                      ? 'border-[#83C75D] bg-[#83C75D]/5 ring-2 ring-[#83C75D]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">💼</span>
                      <input
                        type="radio"
                        checked={applicantType === 'INDUSTRY_EXPERT'}
                        onChange={() => setApplicantType('INDUSTRY_EXPERT')}
                        className="text-[#83C75D] focus:ring-[#83C75D]"
                      />
                    </div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Chuyên gia thực tế / Freelancer
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Dạy kỹ năng (Lập trình, Đồ họa, Ngoại ngữ). Cần gửi <strong>Chứng chỉ quốc tế / Portfolio / CV</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Thông tin chuyên môn */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="text-sm font-extrabold text-slate-900 block">
                2. Thông tin chuyên môn & liên hệ
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#83C75D] font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Số điện thoại Zalo / Liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912345678"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#83C75D] font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Email liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#83C75D] font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {applicantType === 'STUDENT_TUTOR'
                      ? 'Trường Đại học đang theo học *'
                      : 'Đơn vị công tác / Trường học *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder={
                      applicantType === 'STUDENT_TUTOR'
                        ? 'VD: ĐH Bách Khoa Hà Nội, ĐH Sư Phạm TP.HCM'
                        : 'VD: THPT Chuyên Hà Nội - Amsterdam, Freelancer...'
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#83C75D] font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Chuyên ngành / Môn học thế mạnh giảng dạy <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={majorOrSubject}
                    onChange={(e) => setMajorOrSubject(e.target.value)}
                    placeholder="VD: Toán 10-12 & Luyện thi THPTQG, Tiếng Anh IELTS, Lập trình Frontend..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#83C75D] font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Giới thiệu ngắn về bản thân & kinh nghiệm giảng dạy
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tóm tắt thành tích, số năm dạy kèm/gia sư, phong cách giảng dạy..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#83C75D] font-medium resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-slate-400" />
                    <span>Link video dạy thử hoặc giới thiệu bản thân (Tùy chọn)</span>
                  </label>
                  <input
                    type="url"
                    value={sampleVideoUrl}
                    onChange={(e) => setSampleVideoUrl(e.target.value)}
                    placeholder="Link video YouTube hoặc Google Drive (để chế độ công khai)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#83C75D] font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Tải ảnh bằng cấp / thẻ sinh viên */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="text-sm font-extrabold text-slate-900 block">
                  3. Tải lên Giấy tờ / Bằng chứng xác minh <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  {applicantType === 'STUDENT_TUTOR'
                    ? 'Vui lòng chụp rõ nét Thẻ sinh viên (2 mặt) và Bảng điểm gần nhất hoặc giấy khen/điểm thi.'
                    : applicantType === 'CERTIFIED_TEACHER'
                    ? 'Vui lòng chụp rõ nét Bằng tốt nghiệp Đại học/Cao đẳng, Bằng Thạc sĩ hoặc Chứng chỉ nghiệp vụ sư phạm.'
                    : 'Vui lòng tải lên Chứng chỉ quốc tế (IELTS/AWS/Google), Portfolio hoặc CV bản scan.'}
                </p>
              </div>

              {/* Document Files List */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {documentUrls.map((url, index) => (
                  <div key={index} className="relative rounded-2xl border border-slate-200 overflow-hidden group h-28 bg-slate-100">
                    <img
                      src={getFullFileUrl(url)}
                      alt="Uploaded doc"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewImage(getFullFileUrl(url))}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(index)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Upload Button */}
                <label className="h-28 border-2 border-dashed border-slate-300 hover:border-[#83C75D] rounded-2xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors hover:bg-[#83C75D]/5">
                  {isUploadingDoc ? (
                    <Loader2 className="w-6 h-6 text-[#83C75D] animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[11px] font-bold text-slate-700">Tải ảnh lên</span>
                      <span className="text-[9px] text-slate-400">JPG, PNG, PDF &lt; 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={isUploadingDoc}
                    onChange={(e) => handleUploadFile(e, 'DOC')}
                  />
                </label>
              </div>

              {/* CCCD Verification */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Ảnh Căn cước công dân / CMND (Dùng để xác thực danh tính khi đối soát doanh thu)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mặt trước */}
                  <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-600 block">Mặt trước CCCD</span>
                    {idCardFrontUrl ? (
                      <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 group">
                        <img
                          src={getFullFileUrl(idCardFrontUrl)}
                          alt="ID Front"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setPreviewImage(getFullFileUrl(idCardFrontUrl))}
                        />
                        <button
                          type="button"
                          onClick={() => setIdCardFrontUrl('')}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-500 text-white cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="h-28 border border-dashed border-slate-300 hover:border-[#83C75D] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-white">
                        {isUploadingIdFront ? (
                          <Loader2 className="w-5 h-5 text-[#83C75D] animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-[11px] font-bold text-slate-700">Tải mặt trước</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingIdFront}
                          onChange={(e) => handleUploadFile(e, 'ID_FRONT')}
                        />
                      </label>
                    )}
                  </div>

                  {/* Mặt sau */}
                  <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-600 block">Mặt sau CCCD</span>
                    {idCardBackUrl ? (
                      <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 group">
                        <img
                          src={getFullFileUrl(idCardBackUrl)}
                          alt="ID Back"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setPreviewImage(getFullFileUrl(idCardBackUrl))}
                        />
                        <button
                          type="button"
                          onClick={() => setIdCardBackUrl('')}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-500 text-white cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="h-28 border border-dashed border-slate-300 hover:border-[#83C75D] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-white">
                        {isUploadingIdBack ? (
                          <Loader2 className="w-5 h-5 text-[#83C75D] animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-slate-400 mb-1" />
                            <span className="text-[11px] font-bold text-slate-700">Tải mặt sau</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingIdBack}
                          onChange={(e) => handleUploadFile(e, 'ID_BACK')}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold shadow-md shadow-[#83C75D]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang nộp hồ sơ...</span>
                  </>
                ) : (
                  <>
                    <span>{isEditing ? 'Lưu & Nộp lại hồ sơ' : 'Gửi hồ sơ xét duyệt'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-black/60 text-white text-xs font-bold hover:bg-black cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
