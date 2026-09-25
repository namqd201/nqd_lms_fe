'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { classroomService } from '@/services/classroom.service';
import {
  ClassroomResponse,
  ClassroomStudentResponse,
  UserSuggestionResponse,
  ClassroomMaterial,
  ClassroomAssignment,
  ClassroomMeeting,
  ClassroomRecordedVideo,
  ClassroomSchedule,
  ClassroomFile,
} from '@/types/classroom';
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
  Dumbbell,
  Video,
  Radio,
  Folder,
  FileText,
  File,
  ExternalLink,
  Download,
  Play,
  Settings,
  Sparkles,
  UploadCloud,
  Layers,
  AlertCircle,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';

const DAY_NAMES: Record<string, string> = {
  MONDAY: 'Thứ Hai',
  TUESDAY: 'Thứ Ba',
  WEDNESDAY: 'Thứ Tư',
  THURSDAY: 'Thứ Năm',
  FRIDAY: 'Thứ Sáu',
  SATURDAY: 'Thứ Bảy',
  SUNDAY: 'Chủ Nhật',
};

const MATERIAL_TYPES = [
  { value: 'PDF', label: 'Tài liệu PDF' },
  { value: 'SLIDE', label: 'Bài giảng Slide' },
  { value: 'TEXTBOOK', label: 'Sách giáo khoa / Chuyên đề' },
  { value: 'EXAM_PREP', label: 'Đề cương & Ôn tập' },
  { value: 'LINK', label: 'Liên kết tham khảo' },
  { value: 'OTHER', label: 'Khác' },
];

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

  // Active top-level feature view: MEMBERS | MATERIALS | ASSIGNMENTS | ONLINE_CLASS | SCHEDULE | FILES
  const [activeFeature, setActiveFeature] = useState<
    'MEMBERS' | 'MATERIALS' | 'ASSIGNMENTS' | 'ONLINE_CLASS' | 'SCHEDULE' | 'FILES'
  >('MEMBERS');

  // Active sub-tab inside MEMBERS view
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'REQUESTS' | 'INVITED'>('STUDENTS');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Feature datasets
  const [materials, setMaterials] = useState<ClassroomMaterial[]>([]);
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [meetingInfo, setMeetingInfo] = useState<ClassroomMeeting | null>(null);
  const [recordedVideos, setRecordedVideos] = useState<ClassroomRecordedVideo[]>([]);
  const [schedules, setSchedules] = useState<ClassroomSchedule[]>([]);
  const [classroomFiles, setClassroomFiles] = useState<ClassroomFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Search queries & filters
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [searchMaterialQuery, setSearchMaterialQuery] = useState('');
  const [filterMaterialType, setFilterMaterialType] = useState('ALL');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('ALL');

  // Modals for Teacher
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Lesson viewer & edit states
  const [viewingLesson, setViewingLesson] = useState<ClassroomMaterial | null>(null);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [isUploadingLessonFile, setIsUploadingLessonFile] = useState(false);
  const lessonFileInputRef = useRef<HTMLInputElement>(null);

  // Forms states
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    chapterTitle: 'Chủ đề chung',
    lessonOrder: 1,
    description: '',
    content: '',
    videoUrl: '',
    fileUrl: '',
    attachmentName: '',
    materialType: 'LESSON',
  });
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', deadline: '', maxScore: 10, attachmentUrl: '' });
  const [meetingForm, setMeetingForm] = useState({ larkMeetingUrl: '', meetingId: '', passcode: '', meetingNote: '', isLiveNow: false });
  const [newVideo, setNewVideo] = useState({ title: '', videoUrl: '', sessionDate: '', durationMinutes: 60, description: '' });
  const [newSchedule, setNewSchedule] = useState({ dayOfWeek: 'MONDAY', startTime: '19:30', endTime: '21:00', title: '', roomNote: 'Học online qua Lark' });

  // Autocomplete suggestions for inviting students
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [suggestions, setSuggestions] = useState<UserSuggestionResponse[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actions
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isTeacher = Boolean(classroom && user && classroom.teacherId === user.id);

  useEffect(() => {
    if (initialTab === 'requests') {
      setActiveFeature('MEMBERS');
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
      setMeetingForm({
        larkMeetingUrl: cls.larkMeetingUrl || '',
        meetingId: cls.meetingId || '',
        passcode: cls.passcode || '',
        meetingNote: cls.meetingNote || '',
        isLiveNow: Boolean(cls.isLiveNow),
      });

      const [enrolled, mats, assigns, mtg, vids, scheds, fls] = await Promise.all([
        classroomService.getClassroomStudents(classroomId, 'ENROLLED').catch(() => []),
        classroomService.getMaterials(classroomId).catch(() => []),
        classroomService.getAssignments(classroomId).catch(() => []),
        classroomService.getMeetingInfo(classroomId).catch(() => null),
        classroomService.getRecordedVideos(classroomId).catch(() => []),
        classroomService.getSchedules(classroomId).catch(() => []),
        classroomService.getFiles(classroomId).catch(() => []),
      ]);

      setEnrolledStudents(enrolled);
      setMaterials(mats);
      setAssignments(assigns);
      if (mtg) setMeetingInfo(mtg);
      setRecordedVideos(vids);
      setSchedules(scheds);
      setClassroomFiles(fls);

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
    if (!classroom?.code) return;
    navigator.clipboard.writeText(classroom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Student management handlers
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

  // Feature Handlers: Materials (Lessons)
  const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title.trim()) return;
    try {
      if (isEditingLesson && editingLessonId) {
        await classroomService.updateMaterial(classroomId, editingLessonId, {
          title: newMaterial.title.trim(),
          chapterTitle: newMaterial.chapterTitle.trim() || 'Chủ đề chung',
          lessonOrder: Number(newMaterial.lessonOrder) || 1,
          description: newMaterial.description.trim() || undefined,
          content: newMaterial.content.trim() || undefined,
          videoUrl: newMaterial.videoUrl.trim() || undefined,
          fileUrl: newMaterial.fileUrl.trim() || undefined,
          attachmentName: newMaterial.attachmentName.trim() || undefined,
          materialType: newMaterial.materialType || 'LESSON',
        });
        setSuccessMessage('Đã cập nhật bài học thành công!');
      } else {
        await classroomService.createMaterial(classroomId, {
          title: newMaterial.title.trim(),
          chapterTitle: newMaterial.chapterTitle.trim() || 'Chủ đề chung',
          lessonOrder: Number(newMaterial.lessonOrder) || (materials.length + 1),
          description: newMaterial.description.trim() || undefined,
          content: newMaterial.content.trim() || undefined,
          videoUrl: newMaterial.videoUrl.trim() || undefined,
          fileUrl: newMaterial.fileUrl.trim() || undefined,
          attachmentName: newMaterial.attachmentName.trim() || undefined,
          materialType: newMaterial.materialType || 'LESSON',
        });
        setSuccessMessage('Đã tạo bài học mới thành công!');
      }
      setTimeout(() => setSuccessMessage(null), 4000);
      setMaterialModalOpen(false);
      setIsEditingLesson(false);
      setEditingLessonId(null);
      const mats = await classroomService.getMaterials(classroomId);
      setMaterials(mats);
      if (viewingLesson && isEditingLesson && editingLessonId) {
        const updated = mats.find((m) => m.id === editingLessonId);
        if (updated) setViewingLesson(updated);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể lưu bài học');
    }
  };

  const handleOpenCreateLessonModal = () => {
    setIsEditingLesson(false);
    setEditingLessonId(null);
    setNewMaterial({
      title: '',
      chapterTitle: existingChapters[0] || 'Chủ đề chung',
      lessonOrder: materials.length + 1,
      description: '',
      content: '',
      videoUrl: '',
      fileUrl: '',
      attachmentName: '',
      materialType: 'LESSON',
    });
    setMaterialModalOpen(true);
  };

  const handleOpenEditLessonModal = (mat: ClassroomMaterial) => {
    setIsEditingLesson(true);
    setEditingLessonId(mat.id);
    setNewMaterial({
      title: mat.title,
      chapterTitle: mat.chapterTitle || 'Chủ đề chung',
      lessonOrder: mat.lessonOrder || 1,
      description: mat.description || '',
      content: mat.content || '',
      videoUrl: mat.videoUrl || '',
      fileUrl: mat.fileUrl || '',
      attachmentName: mat.attachmentName || '',
      materialType: mat.materialType || 'LESSON',
    });
    setMaterialModalOpen(true);
  };

  const handleDeleteMaterial = async (matId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài học này?')) return;
    try {
      await classroomService.deleteMaterial(classroomId, matId);
      setMaterials((prev) => prev.filter((m) => m.id !== matId));
      if (viewingLesson?.id === matId) {
        setViewingLesson(null);
      }
      setSuccessMessage('Đã xóa bài học.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa bài học');
    }
  };

  const handleUploadLessonAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLessonFile(true);
    try {
      const uploaded = await classroomService.uploadFile(classroomId, file);
      setNewMaterial((prev) => ({
        ...prev,
        fileUrl: uploaded.fileUrl,
        attachmentName: uploaded.fileName,
      }));
      setSuccessMessage(`Đã tải lên tệp đính kèm: ${uploaded.fileName}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể tải lên file đính kèm');
    } finally {
      setIsUploadingLessonFile(false);
      if (lessonFileInputRef.current) lessonFileInputRef.current.value = '';
    }
  };

  // Feature Handlers: Assignments
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title.trim()) return;
    try {
      await classroomService.createAssignment(classroomId, {
        ...newAssignment,
        deadline: newAssignment.deadline ? new Date(newAssignment.deadline).toISOString() : undefined,
      });
      setSuccessMessage('Đã giao bài tập mới cho lớp thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      setAssignmentModalOpen(false);
      setNewAssignment({ title: '', description: '', deadline: '', maxScore: 10, attachmentUrl: '' });
      const assigns = await classroomService.getAssignments(classroomId);
      setAssignments(assigns);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể giao bài tập');
    }
  };

  const handleDeleteAssignment = async (assignId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài tập này?')) return;
    try {
      await classroomService.deleteAssignment(classroomId, assignId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignId));
      setSuccessMessage('Đã xóa bài tập.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa bài tập');
    }
  };

  // Feature Handlers: Online Meeting (Lark)
  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await classroomService.updateMeetingInfo(classroomId, meetingForm);
      setMeetingInfo(updated);
      setSuccessMessage('Đã cập nhật thông tin phòng học online Lark thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      setMeetingModalOpen(false);
      if (classroom) {
        setClassroom({ ...classroom, ...updated });
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật phòng học');
    }
  };

  // Feature Handlers: Recorded Videos
  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideo.title.trim() || !newVideo.videoUrl.trim()) return;
    try {
      await classroomService.createRecordedVideo(classroomId, newVideo);
      setSuccessMessage('Đã đăng video bản ghi buổi học Lark mới!');
      setTimeout(() => setSuccessMessage(null), 4000);
      setVideoModalOpen(false);
      setNewVideo({ title: '', videoUrl: '', sessionDate: '', durationMinutes: 60, description: '' });
      const vids = await classroomService.getRecordedVideos(classroomId);
      setRecordedVideos(vids);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể đăng video');
    }
  };

  const handleDeleteVideo = async (vidId: string) => {
    if (!confirm('Bạn có chắc muốn xóa video này?')) return;
    try {
      await classroomService.deleteRecordedVideo(classroomId, vidId);
      setRecordedVideos((prev) => prev.filter((v) => v.id !== vidId));
      setSuccessMessage('Đã xóa video.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa video');
    }
  };

  // Feature Handlers: Schedule
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.title.trim() || !newSchedule.startTime || !newSchedule.endTime) return;
    try {
      await classroomService.createSchedule(classroomId, newSchedule);
      setSuccessMessage('Đã thêm lịch học mới vào thời khóa biểu!');
      setTimeout(() => setSuccessMessage(null), 4000);
      setScheduleModalOpen(false);
      setNewSchedule({ dayOfWeek: 'MONDAY', startTime: '19:30', endTime: '21:00', title: '', roomNote: 'Học online qua Lark' });
      const scheds = await classroomService.getSchedules(classroomId);
      setSchedules(scheds);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể thêm lịch học');
    }
  };

  const handleDeleteSchedule = async (schedId: string) => {
    if (!confirm('Bạn có chắc muốn xóa buổi học này khỏi thời khóa biểu?')) return;
    try {
      await classroomService.deleteSchedule(classroomId, schedId);
      setSchedules((prev) => prev.filter((s) => s.id !== schedId));
      setSuccessMessage('Đã xóa lịch học.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa lịch học');
    }
  };

  // Feature Handlers: Files Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert('Dung lượng tệp không được vượt quá 50MB!');
      return;
    }

    setIsUploadingFile(true);
    try {
      const uploaded = await classroomService.uploadFile(classroomId, file);
      setClassroomFiles((prev) => [uploaded, ...prev]);
      setSuccessMessage(`Đã tải lên tệp "${file.name}" vào kho lưu trữ của lớp!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể tải lên tệp tin');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Bạn có chắc muốn xóa tệp tin này?')) return;
    try {
      await classroomService.deleteFile(classroomId, fileId);
      setClassroomFiles((prev) => prev.filter((f) => f.id !== fileId));
      setSuccessMessage('Đã xóa tệp tin.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể xóa tệp tin');
    }
  };

  const filteredEnrolledStudents = enrolledStudents.filter((st) => {
    if (!searchStudentQuery.trim()) return true;
    const q = searchStudentQuery.toLowerCase();
    return st.studentName.toLowerCase().includes(q) || st.studentEmail.toLowerCase().includes(q);
  });

  const chaptersMap = React.useMemo(() => {
    const map: Record<string, ClassroomMaterial[]> = {};
    materials.forEach((m) => {
      const chap = m.chapterTitle?.trim() || 'Chủ đề chung';
      if (!map[chap]) map[chap] = [];
      map[chap].push(m);
    });
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => (a.lessonOrder || 1) - (b.lessonOrder || 1));
    });
    return map;
  }, [materials]);

  const existingChapters = React.useMemo(() => Object.keys(chaptersMap), [chaptersMap]);

  const filteredMaterials = React.useMemo(() => {
    return materials.filter((m) => {
      const q = searchMaterialQuery.toLowerCase().trim();
      const matchQ = !q || m.title.toLowerCase().includes(q) || (m.content && m.content.toLowerCase().includes(q));
      const chap = m.chapterTitle?.trim() || 'Chủ đề chung';
      const matchChap = selectedChapterFilter === 'ALL' || chap === selectedChapterFilter;
      return matchQ && matchChap;
    });
  }, [materials, searchMaterialQuery, selectedChapterFilter]);

  const filteredChaptersMap = React.useMemo(() => {
    const map: Record<string, ClassroomMaterial[]> = {};
    filteredMaterials.forEach((m) => {
      const chap = m.chapterTitle?.trim() || 'Chủ đề chung';
      if (!map[chap]) map[chap] = [];
      map[chap].push(m);
    });
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => (a.lessonOrder || 1) - (b.lessonOrder || 1));
    });
    return map;
  }, [filteredMaterials]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-4">
          <GraduationCap className="w-12 h-12 text-[#4e8231] mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Yêu cầu đăng nhập</h2>
          <p className="text-xs text-slate-500">Vui lòng đăng nhập để xem thông tin lớp học</p>
          <button
            onClick={loginWithGoogle}
            className="w-full py-2.5 px-4 rounded-xl bg-[#83C75D] text-white font-bold text-xs cursor-pointer"
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
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
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
            <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Classroom Header Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-4 flex-1">
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
                {classroom.isLiveNow && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                    <span>ĐANG HỌC TRỰC TUYẾN</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {classroom.name}
              </h1>

              {classroom.description && (
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                  {classroom.description}
                </p>
              )}

              {/* Teacher info */}
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

              {/* ========================================================================= */}
              {/* THE 5 FEATURE ACTION BUTTONS (KHU VỰC KHOANH ĐỎ TRONG LỚP HỌC)            */}
              {/* ========================================================================= */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveFeature('MATERIALS')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    activeFeature === 'MATERIALS'
                      ? 'bg-[#83C75D] text-white shadow-md shadow-[#83C75D]/25'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-[#83C75D] hover:text-[#4e8231] hover:bg-[#83C75D]/10'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Bài học</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeFeature === 'MATERIALS' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {materials.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFeature('ASSIGNMENTS')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    activeFeature === 'ASSIGNMENTS'
                      ? 'bg-[#83C75D] text-white shadow-md shadow-[#83C75D]/25'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-[#83C75D] hover:text-[#4e8231] hover:bg-[#83C75D]/10'
                  }`}
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>Bài tập</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeFeature === 'ASSIGNMENTS' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {assignments.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFeature('ONLINE_CLASS')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    activeFeature === 'ONLINE_CLASS'
                      ? 'bg-[#83C75D] text-white shadow-md shadow-[#83C75D]/25'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-[#83C75D] hover:text-[#4e8231] hover:bg-[#83C75D]/10'
                  }`}
                >
                  <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>Link học online</span>
                  {classroom.isLiveNow && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFeature('SCHEDULE')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    activeFeature === 'SCHEDULE'
                      ? 'bg-[#83C75D] text-white shadow-md shadow-[#83C75D]/25'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-[#83C75D] hover:text-[#4e8231] hover:bg-[#83C75D]/10'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Lịch học</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeFeature === 'SCHEDULE' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {schedules.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFeature('FILES')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    activeFeature === 'FILES'
                      ? 'bg-[#83C75D] text-white shadow-md shadow-[#83C75D]/25'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-[#83C75D] hover:text-[#4e8231] hover:bg-[#83C75D]/10'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  <span>File</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeFeature === 'FILES' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {classroomFiles.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFeature('MEMBERS')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    activeFeature === 'MEMBERS'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Học sinh & Thành viên</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      activeFeature === 'MEMBERS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {enrolledStudents.length}
                  </span>
                </button>
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
                    className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
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

        {/* ========================================================================= */}
        {/* VIEW 1: BÀI HỌC & GIÁO TRÌNH (LESSONS & SYLLABUS)                         */}
        {/* ========================================================================= */}
        {activeFeature === 'MATERIALS' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#83C75D]" />
                  <span>Chương trình & Danh sách Bài học</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Giáo trình lý thuyết, video bài giảng và tài liệu học tập theo từng chương
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isTeacher && (
                  <button
                    onClick={handleOpenCreateLessonModal}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo bài học mới</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài học theo tiêu đề hoặc nội dung..."
                  value={searchMaterialQuery}
                  onChange={(e) => setSearchMaterialQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#83C75D]"
                />
              </div>

              <select
                value={selectedChapterFilter}
                onChange={(e) => setSelectedChapterFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-[#83C75D]"
              >
                <option value="ALL">Tất cả chương / chủ đề ({materials.length} bài)</option>
                {existingChapters.map((chap) => (
                  <option key={chap} value={chap}>
                    {chap} ({chaptersMap[chap]?.length || 0} bài)
                  </option>
                ))}
              </select>
            </div>

            {/* Empty State */}
            {filteredMaterials.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[#83C75D]/10 text-[#4e8231] flex items-center justify-center mx-auto">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Chưa có bài học nào</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isTeacher
                    ? 'Hãy bấm nút "Tạo bài học mới" ở góc trên để bắt đầu xây dựng giáo trình bài giảng cho học sinh của lớp.'
                    : 'Giáo viên phụ trách chưa đăng bài học nào cho lớp học này.'}
                </p>
                {isTeacher && (
                  <button
                    onClick={handleOpenCreateLessonModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo bài học đầu tiên</span>
                  </button>
                )}
              </div>
            ) : (
              /* Grouped by Chapters */
              <div className="space-y-6">
                {Object.entries(filteredChaptersMap).map(([chapterName, chapterLessons]) => (
                  <div key={chapterName} className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    {/* Chapter Header */}
                    <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[#83C75D]/15 text-[#4e8231] flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-slate-900 truncate">{chapterName}</h3>
                          <p className="text-[11px] text-slate-400 font-medium">{chapterLessons.length} bài học</p>
                        </div>
                      </div>

                      {isTeacher && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewMaterial({
                              title: '',
                              chapterTitle: chapterName,
                              lessonOrder: (chaptersMap[chapterName]?.length || 0) + 1,
                              description: '',
                              content: '',
                              videoUrl: '',
                              fileUrl: '',
                              attachmentName: '',
                              materialType: 'LESSON',
                            });
                            setIsEditingLesson(false);
                            setEditingLessonId(null);
                            setMaterialModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#83C75D] hover:text-[#4e8231] text-[11px] font-bold text-slate-600 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm bài vào chương này</span>
                        </button>
                      )}
                    </div>

                    {/* Lessons list in chapter */}
                    <div className="divide-y divide-slate-100">
                      {chapterLessons.map((lesson, idx) => (
                        <div
                          key={lesson.id}
                          className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          {/* Left: Lesson Info */}
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 font-mono">
                              {String(lesson.lessonOrder || idx + 1).padStart(2, '0')}
                            </div>

                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4
                                  onClick={() => setViewingLesson(lesson)}
                                  className="text-sm sm:text-base font-extrabold text-slate-900 hover:text-[#4e8231] transition-colors cursor-pointer"
                                >
                                  {lesson.title}
                                </h4>

                                <div className="flex items-center gap-1.5">
                                  {lesson.videoUrl && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                      <Video className="w-3 h-3" />
                                      <span>Video</span>
                                    </span>
                                  )}
                                  {lesson.content && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <FileText className="w-3 h-3" />
                                      <span>Lý thuyết</span>
                                    </span>
                                  )}
                                  {lesson.fileUrl && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      <Folder className="w-3 h-3" />
                                      <span>Tài liệu</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {lesson.description ? (
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                  {lesson.description}
                                </p>
                              ) : lesson.content ? (
                                <p className="text-xs text-slate-400 line-clamp-1 italic leading-relaxed">
                                  {lesson.content.slice(0, 140)}...
                                </p>
                              ) : null}

                              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                                <span>Giáo viên: <strong className="text-slate-600">{lesson.uploadedByName}</strong></span>
                                <span>•</span>
                                <span>Cập nhật: {new Date(lesson.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                            <button
                              type="button"
                              onClick={() => setViewingLesson(lesson)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>Vào học</span>
                            </button>

                            {isTeacher && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditLessonModal(lesson)}
                                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                                  title="Chỉnh sửa bài học"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMaterial(lesson.id)}
                                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                  title="Xóa bài học"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: BÀI TẬP LỚP HỌC (ASSIGNMENTS)                                     */}
        {/* ========================================================================= */}
        {activeFeature === 'ASSIGNMENTS' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-indigo-600" />
                  <span>Bài tập & Luyện tập của lớp</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Danh sách bài tập và bài kiểm tra do giáo viên giao cho cả lớp
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isTeacher && (
                  <button
                    onClick={() => setAssignmentModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Giao bài tập mới</span>
                  </button>
                )}
              </div>
            </div>

            {assignments.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Dumbbell className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Chưa có bài tập nào được giao</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isTeacher
                    ? 'Bấm nút "Giao bài tập mới" để đặt câu hỏi, thời hạn nộp bài và chỉ định thang điểm cho học sinh.'
                    : 'Lớp học hiện tại chưa có bài tập nào đang mở.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assign) => (
                  <div
                    key={assign.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 uppercase">
                          Thang {assign.maxScore || 10} điểm
                        </span>
                        {assign.deadline && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Hạn nộp: {new Date(assign.deadline).toLocaleString('vi-VN')}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {assign.title}
                      </h3>

                      {assign.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {assign.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {assign.attachmentUrl && (
                        <a
                          href={assign.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
                        >
                          Tệp đính kèm
                        </a>
                      )}

                      {isTeacher && (
                        <button
                          onClick={() => handleDeleteAssignment(assign.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                          title="Xóa bài tập"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: LINK HỌC ONLINE & VIDEO BẢN GHI LARK                             */}
        {/* ========================================================================= */}
        {activeFeature === 'ONLINE_CLASS' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Live Lark Room Banner Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative overflow-hidden shadow-xl border border-slate-700 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-2xl shadow-inner">
                    <Radio className="w-6 h-6 animate-pulse text-rose-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                        LARK LIVE MEETING
                      </span>
                      {classroom.isLiveNow ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Đang trong giờ học</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">
                          Chưa mở lớp trực tiếp
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Phòng Học Trực Tuyến Qua Lark
                    </h3>
                  </div>
                </div>

                {isTeacher && (
                  <button
                    onClick={() => setMeetingModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition border border-white/10 cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Cài đặt phòng học</span>
                  </button>
                )}
              </div>

              {/* Lark Room Access Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Meeting ID</span>
                  <strong className="text-base font-mono font-bold text-white">
                    {classroom.meetingId || 'Chưa cập nhật'}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Mật khẩu phòng (Passcode)</span>
                  <strong className="text-base font-mono font-bold text-white">
                    {classroom.passcode || 'Không có mật khẩu'}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Ghi chú phòng học</span>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {classroom.meetingNote || 'Vui lòng vào phòng trước 5 phút để điểm danh.'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {classroom.larkMeetingUrl ? (
                  <a
                    href={classroom.larkMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#83C75D] hover:bg-[#72b44e] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#83C75D]/30 transition hover:scale-102"
                  >
                    <span>🚀 Vào phòng học trực tuyến ngay</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                    Giáo viên chưa cập nhật đường dẫn phòng học Lark cho lớp này. Vui lòng liên hệ giáo viên để nhận link học.
                  </div>
                )}
              </div>
            </div>

            {/* Recorded Videos Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-600" />
                    <span>Video bản ghi các buổi học online qua Lark</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Học sinh có thể xem lại bài giảng trực tuyến bất cứ lúc nào
                  </p>
                </div>

                {isTeacher && (
                  <button
                    onClick={() => setVideoModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm video bản ghi</span>
                  </button>
                )}
              </div>

              {/* Notice note for Lark automatic integration */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Tính năng lưu trữ video Lark:</p>
                  <p className="text-slate-600 leading-relaxed">
                    Sau khi học online qua Lark, các video bản ghi sẽ hiển thị tại đây để học sinh ôn tập.
                    Hệ thống sẽ hướng dẫn cấu hình kết nối tự động với Lark API theo yêu cầu tiếp theo của bạn!
                  </p>
                </div>
              </div>

              {recordedVideos.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Video className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Chưa có video bản ghi buổi học nào</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Các buổi học trực tuyến qua Lark sau khi kết thúc sẽ được lưu trữ video tại đây.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recordedVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          {vid.sessionDate && <span>Buổi ngày: {vid.sessionDate}</span>}
                          {vid.durationMinutes && (
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {vid.durationMinutes} phút
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm line-clamp-2">
                          {vid.title}
                        </h4>

                        {vid.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {vid.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <a
                          href={vid.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white text-xs font-bold transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Xem lại bài giảng</span>
                        </a>

                        {isTeacher && (
                          <button
                            onClick={() => handleDeleteVideo(vid.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Xóa video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: LỊCH HỌC & THỜI KHÓA BIỂU (SCHEDULE)                              */}
        {/* ========================================================================= */}
        {activeFeature === 'SCHEDULE' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <span>Thời khóa biểu & Lịch học của lớp</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lịch học các buổi trong tuần và khung thời gian chi tiết
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isTeacher && (
                  <button
                    onClick={() => setScheduleModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm lịch học</span>
                  </button>
                )}
              </div>
            </div>

            {schedules.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Chưa có lịch học nào được thiết lập</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isTeacher
                    ? 'Bấm nút "Thêm lịch học" để tạo thời khóa biểu các buổi học hàng tuần cho học sinh.'
                    : 'Giáo viên chưa cập nhật thời khóa biểu cho lớp học này.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-all flex flex-col justify-between space-y-4 shadow-2xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 uppercase">
                          {DAY_NAMES[sc.dayOfWeek] || sc.dayOfWeek}
                        </span>
                        {isTeacher && (
                          <button
                            onClick={() => handleDeleteSchedule(sc.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Xóa lịch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-base mt-2">
                        {sc.title}
                      </h4>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{sc.startTime} - {sc.endTime}</span>
                      </div>

                      {sc.roomNote && (
                        <p className="text-xs text-slate-500 pt-1">
                          📍 {sc.roomNote}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: FILE LƯU TRỮ (CLASSROOM FILES)                                    */}
        {/* ========================================================================= */}
        {activeFeature === 'FILES' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-emerald-600" />
                  <span>Kho lưu trữ tệp tin của lớp</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tải lên và tải xuống các tệp tài liệu, đề thi, file nén (.zip, .pdf, .docx...)
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Hidden input for direct file uploading */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {isTeacher && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFile}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingFile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tải tệp lên...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Tải lên tệp mới</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {classroomFiles.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Folder className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Kho tệp tin đang trống</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isTeacher
                    ? 'Bấm nút "Tải lên tệp mới" để tải tài liệu bài giảng, đề thi hoặc các file nén vào lớp học.'
                    : 'Giáo viên chưa tải lên tệp tin nào cho lớp học này.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
                {classroomFiles.map((fl) => (
                  <div
                    key={fl.id}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                        <File className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 truncate">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {fl.fileName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          {fl.fileSize && (
                            <span>{(fl.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                          )}
                          <span>•</span>
                          <span>Đăng bởi: {fl.uploadedByName}</span>
                          <span>•</span>
                          <span>{new Date(fl.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={fl.fileUrl}
                        download={fl.fileName}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Tải về</span>
                      </a>

                      {isTeacher && (
                        <button
                          onClick={() => handleDeleteFile(fl.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                          title="Xóa tệp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: THÀNH VIÊN & HỌC SINH (EXISTING MEMBERS & REQUESTS)               */}
        {/* ========================================================================= */}
        {activeFeature === 'MEMBERS' && (
          <div className="space-y-6 animate-in fade-in">
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
                      className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 relative ${
                        activeTab === 'REQUESTS'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Yêu cầu chờ duyệt</span>
                      {pendingRequests.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
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
                <div className="relative hidden sm:block w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm học sinh trong lớp..."
                    value={searchStudentQuery}
                    onChange={(e) => setSearchStudentQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#83C75D]"
                  />
                </div>
              )}
            </div>

            {/* TAB 1: Danh sách học sinh đang học */}
            {activeTab === 'STUDENTS' && (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
                {filteredEnrolledStudents.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Users className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs font-medium">Chưa có học sinh nào trong lớp học này.</p>
                    {isTeacher && (
                      <p className="text-[11px] text-slate-400">
                        Chia sẻ mã <strong>{classroom.code}</strong> hoặc bấm nút &quot;Mời học sinh vào lớp&quot; để mời các em tham gia.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                        <tr>
                          <th className="py-3.5 px-6">Học sinh</th>
                          <th className="py-3.5 px-6">Email</th>
                          <th className="py-3.5 px-6">Ngày tham gia</th>
                          <th className="py-3.5 px-6">Trạng thái</th>
                          {isTeacher && <th className="py-3.5 px-6 text-right">Thao tác</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredEnrolledStudents.map((st) => (
                          <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <UserAvatar src={st.studentAvatarUrl} name={st.studentName} size="md" />
                                <div>
                                  <p className="font-bold text-slate-900 text-xs sm:text-sm">{st.studentName}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">ID: {st.studentId.substring(0, 8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-mono text-slate-600 text-xs">
                              {st.studentEmail}
                            </td>
                            <td className="py-4 px-6 text-slate-500 text-xs">
                              {st.joinedAt ? new Date(st.joinedAt).toLocaleDateString('vi-VN') : '—'}
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Đang học
                              </span>
                            </td>
                            {isTeacher && (
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => handleRemoveStudent(st.studentId, st.studentName)}
                                  disabled={actionLoadingId === st.studentId}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                  title="Xóa học sinh khỏi lớp"
                                >
                                  {actionLoadingId === st.studentId ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
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

            {/* TAB 2: Yêu cầu chờ duyệt */}
            {activeTab === 'REQUESTS' && isTeacher && (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
                {pendingRequests.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                    <p className="text-xs font-medium">Không có yêu cầu xin vào lớp nào đang chờ duyệt.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <UserAvatar src={req.studentAvatarUrl} name={req.studentName} size="md" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">{req.studentName}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                Chờ duyệt
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{req.studentEmail}</p>
                            {req.requestMessage && (
                              <p className="text-xs text-slate-700 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                &quot;{req.requestMessage}&quot;
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1">
                              Gửi yêu cầu lúc: {new Date(req.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handleReject(req.studentId)}
                            disabled={actionLoadingId === req.studentId}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>

                          <button
                            onClick={() => handleApprove(req.studentId)}
                            disabled={actionLoadingId === req.studentId}
                            className="px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-[#83C75D]/20 cursor-pointer"
                          >
                            {actionLoadingId === req.studentId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                            <span>Đồng ý duyệt</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Lời mời đã gửi */}
            {activeTab === 'INVITED' && isTeacher && (
              <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
                {invitedStudents.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Mail className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs font-medium">Chưa có lời mời nào đang chờ học sinh xác nhận.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {invitedStudents.map((inv) => (
                      <div key={inv.id} className="p-4 sm:p-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{inv.studentName || inv.studentEmail}</p>
                            <p className="text-xs text-slate-500 font-mono">{inv.studentEmail}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Đã gửi lúc: {new Date(inv.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          Đã gửi lời mời (Chờ xác nhận)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: MỜI HỌC SINH VÀO LỚP                                            */}
        {/* ========================================================================= */}
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
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
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
                    placeholder="Ví dụ: Thầy mời em vào lớp để chuẩn bị ôn tập..."
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

        {/* ========================================================================= */}
        {/* MODAL 2: TẠO / SỬA BÀI HỌC (LESSON MODAL)                                */}
        {/* ========================================================================= */}
        {materialModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#83C75D]/15 text-[#4e8231] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {isEditingLesson ? 'Chỉnh Sửa Bài Học' : 'Tạo Bài Học Mới'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Thiết lập chương trình, video giảng dạy, lý thuyết và tài liệu
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMaterialModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveLesson} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                {/* Lesson Title */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên bài học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Bài 1: Khái niệm về hàm số và sự đồng biến, nghịch biến"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900 font-semibold"
                  />
                </div>

                {/* Chapter & Order */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Chương / Chủ đề <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="classroom-chapters-list"
                      required
                      placeholder="Ví dụ: Chương 1: Ứng dụng đạo hàm"
                      value={newMaterial.chapterTitle}
                      onChange={(e) => setNewMaterial({ ...newMaterial, chapterTitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                    />
                    <datalist id="classroom-chapters-list">
                      {existingChapters.map((ch) => (
                        <option key={ch} value={ch} />
                      ))}
                    </datalist>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Có thể chọn chương có sẵn hoặc nhập tên chương mới để tự động nhóm.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Số thứ tự bài
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newMaterial.lessonOrder}
                      onChange={(e) => setNewMaterial({ ...newMaterial, lessonOrder: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-rose-500" />
                    <span>Link Video bài giảng (YouTube hoặc link video trực tiếp)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... hoặc https://..."
                    value={newMaterial.videoUrl}
                    onChange={(e) => setNewMaterial({ ...newMaterial, videoUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Nếu là link YouTube, hệ thống sẽ tự động hiển thị trình phát video ngay trong bài học.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tóm tắt bài học / Mục tiêu cần đạt
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nắm vững điều kiện cần và đủ để hàm số đơn điệu trên khoảng..."
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                  />
                </div>

                {/* Content / Theory */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nội dung bài giảng / Lý thuyết chi tiết</span>
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">
                      Hỗ trợ soạn giáo án, công thức, ghi chú
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Soạn nội dung lý thuyết chi tiết cho bài học ở đây... Học sinh sẽ đọc và nghiên cứu phần này khi vào học."
                    value={newMaterial.content}
                    onChange={(e) => setNewMaterial({ ...newMaterial, content: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900 font-sans leading-relaxed"
                  />
                </div>

                {/* Attachment File Section */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tài liệu đính kèm (Slide / PDF / Bài tập mẫu)</span>
                    </label>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={lessonFileInputRef}
                      onChange={handleUploadLessonAttachment}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={isUploadingLessonFile}
                      onClick={() => lessonFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#83C75D] hover:text-[#4e8231] text-[11px] font-bold text-slate-700 transition cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingLessonFile ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#83C75D]" />
                          <span>Đang tải tệp...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                          <span>Tải tệp từ máy tính</span>
                        </>
                      )}
                    </button>
                  </div>

                  {newMaterial.fileUrl ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-blue-100 text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <File className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-800 truncate">
                          {newMaterial.attachmentName || newMaterial.fileUrl}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewMaterial({ ...newMaterial, fileUrl: '', attachmentName: '' })}
                        className="text-rose-500 hover:text-rose-700 p-1 text-[11px] font-bold cursor-pointer shrink-0"
                      >
                        Gỡ tệp
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        placeholder="Hoặc dán URL tài liệu ngoài (Google Drive, Dropbox, PDF...)"
                        value={newMaterial.fileUrl}
                        onChange={(e) => setNewMaterial({ ...newMaterial, fileUrl: e.target.value, attachmentName: 'Liên kết tài liệu' })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                      />
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setMaterialModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold shadow-md shadow-[#83C75D]/20 transition cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isEditingLesson ? 'Lưu thay đổi' : 'Tạo bài học'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: GIAO BÀI TẬP MỚI (ASSIGNMENT MODAL)                             */}
        {/* ========================================================================= */}
        {assignmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Giao Bài Tập Mới</h3>
                  <p className="text-xs text-slate-500">Tạo nhiệm vụ học tập, thời hạn và điểm số cho lớp</p>
                </div>
                <button
                  onClick={() => setAssignmentModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tiêu đề bài tập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Bài tập về nhà tuần 3 - Hàm số bậc hai..."
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-600 outline-none text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hạn nộp bài</label>
                    <input
                      type="datetime-local"
                      value={newAssignment.deadline}
                      onChange={(e) => setNewAssignment({ ...newAssignment, deadline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-600 outline-none text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Thang điểm tối đa</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={newAssignment.maxScore}
                      onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-600 outline-none text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đường dẫn tệp đính kèm / Đề thi (tuỳ chọn)</label>
                  <input
                    type="url"
                    placeholder="https://... liên kết đề bài hoặc file bài tập"
                    value={newAssignment.attachmentUrl}
                    onChange={(e) => setNewAssignment({ ...newAssignment, attachmentUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-600 outline-none text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hướng dẫn làm bài</label>
                  <textarea
                    rows={3}
                    placeholder="Yêu cầu học sinh làm bài tập ra vở hoặc nộp file..."
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-600 outline-none text-xs text-slate-900"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAssignmentModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                  >
                    Giao bài tập
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: CÀI ĐẶT PHÒNG HỌC LARK (MEETING MODAL)                           */}
        {/* ========================================================================= */}
        {meetingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Cài Đặt Phòng Học Lark</h3>
                  <p className="text-xs text-slate-500">Cập nhật link phòng học trực tuyến, ID và mật khẩu</p>
                </div>
                <button
                  onClick={() => setMeetingModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateMeeting} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Link phòng học Lark Meeting
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.larksuite.com/meeting/..."
                    value={meetingForm.larkMeetingUrl}
                    onChange={(e) => setMeetingForm({ ...meetingForm, larkMeetingUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Meeting ID</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 893 421 902"
                      value={meetingForm.meetingId}
                      onChange={(e) => setMeetingForm({ ...meetingForm, meetingId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mật khẩu phòng (Passcode)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 123456"
                      value={meetingForm.passcode}
                      onChange={(e) => setMeetingForm({ ...meetingForm, passcode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ghi chú phòng học</label>
                  <textarea
                    rows={2}
                    placeholder="Nhắc nhở học sinh bật camera, chuẩn bị sách vở..."
                    value={meetingForm.meetingNote}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingNote: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#83C75D] outline-none text-xs text-slate-900"
                  />
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={meetingForm.isLiveNow}
                    onChange={(e) => setMeetingForm({ ...meetingForm, isLiveNow: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">Bật trạng thái &quot;Đang học trực tuyến&quot;</span>
                    <span className="text-[11px] text-slate-500">Lớp học sẽ hiển thị huy hiệu đỏ nhấp nháy cho học sinh biết phòng đang mở</span>
                  </div>
                </label>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setMeetingModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold shadow-md shadow-[#83C75D]/20 transition cursor-pointer"
                  >
                    Lưu cài đặt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 5: THÊM VIDEO BẢN GHI LARK (RECORDED VIDEO MODAL)                   */}
        {/* ========================================================================= */}
        {videoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Thêm Video Bản Ghi Buổi Học</h3>
                  <p className="text-xs text-slate-500">Lưu lại video bài giảng sau buổi học trực tuyến qua Lark</p>
                </div>
                <button
                  onClick={() => setVideoModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateVideo} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tiêu đề buổi học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Buổi 12 - Giải đề thi khảo sát chất lượng..."
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 outline-none text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Link video (YouTube / Google Drive / Lark Video URL) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={newVideo.videoUrl}
                    onChange={(e) => setNewVideo({ ...newVideo, videoUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 outline-none text-xs text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ngày học</label>
                    <input
                      type="date"
                      value={newVideo.sessionDate}
                      onChange={(e) => setNewVideo({ ...newVideo, sessionDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 outline-none text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Thời lượng (phút)</label>
                    <input
                      type="number"
                      min={1}
                      value={newVideo.durationMinutes}
                      onChange={(e) => setNewVideo({ ...newVideo, durationMinutes: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 outline-none text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nội dung tóm tắt</label>
                  <textarea
                    rows={2}
                    placeholder="Các phần kiến thức chính đã giảng trong buổi..."
                    value={newVideo.description}
                    onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-600 outline-none text-xs text-slate-900"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setVideoModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    Lưu video
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 6: THÊM LỊCH HỌC (SCHEDULE MODAL)                                   */}
        {/* ========================================================================= */}
        {scheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Thêm Lịch Học Vào Thời Khóa Biểu</h3>
                  <p className="text-xs text-slate-500">Đặt lịch học định kỳ trong tuần cho học sinh</p>
                </div>
                <button
                  onClick={() => setScheduleModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày trong tuần</label>
                  <select
                    value={newSchedule.dayOfWeek}
                    onChange={(e) => setNewSchedule({ ...newSchedule, dayOfWeek: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-600 outline-none text-xs text-slate-900 font-semibold"
                  >
                    {Object.entries(DAY_NAMES).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Giờ bắt đầu</label>
                    <input
                      type="time"
                      required
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-600 outline-none text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Giờ kết thúc</label>
                    <input
                      type="time"
                      required
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-600 outline-none text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên buổi học / Chủ đề <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đại số & Giải tích"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-600 outline-none text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ghi chú phòng / Địa điểm</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Online qua Lark Meeting hoặc Phòng 204"
                    value={newSchedule.roomNote}
                    onChange={(e) => setNewSchedule({ ...newSchedule, roomNote: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-amber-600 outline-none text-xs text-slate-900"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 transition cursor-pointer"
                  >
                    Thêm lịch học
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 7: TRÌNH XEM BÀI HỌC (LESSON READER MODAL)                         */}
        {/* ========================================================================= */}
        {viewingLesson && (() => {
          const curIdx = materials.findIndex((m) => m.id === viewingLesson.id);
          const prevLesson = curIdx > 0 ? materials[curIdx - 1] : null;
          const nextLesson = curIdx >= 0 && curIdx < materials.length - 1 ? materials[curIdx + 1] : null;
          const ytEmbed = getYouTubeEmbedUrl(viewingLesson.videoUrl);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                  <div className="space-y-1 min-w-0 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#83C75D]/15 text-[#4e8231] border border-[#83C75D]/30">
                        {viewingLesson.chapterTitle || 'Chủ đề chung'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Bài {viewingLesson.lessonOrder || curIdx + 1}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-slate-900 truncate">
                      {viewingLesson.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isTeacher && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = viewingLesson;
                            setViewingLesson(null);
                            handleOpenEditLessonModal(cur);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Chỉnh sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteMaterial(viewingLesson.id);
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Xóa bài học"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setViewingLesson(null)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Reader Content Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
                  {/* Video Section */}
                  {viewingLesson.videoUrl && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-rose-500" />
                        <span>Video bài giảng</span>
                      </h4>
                      {ytEmbed ? (
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-200">
                          <iframe
                            src={ytEmbed}
                            title={viewingLesson.title}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
                          <video
                            src={viewingLesson.videoUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description / Summary Box */}
                  {viewingLesson.description && (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tóm tắt & Mục tiêu bài học</span>
                      </span>
                      <p className="text-xs sm:text-sm font-medium leading-relaxed">
                        {viewingLesson.description}
                      </p>
                    </div>
                  )}

                  {/* Theory / Content */}
                  {viewingLesson.content ? (
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>Nội dung bài giảng / Lý thuyết</span>
                      </h4>
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div className="whitespace-pre-wrap text-sm sm:text-base text-slate-800 leading-relaxed font-sans">
                          {viewingLesson.content}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Attachment File Box */}
                  {viewingLesson.fileUrl && (
                    <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {viewingLesson.attachmentName || 'Tài liệu / Slide đính kèm bài học'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            Tải về tài liệu học tập hoặc xem trực tuyến
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={viewingLesson.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Mở xem / Tải về</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {!viewingLesson.videoUrl && !viewingLesson.content && !viewingLesson.fileUrl && (
                    <div className="py-12 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-600">Bài học này chưa có nội dung chi tiết</p>
                      {isTeacher && (
                        <button
                          type="button"
                          onClick={() => {
                            const cur = viewingLesson;
                            setViewingLesson(null);
                            handleOpenEditLessonModal(cur);
                          }}
                          className="text-xs text-[#4e8231] font-bold hover:underline cursor-pointer"
                        >
                          Bấm vào đây để bổ sung lý thuyết, video hoặc tài liệu
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Reader Footer Navigation */}
                <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
                  <button
                    type="button"
                    disabled={!prevLesson}
                    onClick={() => prevLesson && setViewingLesson(prevLesson)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Bài trước</span>
                  </button>

                  <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                    Bài {curIdx + 1} / {materials.length} bài học
                  </span>

                  <button
                    type="button"
                    disabled={!nextLesson}
                    onClick={() => nextLesson && setViewingLesson(nextLesson)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <span>Bài tiếp theo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
