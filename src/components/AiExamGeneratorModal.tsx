'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Layers,
  BookOpen,
  GraduationCap,
  FileCheck,
  RefreshCw,
  Check,
  Headphones,
  Image as ImageIcon,
} from 'lucide-react';
import { ListeningAudioPlayer } from '@/components/ListeningAudioPlayer';
import { SubjectResponse } from '@/types/admin';
import { TeacherCourseResponse } from '@/types/course';
import { QuestionType, QuestionDifficulty } from '@/types/question';
import {
  TeacherAiJobDetailResponse,
  ExamBlueprintItemRequest,
} from '@/types/ai';
import { aiService } from '@/services/ai.service';
import { GRADE_LEVEL_GROUPS } from '@/constants/gradeLevels';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';

interface AiExamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: SubjectResponse[];
  courses: TeacherCourseResponse[];
  onExamCreated?: (examId: string) => void;
  zIndex?: string;
}

export const AiExamGeneratorModal: React.FC<AiExamGeneratorModalProps> = ({
  isOpen,
  onClose,
  subjects,
  courses,
  onExamCreated,
  zIndex = 'z-[100]',
}) => {
  const [subjectId, setSubjectId] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<string>('Lớp 1');
  const [title, setTitle] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [passingMarks, setPassingMarks] = useState<number>(5);

  const [blueprintItems, setBlueprintItems] = useState<ExamBlueprintItemRequest[]>([
    { topic: 'Kiến thức nhận biết cơ bản', questionType: 'MULTIPLE_CHOICE', difficulty: 'EASY', count: 4, marksPerQuestion: 1 },
    { topic: 'Kiến thức thông hiểu & vận dụng', questionType: 'MULTIPLE_CHOICE', difficulty: 'MEDIUM', count: 4, marksPerQuestion: 1 },
    { topic: 'Câu hỏi tư duy logic / Đúng sai', questionType: 'TRUE_FALSE', difficulty: 'MEDIUM', count: 2, marksPerQuestion: 1 },
  ]);

  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [listeningPassageType, setListeningPassageType] = useState<string>('DIALOGUE');
  const [maxListeningPlays, setMaxListeningPlays] = useState<number>(2);
  const [includeImages, setIncludeImages] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCreatingExam, setIsCreatingExam] = useState<boolean>(false);
  const [jobDetail, setJobDetail] = useState<TeacherAiJobDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-detect English subject
  const isEnglishSubject = React.useMemo(() => {
    const currentSubj = subjects.find((s) => s.id === subjectId);
    return Boolean(
      currentSubj &&
        (currentSubj.name.toLowerCase().includes('tiếng anh') ||
          currentSubj.name.toLowerCase().includes('english') ||
          currentSubj.code.toLowerCase().includes('eng'))
    );
  }, [subjects, subjectId]);

  useEffect(() => {
    if (isEnglishSubject) {
      setIsListening(true);
    }
  }, [isEnglishSubject]);

  useEffect(() => {
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
  }, [subjects, subjectId]);

  if (!isOpen) return null;

  const totalBlueprintQuestions = blueprintItems.reduce((sum, item) => sum + (item.count || 0), 0);
  const totalBlueprintMarks = blueprintItems.reduce((sum, item) => sum + (item.count || 0) * (item.marksPerQuestion || 0), 0);

  const handleAddBlueprintRow = () => {
    setBlueprintItems([
      ...blueprintItems,
      { topic: '', questionType: 'MULTIPLE_CHOICE', difficulty: 'MEDIUM', count: 2, marksPerQuestion: 1 },
    ]);
  };

  const handleRemoveBlueprintRow = (index: number) => {
    if (blueprintItems.length <= 1) return;
    setBlueprintItems(blueprintItems.filter((_, i) => i !== index));
  };

  const handleBlueprintChange = (index: number, field: keyof ExamBlueprintItemRequest, val: any) => {
    const updated = [...blueprintItems];
    updated[index] = { ...updated[index], [field]: val };
    setBlueprintItems(updated);
  };

  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !title.trim()) {
      setError('Vui lòng chọn Môn học và nhập Tiêu đề đề thi.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setSuccessMsg(null);

      const res = await aiService.generateExam({
        subjectId,
        courseId: courseId || undefined,
        gradeLevel,
        title: title.trim(),
        durationMinutes,
        passingMarks,
        totalMarks: totalBlueprintMarks,
        blueprintItems,
        additionalInstructions: additionalInstructions.trim() || undefined,
        isListening: isListening || undefined,
        listeningPassageType: isListening ? listeningPassageType : undefined,
        maxListeningPlays: isListening ? maxListeningPlays : undefined,
        includeImages: includeImages || undefined,
      });

      setJobDetail(res);
      setSuccessMsg(`AI đã biên soạn thành công ${res.questions.length} câu hỏi theo ma trận đề thi!`);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi biên soạn đề thi bằng AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateRealExam = async () => {
    if (!jobDetail) return;
    try {
      setIsCreatingExam(true);
      setError(null);
      const res = await aiService.createExamFromJob(jobDetail.job.id);
      setSuccessMsg(res.message);
      if (res.createdExamId && onExamCreated) {
        onExamCreated(res.createdExamId);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo đề thi từ AI');
    } finally {
      setIsCreatingExam(false);
    }
  };

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto`}>
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-800 via-purple-700 to-indigo-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">AI Biên Soạn Đề Thi Tự Động (Ma Trận Đề)</h2>
              <p className="text-xs text-indigo-200 font-medium">
                Sinh đề thi hoàn chỉnh theo tỷ lệ phân bổ độ khó, loại câu hỏi và chủ đề bài học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!jobDetail ? (
            <form onSubmit={handleGenerateExam} className="space-y-5">
              {/* Exam Info Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    Môn học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                    Khối lớp / Cấp độ
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    {GRADE_LEVEL_GROUPS.map((grp) => (
                      <optgroup key={grp.level} label={grp.label}>
                        {grp.grades.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    Khóa học (Tùy chọn)
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Không gắn khóa học --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Timing */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tên đề thi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Đề Kiểm Tra Giữa Học Kỳ 1 Toán 5..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Thời gian (phút)
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Điểm đạt (Passing)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Blueprint Matrix Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Ma Trận Đề Thi (Blueprint Matrix)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tổng số câu: <strong>{totalBlueprintQuestions}</strong> | Tổng điểm dự kiến:{' '}
                      <strong>{totalBlueprintMarks} điểm</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBlueprintRow}
                    className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm hàng ma trận</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {blueprintItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Chủ đề kiến thức</label>
                        <input
                          type="text"
                          value={item.topic || ''}
                          onChange={(e) => handleBlueprintChange(idx, 'topic', e.target.value)}
                          placeholder="Chủ đề / Yêu cầu..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Loại câu hỏi</label>
                        <select
                          value={item.questionType || 'MULTIPLE_CHOICE'}
                          onChange={(e) => handleBlueprintChange(idx, 'questionType', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                          <option value="TRUE_FALSE">Đúng / Sai</option>
                          <option value="SHORT_ANSWER">Trả lời ngắn</option>
                          <option value="FILL_IN_THE_BLANK">Điền từ</option>
                          <option value="ESSAY">Tự luận</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Độ khó</label>
                        <select
                          value={item.difficulty || 'MEDIUM'}
                          onChange={(e) => handleBlueprintChange(idx, 'difficulty', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                        >
                          <option value="EASY">Dễ</option>
                          <option value="MEDIUM">Trung bình</option>
                          <option value="HARD">Khó</option>
                        </select>
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Số câu</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={item.count}
                          onChange={(e) => handleBlueprintChange(idx, 'count', Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center bg-white focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Điểm/câu</label>
                        <input
                          type="number"
                          step="0.25"
                          min={0.25}
                          value={item.marksPerQuestion}
                          onChange={(e) => handleBlueprintChange(idx, 'marksPerQuestion', Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center bg-white focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        {blueprintItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBlueprintRow(idx)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Listening Exam Settings */}
              <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                      <Headphones className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <span>Đề thi kỹ năng Nghe tiếng Anh (Listening Exam)</span>
                        {isEnglishSubject && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-200/80 text-indigo-800 text-[10px] font-black">
                            Khuyên dùng cho Tiếng Anh
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-indigo-700/80">
                        AI sẽ tự động tạo bài nghe âm thanh tự nhiên và thiết lập số lần nghe tối đa khi học sinh làm bài thi.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isListening}
                      onChange={(e) => setIsListening(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {isListening && (
                  <div className="pt-2 border-t border-indigo-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-indigo-900 mb-1">Thể loại bài nghe:</label>
                      <select
                        value={listeningPassageType}
                        onChange={(e) => setListeningPassageType(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-indigo-900 text-xs font-bold focus:outline-none"
                      >
                        <option value="DIALOGUE">👥 Hội thoại 2 người (Conversations / Interviews)</option>
                        <option value="MONOLOGUE">📢 Đoạn văn ngắn / Độc thoại (Short Talks / Announcements)</option>
                        <option value="INTERVIEW">🎙️ Tin tức / Thảo luận (News / Discussions)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-indigo-900 mb-1">Số lượt nghe tối đa của học sinh:</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={maxListeningPlays}
                        onChange={(e) => setMaxListeningPlays(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-indigo-900 text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Educational Image / Diagram Generation Option */}
              <div className="p-4 bg-gradient-to-r from-emerald-50/80 via-teal-50/80 to-cyan-50/80 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <span>Tạo kèm hình ảnh minh họa cho đề thi (AI Diagram Generator)</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 text-[10px] font-black">
                          Toán, Lý, Hóa, Sinh, Địa, Anh...
                        </span>
                      </h4>
                      <p className="text-[11px] text-emerald-700/80">
                        AI tự động vẽ sơ đồ hình học, mạch điện, biểu đồ, cấu tạo tế bào hoặc tranh tình huống tương ứng đúng nội dung câu hỏi.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ghi chú biên soạn đề cho AI
                </label>
                <textarea
                  rows={2}
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="Ví dụ: Đề thi cân đối giữa lý thuyết và bài tập tính toán, tránh trùng lặp câu hỏi..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI đang biên soạn toàn bộ đề thi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>Bắt đầu biên soạn đề thi bằng AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: Exam Generated Review */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-sm font-bold text-indigo-900">{jobDetail.job.targetExamTitle}</h3>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Mã đề dự kiến: <strong>{jobDetail.job.targetExamCode}</strong> | Thời gian:{' '}
                    <strong>{jobDetail.job.targetExamDuration} phút</strong> | Tổng số câu:{' '}
                    <strong>{jobDetail.questions.length}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setJobDetail(null)}
                    className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Soạn ma trận khác</span>
                  </button>

                  <button
                    onClick={handleCreateRealExam}
                    disabled={isCreatingExam}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>{isCreatingExam ? 'Đang tạo đề thi...' : 'Phê duyệt & Tạo Đề thi trực tiếp'}</span>
                  </button>
                </div>
              </div>

              {/* Questions list preview */}
              <div className="space-y-3">
                {jobDetail.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold">
                          {q.questionType}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-bold">
                          {q.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-bold">
                          {q.marks} điểm
                        </span>
                        {(q.imageUrl || q.content.includes('![')) && (
                          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-teal-600" />
                            Hình minh họa
                          </span>
                        )}
                      </div>

                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Hợp lệ
                      </span>
                    </div>

                    {/* Listening Audio Player Preview */}
                    {(q.audioUrl || q.audioScript) && (
                      <div className="py-1">
                        <ListeningAudioPlayer
                          audioUrl={q.audioUrl}
                          audioScript={q.audioScript}
                          allowTranscript={true}
                          title={`Bài nghe câu ${idx + 1}`}
                        />
                      </div>
                    )}

                    <div className="text-xs font-bold text-slate-800 leading-relaxed">
                      <MathMarkdownRenderer content={q.content} />
                    </div>

                    {q.imageUrl && !q.content.includes('![') && (
                      <div className="my-2.5 text-center">
                        <img
                          src={
                            q.imageUrl.startsWith('http://') || q.imageUrl.startsWith('https://') || q.imageUrl.startsWith('data:')
                              ? q.imageUrl
                              : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${q.imageUrl.startsWith('/') ? '' : '/'}${q.imageUrl}`
                          }
                          alt="Hình ảnh minh họa đề bài"
                          className="max-h-72 max-w-full rounded-xl mx-auto border border-slate-200 shadow-xs object-contain"
                        />
                      </div>
                    )}

                    {q.options && q.options.length > 0 && (
                      <div className="pt-1">
                        {q.options.some((o) => o.optionKey === 'ANS') ? (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                            <span className="font-bold text-purple-700 shrink-0">💡 Đáp án điền:</span>
                            <div className="font-extrabold text-emerald-800 text-sm">
                              <MathMarkdownRenderer content={q.options.find((o) => o.optionKey === 'ANS')?.optionText || ''} />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold'
                                    : 'bg-slate-50 border border-slate-100 text-slate-600'
                                }`}
                              >
                                <span className="font-bold shrink-0">{opt.optionKey}.</span>
                                <div className="flex-1 min-w-0">
                                  <MathMarkdownRenderer content={opt.optionText} />
                                </div>
                                {opt.isCorrect && (
                                  <span className="ml-auto text-[10px] text-emerald-700 font-extrabold shrink-0">
                                    ✓ Đúng
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
