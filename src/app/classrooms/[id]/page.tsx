'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { classroomService } from '@/services/classroom.service';
import { ClassroomResponse, ClassroomStudentResponse, UserSuggestionResponse } from '@/types/classroom';
import {
  GraduationCap,
  Users,
  Copy,
  Check,
  Plus,
  ArrowLeft,
  Mail,
  UserCheck,
  UserX,
  Clock,
  Send,
  Trash2,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Loader2,
  MessageSquare,
  BookOpen,
  Calendar,
  X,
} from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';

export default function ClassroomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classroomId = params?.id as string;
  const initialTab = searchParams.get('tab');

  const { user, isAuthenticated, loginWithGoogle } = useAuth();

  const [classroom, setClassroom] = useState<ClassroomResponse | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<ClassroomStudentResponse[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ClassroomStudentResponse[]>([]);
  const [invitedStudents, setInvitedStudents] = useState<ClassroomStudentResponse[]>([]);

  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'REQUESTS' | 'INVITED'>('STUDENTS');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Search in student table
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  // Invite modal states & Autocomplete suggestion
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSuggestionResponse[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);

  // Actions
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isTeacher = Boolean(classroom && user && classroom.teacherId === user.id);

  useEffect(() => {
    if (initialTab === 'requests') {
      setActiveTab('REQUESTS');
    }
  }, [initialTab]);

  useEffect(() => {
    if (classroomId && isAuthenticated) {
      loadClassroomData();
    }
  }, [classroomId, isAuthenticated]);

  // Click outside to hide suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search users suggestion as teacher types email
  useEffect(() => {
    const q = inviteEmail.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const users = await classroomService.searchUsers(q);
        setSuggestions(users);
        setShowSuggestions(users.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [inviteEmail]);

  const loadClassroomData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const cls = await classroomService.getClassroomById(classroomId);
      setClassroom(cls);

      const enrolled = await classroomService.getClassroomStudents(classroomId, 'ENROLLED').catch(() => []);
      setEnrolledStudents(enrolled);

      // Only teacher can fetch pending requests and invited list
      if (user && cls.teacherId === user.id) {
        const [requests, invited] = await Promise.all([
          classroomService.getClassroomStudents(classroomId, 'PENDING_APPROVAL').catch(() => []),
          classroomService.getClassroomStudents(classroomId, 'INVITED').catch(() => []),
        ]);
        setPendingRequests(requests);
        setInvitedStudents(invited);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải thông tin lớp học';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!classroom) return;
    navigator.clipboard.writeText(classroom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleApprove = async (studentId: string) => {
    setActionLoadingId(studentId);
    try {
      await classroomService.approveStudent(classroomId, studentId);
      setSuccessMessage('Đã duyệt học sinh vào lớp thành công! Hệ thống đã gửi thông báo đến chuông của học sinh.');
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadClassroomData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
      setErrorMessage(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (studentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn từ chối yêu cầu vào lớp của học sinh này?')) return;
    setActionLoadingId(studentId);
    try {
      await classroomService.rejectStudent(classroomId, studentId);
      setSuccessMessage('Đã từ chối yêu cầu của học sinh.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadClassroomData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Từ chối thất bại';
      setErrorMessage(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa học sinh "${studentName}" khỏi lớp học này?`)) return;
    setActionLoadingId(studentId);
    try {
      await classroomService.removeStudent(classroomId, studentId);
      setSuccessMessage(`Đã xóa học sinh ${studentName} khỏi lớp.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadClassroomData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa học sinh thất bại';
      setErrorMessage(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLeaveClass = async () => {
    if (!confirm('Bạn có chắc chắn muốn rời khỏi lớp học này không?')) return;
    try {
      await classroomService.leaveClassroom(classroomId);
      router.push('/classrooms');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rời lớp thất bại';
      setErrorMessage(msg);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await classroomService.inviteStudent(classroomId, {
        email: inviteEmail.trim(),
        message: inviteMessage.trim() || undefined,
      });

      setSuccessMessage(`Đã gửi lời mời tới ${inviteEmail}! Hệ thống đã báo chuông thông báo đến tài khoản học sinh.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteMessage('');
      setShowSuggestions(false);
      await loadClassroomData();
      setActiveTab('INVITED');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi lời mời';
      setErrorMessage(msg);
    } finally {
      setIsInviting(false);
    }
  };

  const handleSelectSuggestion = (suggestedUser: UserSuggestionResponse) => {
    setInviteEmail(suggestedUser.email);
    setShowSuggestions(false);
  };

  const filteredEnrolledStudents = enrolledStudents.filter((st) => {
    if (!searchStudentQuery.trim()) return true;
    const q = searchStudentQuery.toLowerCase();
    return st.studentName.toLowerCase().includes(q) || st.studentEmail.toLowerCase().includes(q);
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-4">
          <GraduationCap className="w-12 h-12 text-[#4e8231] mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Yêu cầu đăng nhập</h2>
          <p className="text-xs text-slate-500">Vui lòng đăng nhập để xem thông tin lớp học</p>
          <button
            onClick={loginWithGoogle}
            className="w-full py-2.5 px-4 rounded-xl bg-[#83C75D] text-white font-bold text-xs"
          >
            Đăng nhập Google
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-20 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[#83C75D] mb-3" />
        <p className="text-xs font-semibold text-slate-500">Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex flex-col items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Không tìm thấy lớp học</h2>
          <p className="text-xs text-slate-500">Lớp học không tồn tại hoặc đã bị lưu trữ.</p>
          <Link
            href="/classrooms"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Quay về danh sách lớp học
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/classrooms"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Danh sách Lớp học</span>
          </Link>

          {!isTeacher && classroom.currentUserRole === 'STUDENT' && (
            <button
              onClick={handleLeaveClass}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Rời lớp học</span>
            </button>
          )}
        </div>

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

        {/* Classroom Header Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#83C75D]/15 text-[#4e8231] border border-[#83C75D]/30">
                  {classroom.gradeLevel || 'Khối lớp'}
                </span>
                {classroom.subjectName && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                    {classroom.subjectName}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                  {isTeacher ? 'Bạn là giáo viên phụ trách' : 'Lớp học chính khóa'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {classroom.name}
              </h1>

              {classroom.description && (
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  {classroom.description}
                </p>
              )}

              {/* Teacher info pill */}
              <div className="flex items-center gap-2.5 pt-1">
                <UserAvatar
                  src={classroom.teacherAvatarUrl}
                  name={classroom.teacherName}
                  size="sm"
                />
                <div className="text-xs">
                  <span className="text-slate-400">Giáo viên phụ trách: </span>
                  <strong className="text-slate-800 font-bold">{classroom.teacherName}</strong>
                  <span className="text-slate-400 ml-1.5 font-mono text-[11px]">({classroom.teacherEmail})</span>
                </div>
              </div>
            </div>

            {/* Right Card: Code & Stats */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between gap-4 shrink-0 min-w-[260px]">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Mã tham gia lớp học
                </p>
                <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200">
                  <span className="font-mono text-base font-black tracking-widest text-[#4e8231]">
                    {classroom.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 text-slate-400 hover:text-slate-700 transition"
                    title="Sao chép mã"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Gửi mã này cho học sinh để xin vào lớp</p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Sĩ số học sinh:</span>
                <strong className="text-slate-900 font-bold text-sm flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#4e8231]" />
                  <span>{enrolledStudents.length}</span>
                </strong>
              </div>

              {isTeacher && (
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Mời học sinh vào lớp</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs for Classroom Management */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('STUDENTS')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'STUDENTS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Danh sách học sinh</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'STUDENTS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {enrolledStudents.length}
              </span>
            </button>

            {isTeacher && (
              <>
                <button
                  onClick={() => setActiveTab('REQUESTS')}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'REQUESTS'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Yêu cầu chờ duyệt</span>
                  {pendingRequests.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('INVITED')}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'INVITED'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Lời mời đã gửi</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'INVITED' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {invitedStudents.length}
                  </span>
                </button>
              </>
            )}
          </div>

          {activeTab === 'STUDENTS' && (
            <div className="relative w-64 hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm học sinh trong lớp..."
                value={searchStudentQuery}
                onChange={(e) => setSearchStudentQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs outline-none focus:border-[#83C75D]"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Danh sách học sinh chính thức */}
        {activeTab === 'STUDENTS' && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            {filteredEnrolledStudents.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">Chưa có học sinh nào trong lớp</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {isTeacher
                    ? 'Bạn có thể chia sẻ mã lớp hoặc nhấn nút "Mời học sinh vào lớp" bên trên để thêm học sinh.'
                    : 'Lớp học hiện chưa có học sinh nào khác ngoài bạn.'}
                </p>
                {isTeacher && (
                  <button
                    onClick={() => setInviteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#83C75D] text-white text-xs font-bold hover:bg-[#72b44e] transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mời học sinh ngay</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Học sinh</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Ngày tham gia</th>
                      <th className="px-6 py-3.5 text-center">Trạng thái</th>
                      {isTeacher && <th className="px-6 py-3.5 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEnrolledStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <UserAvatar
                            src={st.studentAvatarUrl}
                            name={st.studentName}
                            size="md"
                          />
                          <div>
                            <p className="font-extrabold text-slate-900">{st.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {st.studentId.slice(0, 8)}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">
                          {st.studentEmail}
                        </td>

                        <td className="px-6 py-4 text-slate-500">
                          {st.joinedAt ? new Date(st.joinedAt).toLocaleDateString('vi-VN') : 'Mới vào'}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đang học
                          </span>
                        </td>

                        {isTeacher && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRemoveStudent(st.studentId, st.studentName)}
                              disabled={actionLoadingId === st.studentId}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Xóa học sinh khỏi lớp"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Yêu cầu xin vào lớp chờ duyệt (Chỉ giáo viên) */}
        {activeTab === 'REQUESTS' && isTeacher && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">Không có yêu cầu nào đang chờ</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Tất cả các yêu cầu xin vào lớp của học sinh đã được xử lý.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <UserAvatar
                        src={req.studentAvatarUrl}
                        name={req.studentName}
                        size="md"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-slate-900 text-sm">{req.studentName}</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Chờ bạn duyệt
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{req.studentEmail}</p>
                        {req.requestMessage && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-1 max-w-lg">
                            <span className="font-bold text-slate-400 mr-1">Lời nhắn:</span>
                            "{req.requestMessage}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleApprove(req.studentId)}
                        disabled={actionLoadingId === req.studentId}
                        className="px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{actionLoadingId === req.studentId ? 'Đang duyệt...' : 'Duyệt vào lớp'}</span>
                      </button>

                      <button
                        onClick={() => handleReject(req.studentId)}
                        disabled={actionLoadingId === req.studentId}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Lời mời đã gửi (Chỉ giáo viên) */}
        {activeTab === 'INVITED' && isTeacher && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            {invitedStudents.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Mail className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">Chưa có lời mời nào đang chờ</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Bạn có thể mời thêm học sinh bằng cách bấm nút "Mời học sinh vào lớp" bên dưới.
                </p>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#83C75D] text-white text-xs font-bold hover:bg-[#72b44e] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Mời học sinh</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invitedStudents.map((inv) => (
                  <div key={inv.id} className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={inv.studentAvatarUrl}
                        name={inv.studentName}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-slate-900 text-sm">{inv.studentName}</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Đã gửi lời mời
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{inv.studentEmail}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Đã gửi lúc: {new Date(inv.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveStudent(inv.studentId, inv.studentName)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold transition"
                      title="Thu hồi lời mời"
                    >
                      Hủy lời mời
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Mời học sinh vào lớp (Có Auto-complete gợi ý người dùng) */}
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Mời Học Sinh Vào Lớp</h3>
                  <p className="text-xs text-slate-500">Nhập email hoặc tên học sinh để hệ thống đề xuất</p>
                </div>
                <button
                  onClick={() => setInviteModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
                {/* Email input with Autocomplete Suggestions */}
                <div className="relative" ref={suggestionBoxRef}>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email học sinh <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="Gõ email hoặc tên học sinh..."
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                    />
                    {isSearchingUsers && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#83C75D] absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {/* Suggestion Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Gợi ý người dùng phù hợp
                      </div>
                      {suggestions.map((sug) => (
                        <div
                          key={sug.id}
                          onClick={() => handleSelectSuggestion(sug)}
                          className="p-2.5 hover:bg-[#83C75D]/10 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar src={sug.avatarUrl} name={sug.fullName} size="sm" />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate text-xs">{sug.fullName}</p>
                              <p className="text-[11px] text-slate-500 font-mono truncate">{sug.email}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                            Chọn
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 mt-1">
                    Gợi ý tự động hiển thị khi bạn gõ từ 2 ký tự trở lên.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lời nhắn gửi học sinh (tuỳ chọn)</label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Thầy mời em vào lớp 12A1 để chuẩn bị ôn tập..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting || !inviteEmail.trim()}
                    className="px-5 py-2.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold shadow-md shadow-[#83C75D]/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isInviting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi lời mời</span>
                      </>
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
