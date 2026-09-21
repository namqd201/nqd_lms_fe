'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/RoleGuard';
import { examService } from '@/services/exam.service';
import { subjectService } from '@/services/subject.service';
import { TeacherExamResponse, ExamStatus, ExamVisibility } from '@/types/exam';
import { SubjectResponse } from '@/types/admin';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Archive,
  Eye,
  Sparkles,
  HelpCircle,
  GraduationCap,
  BookOpen,
  Clock,
  Award,
  Layers,
  RefreshCw,
  Sliders,
  ChevronRight,
  Globe,
  Users,
  Lock,
  Share2,
  ArrowRight,
  X,
  Check,
  Building2,
  User,
} from 'lucide-react';
import { GRADE_LEVEL_GROUPS } from '@/constants/gradeLevels';

const VISIBILITY_CONFIGS: {
  visibility: ExamVisibility;
  label: string;
  icon: any;
  color: string;
  badge: string;
  description: string;
}[] = [
  {
    visibility: 'PRIVATE',
    label: 'Riêng tư',
    icon: Lock,
    color: 'bg-slate-100 text-slate-700',
    badge: 'border-slate-300',
    description: 'Chỉ tác giả và admin xem được',
  },
  {
    visibility: 'SUBJECT_SHARED',
    label: 'Cùng tổ bộ môn',
    icon: Users,
    color: 'bg-blue-50 text-blue-700',
    badge: 'border-blue-300',
    description: 'Chia sẻ cho các giáo viên cùng môn sao chép & sử dụng',
  },
  {
    visibility: 'PUBLIC',
    label: 'Công khai toàn trường',
    icon: Globe,
    color: 'bg-emerald-50 text-emerald-700',
    badge: 'border-emerald-300',
    description: 'Mọi giáo viên và học sinh đều có thể xem và tham khảo',
  },
];

