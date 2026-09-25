'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { classroomService } from '@/services/classroom.service';
import { subjectService } from '@/services/subject.service';
import { ClassroomResponse, ClassroomStudentResponse } from '@/types/classroom';
import { SubjectResponse } from '@/types/admin';
import { GRADE_LEVEL_GROUPS } from '@/constants/gradeLevels';
import {
  GraduationCap,
  Plus,
  KeyRound,
  Users,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  X,
  RotateCcw,
  Loader2,
  Copy,
  Check,
  Mail,
  ShieldAlert,
} from 'lucide-react';

export default function ClassroomsPage() {
  const { user, isAuthenticated, loginWithGoogle } = useAuth();
  const router = useRouter();

  const isTeacher = user?.roles.some((r) => r === 'TEACHER' || r === 'ROLE_TEACHER' || r === 'ADMIN' || r === 'ROLE_ADMIN');

  const [activeTab, setActiveTab] = useState<'TEACHING' | 'ENROLLED'>('ENROLLED');
  const [teachingClasses, setTeachingClasses] = useState<ClassroomResponse[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassroomResponse[]>([]);
  const [invitations, setInvitations] = useState<ClassroomStudentResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [joinModalOpen, setJoinModalOpen] = useState<boolean>(false);

  // Create class form
  const [createName, setCreateName] = useState('');
  const [createCode, setCreateCode] = useState('');
  const [createGrade, setCreateGrade] = useState('Lớp 10');
  const [createSubjectId, setCreateSubjectId] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Join class form
  const [joinCode, setJoinCode] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Action loaders
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);

  useEffect(() => {
    if (isTeacher) {
      setActiveTab('TEACHING');
    } else {
      setActiveTab('ENROLLED');
    }
  }, [isTeacher]);

  useEffect(() => {
    loadAllData();
  }, [isAuthenticated]);

  const loadAllData = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [teachRes, enrolRes, inviteRes, subs] = await Promise.all([
        classroomService.getTeachingClassrooms().catch(() => []),
        classroomService.getEnrolledClassrooms().catch(() => []),
        classroomService.getMyInvitations().catch(() => []),
        subjectService.getActiveSubjects().catch(() => []),
      ]);

      setTeachingClasses(teachRes);
      setEnrolledClasses(enrolRes);
      setInvitations(inviteRes);
      setSubjects(subs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu lớp học';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setIsCreating(true);
    try {
      const created = await classroomService.createClassroom({
        name: createName.trim(),
        code: createCode.trim() ? createCode.trim() : undefined,
        gradeLevel: createGrade,
        subjectId: createSubjectId || undefined,
        description: createDescription.trim() || undefined,
      });

      setSuccessMessage(`Đã tạo lớp "${created.name}" thành công với mã: ${created.code}`);
      setTimeout(() => setSuccessMessage(null), 5000);
      setCreateModalOpen(false);
      setCreateName('');
      setCreateCode('');
      setCreateDescription('');
      await loadAllData();
      router.push(`/classrooms/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo lớp học thất bại';
      setErrorMessage(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    try {
      await classroomService.requestToJoin({
        code: joinCode.trim().toUpperCase(),
        message: joinMessage.trim() || undefined,
      });

      setSuccessMessage('Đã gửi yêu cầu xin vào lớp học thành công! Giáo viên phụ trách sẽ duyệt yêu cầu của bạn.');
      setTimeout(() => setSuccessMessage(null), 5000);
      setJoinModalOpen(false);
      setJoinCode('');
      setJoinMessage('');
      await loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi yêu cầu vào lớp';
      setErrorMessage(msg);
    } finally {
      setIsJoining(false);
    }
  };

  const handleAcceptInvite = async (classroomId: string, inviteId: string) => {
    setRespondingInviteId(inviteId);
    try {
      await classroomService.acceptInvitation(classroomId);
      setSuccessMessage('Bạn đã tham gia lớp học thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể đồng ý lời mời';
      setErrorMessage(msg);
    } finally {
      setRespondingInviteId(null);
    }
  };

  const handleDeclineInvite = async (classroomId: string, inviteId: string) => {
    if (!confirm('Bạn có chắc chắn muốn từ chối lời mời này?')) return;
    setRespondingInviteId(inviteId);
    try {
      await classroomService.declineInvitation(classroomId);
      setSuccessMessage('Đã từ chối lời mời tham gia lớp học.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể từ chối lời mời';
      setErrorMessage(msg);
    } finally {
      setRespondingInviteId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#4e8231] mx-auto flex items-center justify-center">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Quản lý Lớp học NQD-LMS</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Học sinh có thể tham gia các lớp học của giáo viên bằng mã lớp, và giáo viên có thể quản lý sĩ số, bài giảng, đề thi một cách chuyên nghiệp.
          </p>
          <button
            onClick={loginWithGoogle}
            className="w-full py-3 px-4 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-sm shadow-md shadow-[#83C75D]/20 transition-all cursor-pointer"
          >
            Đăng nhập để vào Lớp học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Toast alerts */}
        {successMessage && (
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
              ✕
            </button>
          </div>
        )}

        {/* Top Header Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#83C75D]/15 text-[#4e8231] border border-[#83C75D]/30">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Không gian Học tập & Quản lý Lớp</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Lớp học của tôi
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Theo dõi danh sách các lớp bạn đang theo học hoặc đang giảng dạy. Dễ dàng xin vào lớp bằng mã tham gia hoặc quản lý sĩ số học sinh.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setJoinModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-[#83C75D] hover:bg-slate-50 text-slate-700 font-bold text-xs transition shadow-2xs cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-[#4e8231]" />
              <span>Xin vào lớp bằng mã</span>
            </button>

            {isTeacher && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-xs shadow-md shadow-[#83C75D]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo lớp học mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Pending Invitations Section (If any) */}
        {invitations.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Mail className="w-4 h-4 text-amber-600" />
              <span>Bạn có {invitations.length} lời mời tham gia lớp học đang chờ xác nhận:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 text-sm truncate">{inv.classroomName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Mã lớp: {inv.classroomCode}</p>
                    {inv.requestMessage && (
                      <p className="text-[11px] text-amber-800 italic mt-0.5 line-clamp-1">"{inv.requestMessage}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAcceptInvite(inv.classroomId, inv.id)}
                      disabled={respondingInviteId === inv.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {respondingInviteId === inv.id ? 'Đang lưu...' : 'Đồng ý'}
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(inv.classroomId, inv.id)}
                      disabled={respondingInviteId === inv.id}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab switch for Teachers */}
        {isTeacher && (
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('TEACHING')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'TEACHING'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Lớp tôi giảng dạy</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'TEACHING' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {teachingClasses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ENROLLED')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ENROLLED'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Lớp tôi tham gia</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'ENROLLED' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {enrolledClasses.length}
              </span>
            </button>
          </div>
        )}

        {/* Content list */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-[#83C75D]" />
            <p className="text-xs font-semibold text-slate-500">Đang tải danh sách lớp học...</p>
          </div>
        ) : (
          <div>
            {/* TEACHING TAB */}
            {activeTab === 'TEACHING' && (
              <div>
                {teachingClasses.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Bạn chưa tạo lớp học nào</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Hãy tạo lớp học đầu tiên để cung cấp mã tham gia cho học sinh, quản lý sĩ số và phân phối tài liệu, đề thi.
                    </p>
                    <button
                      onClick={() => setCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-xs shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tạo lớp học ngay</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {teachingClasses.map((cls) => (
                      <Link
                        key={cls.id}
                        href={`/classrooms/${cls.id}`}
                        className="group bg-white border border-slate-200 hover:border-[#83C75D] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between hover:-translate-y-1"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#83C75D]/15 text-[#4e8231] border border-[#83C75D]/30">
                              {cls.gradeLevel || 'Khối lớp'}
                            </span>
                            {cls.pendingRequestCount > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                                {cls.pendingRequestCount} chờ duyệt
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Đang hoạt động
                              </span>
                            )}
                          </div>

                          <div>
                            <h3 className="text-base font-black text-slate-900 group-hover:text-[#4e8231] transition-colors line-clamp-1">
                              {cls.name}
                            </h3>
                            {cls.subjectName && (
                              <p className="text-xs font-semibold text-slate-500 mt-0.5">{cls.subjectName}</p>
                            )}
                            {cls.description && (
                              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                {cls.description}
                              </p>
                            )}
                          </div>

                          {/* Code Pill with copy */}
                          <div className="pt-2 flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            <div>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">Mã lớp</p>
                              <p className="text-xs font-black text-slate-900 font-mono">{cls.code}</p>
                            </div>
                            <button
                              onClick={(e) => handleCopyCode(cls.code, e)}
                              className="p-1.5 rounded-xl hover:bg-white text-slate-400 hover:text-slate-700 transition"
                              title="Sao chép mã lớp"
                            >
                              {copiedCode === cls.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1.5 font-bold text-slate-700">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{cls.studentCount} học sinh</span>
                          </span>

                          <span className="inline-flex items-center gap-1 font-bold text-[#4e8231] group-hover:translate-x-1 transition-transform">
                            <span>Quản lý</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ENROLLED TAB */}
            {activeTab === 'ENROLLED' && (
              <div>
                {enrolledClasses.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Bạn chưa tham gia lớp học nào</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Hãy xin giáo viên mã lớp học và nhấn "Xin vào lớp bằng mã" để bắt đầu theo học cùng thầy cô và bạn bè.
                    </p>
                    <button
                      onClick={() => setJoinModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-xs shadow-sm transition"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Nhập mã vào lớp</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {enrolledClasses.map((cls) => (
                      <Link
                        key={cls.id}
                        href={`/classrooms/${cls.id}`}
                        className="group bg-white border border-slate-200 hover:border-[#83C75D] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between hover:-translate-y-1"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#83C75D]/15 text-[#4e8231] border border-[#83C75D]/30">
                              {cls.gradeLevel || 'Khối lớp'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Đã vào lớp
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-black text-slate-900 group-hover:text-[#4e8231] transition-colors line-clamp-1">
                              {cls.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Giáo viên: <strong className="text-slate-800">{cls.teacherName}</strong>
                            </p>
                            {cls.description && (
                              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                {cls.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1.5 font-bold text-slate-700">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{cls.studentCount} thành viên</span>
                          </span>

                          <span className="inline-flex items-center gap-1 font-bold text-[#4e8231] group-hover:translate-x-1 transition-transform">
                            <span>Vào lớp học</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal: Tạo lớp học mới (Giáo viên) */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Tạo Lớp Học Mới</h3>
                  <p className="text-xs text-slate-500">Bạn là giáo viên phụ trách duy nhất của lớp học này</p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên lớp học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Lớp 12A1 - Chuyên Toán"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Khối lớp</label>
                    <select
                      value={createGrade}
                      onChange={(e) => setCreateGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-700 font-medium"
                    >
                      {GRADE_LEVEL_GROUPS.map((g) => (
                        <optgroup key={g.level} label={g.label}>
                          {g.grades.map((gr) => (
                            <option key={gr} value={gr}>
                              {gr}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Môn học</label>
                    <select
                      value={createSubjectId}
                      onChange={(e) => setCreateSubjectId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-700 font-medium"
                    >
                      <option value="">Chọn môn học (tuỳ chọn)</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã tham gia lớp (Tự chọn hoặc để trống hệ thống tự sinh)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: TOAN12-A1 (hoặc để trống)"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs font-mono uppercase text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Học sinh sẽ dùng mã này để xin tham gia lớp học của bạn.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mô tả lớp học</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả mục tiêu, lịch học, lưu ý cho học sinh..."
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !createName.trim()}
                    className="px-5 py-2.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold shadow-md shadow-[#83C75D]/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tạo...</span>
                      </>
                    ) : (
                      <span>Tạo lớp học</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Xin vào lớp bằng mã (Học sinh & Người dùng) */}
        {joinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Xin Vào Lớp Học</h3>
                  <p className="text-xs text-slate-500">Nhập mã lớp do thầy cô cung cấp</p>
                </div>
                <button
                  onClick={() => setJoinModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleJoinClass} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã lớp học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: CL8492 hoặc TOAN12A"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-sm font-mono uppercase font-bold text-center tracking-wider text-slate-900"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 text-center">
                    Sau khi gửi yêu cầu, giáo viên tạo lớp sẽ xem xét và phê duyệt để bạn chính thức vào lớp.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lời nhắn gửi thầy cô (tuỳ chọn)</label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Em chào thầy/cô, em là Nam học sinh lớp 10A1 xin vào lớp ạ..."
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setJoinModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isJoining || !joinCode.trim()}
                    className="px-5 py-2.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold shadow-md shadow-[#83C75D]/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <span>Gửi yêu cầu vào lớp</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