const STATUS_CONFIGS: { status: ExamStatus; label: string; color: string }[] = [
  { status: 'DRAFT', label: 'Bản nháp', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { status: 'PUBLISHED', label: 'Đang phát hành', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { status: 'ARCHIVED', label: 'Đã lưu trữ', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

export default function AdminExamsPage() {
  const [exams, setExams] = useState<TeacherExamResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('ALL');

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview Modal
  const [previewExam, setPreviewExam] = useState<TeacherExamResponse | null>(null);

  // Changing visibility state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [exs, subs] = await Promise.all([
        examService.getAdminExams(),
        subjectService.getActiveSubjects(),
      ]);
      setExams(exs);
      setSubjects(subs);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách đề thi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVisibility = async (examId: string, newVisibility: ExamVisibility) => {
    setUpdatingId(examId);
    try {
      const updated = await examService.updateAdminExamVisibility(examId, newVisibility);
      setSuccessMessage(`Đã cập nhật quyền hiển thị đề "${updated.title}" thành ${newVisibility === 'PUBLIC' ? 'Công khai' : newVisibility === 'SUBJECT_SHARED' ? 'Cùng tổ bộ môn' : 'Riêng tư'} thành công!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setExams((prev) => prev.map((e) => (e.id === examId ? { ...e, visibility: newVisibility } : e)));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Cập nhật quyền hiển thị thất bại');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTogglePublish = async (exam: TeacherExamResponse) => {
    try {
      if (exam.status === 'PUBLISHED') {
        await examService.archiveExam(exam.id);
        setSuccessMessage(`Đã chuyển đề "${exam.title}" sang trạng thái Lưu trữ.`);
      } else {
        await examService.publishExam(exam.id);
        setSuccessMessage(`Đã xuất bản đề "${exam.title}" thành công!`);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Thao tác trạng thái đề thi thất bại');
    }
  };

  const handleDeleteExam = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đề thi "${title}" không?`)) return;
    try {
      await examService.deleteExam(id);
      setSuccessMessage('Đã xóa đề thi thành công.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Xóa đề thi thất bại');
    }
  };

  const handleOpenPreview = async (exam: TeacherExamResponse) => {
    try {
      const detail = await examService.getExamById(exam.id);
      setPreviewExam(detail);
    } catch {
      setPreviewExam(exam);
    }
  };

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchSub = selectedSubject === 'ALL' || e.subjectId === selectedSubject;
      const matchGrade = selectedGrade === 'ALL' || e.gradeLevel === selectedGrade;
      const matchStatus = selectedStatus === 'ALL' || e.status === selectedStatus;
      const matchVisibility = selectedVisibility === 'ALL' || (e.visibility || 'PRIVATE') === selectedVisibility;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.code && e.code.toLowerCase().includes(q)) ||
        (e.creatorName && e.creatorName.toLowerCase().includes(q)) ||
        (e.subjectName && e.subjectName.toLowerCase().includes(q));

      return matchSub && matchGrade && matchStatus && matchVisibility && matchQuery;
    });
  }, [exams, selectedSubject, selectedGrade, selectedStatus, selectedVisibility, searchQuery]);

  const stats = useMemo(() => {
    const total = exams.length;
    const published = exams.filter((e) => e.status === 'PUBLISHED').length;
    const shared = exams.filter((e) => (e.visibility === 'SUBJECT_SHARED' || e.visibility === 'PUBLIC') && e.status === 'PUBLISHED').length;
    const drafts = exams.filter((e) => e.status === 'DRAFT').length;
    return { total, published, shared, drafts };
  }, [exams]);

  return (
    <RoleGuard allowedRoles={['ADMIN', 'ROLE_ADMIN']}>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                Admin Portal
              </span>
              <span className="text-xs text-slate-400 font-semibold">•</span>
              <span className="text-xs text-slate-500 font-medium">Khảo thí & Ngân hàng đề</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quản trị & Kiểm duyệt Đề thi Toàn hệ thống
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Xem toàn bộ đề thi của tất cả giảng viên, kiểm duyệt đưa vào Thư viện đề dùng chung và quản trị bản quyền.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/teacher/questions"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold shadow-xs transition-all"
            >
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <span>Ngân hàng Câu hỏi</span>
            </Link>
            <Link
              href="/teacher/exams"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold shadow-xs transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Giao diện Giảng viên</span>
            </Link>
            <button
              onClick={loadData}
              className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-xs cursor-pointer transition-all"
              title="Tải lại"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng đề thi</span>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-3xl shadow-xs space-y-1">
            <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Đang phát hành</span>
            <p className="text-2xl font-black text-emerald-800">{stats.published}</p>
          </div>
          <div className="bg-blue-50/80 border border-blue-200 p-5 rounded-3xl shadow-xs space-y-1">
            <span className="text-xs text-blue-700 font-bold uppercase tracking-wider">Thư viện dùng chung</span>
            <p className="text-2xl font-black text-blue-800">{stats.shared}</p>
          </div>
          <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-3xl shadow-xs space-y-1">
            <span className="text-xs text-amber-700 font-bold uppercase tracking-wider">Bản nháp</span>
            <p className="text-2xl font-black text-amber-800">{stats.drafts}</p>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-xs sm:text-sm shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-800 text-xs sm:text-sm shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
              ✕
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên đề, mã đề, giáo viên..."
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:border-purple-500 focus:bg-white rounded-2xl text-xs sm:text-sm outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none focus:border-purple-500 font-medium"
              >
                <option value="ALL">📚 Tất cả Môn học</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none focus:border-purple-500 font-medium"
              >
                <option value="ALL">🎓 Tất cả Khối lớp</option>
                {GRADE_LEVEL_GROUPS.map((group) => (
                  <optgroup key={group.level} label={group.label}>
                    {group.grades.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedVisibility}
                onChange={(e) => setSelectedVisibility(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 outline-none focus:border-purple-500 font-medium"
              >
                <option value="ALL">🌐 Tất cả Quyền chia sẻ</option>
                <option value="PRIVATE">🔒 Riêng tư</option>
                <option value="SUBJECT_SHARED">👥 Cùng tổ bộ môn</option>
                <option value="PUBLIC">🌍 Công khai toàn trường</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exam Moderation Table */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Đang tải danh sách đề thi hệ thống...</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Không tìm thấy đề thi nào phù hợp</p>
              <p className="text-xs text-slate-400">Hãy thử thay đổi từ khóa hoặc bộ lọc trên.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Thông tin Đề thi</th>
                    <th className="py-3.5 px-4">Tác giả / Giáo viên</th>
                    <th className="py-3.5 px-4">Cấu trúc</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Kiểm duyệt Chia sẻ (Visibility)</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredExams.map((exam) => {
                    const currentVis = exam.visibility || 'PRIVATE';
                    const visConfig = VISIBILITY_CONFIGS.find((v) => v.visibility === currentVis) || VISIBILITY_CONFIGS[0];
                    const VisIcon = visConfig.icon;
                    const statusConfig = STATUS_CONFIGS.find((s) => s.status === exam.status) || STATUS_CONFIGS[0];

                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                {exam.code || 'NO-CODE'}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">{exam.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                              <span>{exam.subjectName || 'Chưa gán môn'}</span>
                              <span>•</span>
                              <span>{exam.gradeLevel || 'Chung'}</span>
                              {exam.originExamTitle && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-600 font-semibold">
                                    Bản sao từ: {exam.originExamTitle}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {exam.creatorName ? exam.creatorName[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{exam.creatorName || 'Hệ thống'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-0.5 text-[11px] text-slate-500">
                            <p className="font-bold text-slate-700">{exam.questionCount} câu hỏi</p>
                            <p>{exam.durationMinutes} phút • {exam.totalMarks} điểm</p>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConfig.color}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {statusConfig.label}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={currentVis}
                              disabled={updatingId === exam.id}
                              onChange={(e) => handleUpdateVisibility(exam.id, e.target.value as ExamVisibility)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-all ${
                                currentVis === 'PUBLIC'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 focus:border-emerald-500'
                                  : currentVis === 'SUBJECT_SHARED'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300 focus:border-blue-500'
                                  : 'bg-slate-50 text-slate-700 border-slate-300 focus:border-slate-500'
                              }`}
                            >
                              <option value="PRIVATE">🔒 Riêng tư</option>
                              <option value="SUBJECT_SHARED">👥 Cùng bộ môn (Dùng chung)</option>
                              <option value="PUBLIC">🌍 Công khai toàn trường</option>
                            </select>
                            {updatingId === exam.id && (
                              <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenPreview(exam)}
                              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                              title="Xem chi tiết & làm thử"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleTogglePublish(exam)}
                              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                exam.status === 'PUBLISHED'
                                  ? 'text-purple-600 hover:bg-purple-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={exam.status === 'PUBLISHED' ? 'Chuyển sang Lưu trữ' : 'Xuất bản đề thi'}
                            >
                              {exam.status === 'PUBLISHED' ? (
                                <Archive className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteExam(exam.id, exam.title)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Xóa đề thi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {previewExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                      {previewExam.code || 'PREVIEW'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{previewExam.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    {previewExam.subjectName} • {previewExam.gradeLevel} • {previewExam.durationMinutes} phút • {previewExam.totalMarks} điểm • Tác giả: {previewExam.creatorName || 'Hệ thống'}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewExam(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {previewExam.description && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-800">
                    <p className="font-bold mb-1">Mô tả đề thi:</p>
                    <p>{previewExam.description}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    Danh sách câu hỏi ({previewExam.questions?.length || previewExam.questionCount || 0} câu)
                  </h4>

                  {previewExam.questions && previewExam.questions.length > 0 ? (
                    previewExam.questions.map((q, idx) => (
                      <div key={q.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-700">{q.difficulty || 'MEDIUM'}</span>
                          </div>
                          <span className="text-xs font-bold text-indigo-600">{q.defaultMarks || 1} điểm</span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-900 whitespace-pre-wrap">{q.content}</p>
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`p-2.5 rounded-xl text-xs border flex items-center gap-2 ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                                  {opt.optionKey}
                                </span>
                                <span>{opt.optionText}</span>
                                {opt.isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.explanation && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                            <span className="font-bold">Giải thích: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Đề thi chưa có câu hỏi nào.</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
                <button
                  onClick={() => setPreviewExam(null)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
