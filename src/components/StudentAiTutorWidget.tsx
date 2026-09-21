'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  StudentAiTutorMode,
  StudentAiChatMessage,
  StudentAiTutorRequest,
  StudentAiAttachmentDto,
  StudentStudyRecommendationDto,
} from '@/types/aiTutor';
import { aiTutorService } from '@/services/aiTutor.service';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';

interface CustomEventDetail {
  mode?: StudentAiTutorMode;
  lessonId?: string;
  courseId?: string;
  examAttemptId?: string;
  questionId?: string;
  initialQuestion?: string;
}

export default function StudentAiTutorWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<StudentAiTutorMode>('GENERAL_QA');
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<StudentStudyRecommendationDto[]>([]);

  // Attached files state
  const [pendingAttachments, setPendingAttachments] = useState<StudentAiAttachmentDto[]>([]);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Context extracted from URL or custom events
  const [courseId, setCourseId] = useState<string | undefined>(undefined);
  const [lessonId, setLessonId] = useState<string | undefined>(undefined);
  const [examAttemptId, setExamAttemptId] = useState<string | undefined>(undefined);
  const [questionId, setQuestionId] = useState<string | undefined>(undefined);

  const [messages, setMessages] = useState<StudentAiChatMessage[]>([
    {
      role: 'ASSISTANT',
      content:
        '👋 Chào bạn! Mình là **NQD AI Tutor** - Gia sư học tập thông minh của bạn. Bạn có thể hỏi bất kỳ bài học nào, hoặc **tải ảnh bài tập / tệp tài liệu** lên để mình giải đáp nhé!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto detect context from current URL pathname
  useEffect(() => {
    if (!pathname) return;

    const lessonMatch = pathname.match(/\/courses\/([a-zA-Z0-9-]+)\/lessons\/([a-zA-Z0-9-]+)/);
    if (lessonMatch) {
      setCourseId(lessonMatch[1]);
      setLessonId(lessonMatch[2]);
      return;
    }

    const courseMatch = pathname.match(/\/courses\/([a-zA-Z0-9-]+)/);
    if (courseMatch) {
      setCourseId(courseMatch[1]);
      setLessonId(undefined);
    }
  }, [pathname]);

  // Scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Listen to custom trigger events from other components
  useEffect(() => {
    const handleTrigger = (event: CustomEvent<CustomEventDetail>) => {
      const detail = event.detail;
      if (detail) {
        if (detail.mode) setMode(detail.mode);
        if (detail.lessonId) setLessonId(detail.lessonId);
        if (detail.courseId) setCourseId(detail.courseId);
        if (detail.examAttemptId) setExamAttemptId(detail.examAttemptId);
        if (detail.questionId) setQuestionId(detail.questionId);

        setIsOpen(true);

        if (detail.initialQuestion) {
          handleSendMessage(detail.initialQuestion, detail.mode);
        }
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener('open-ai-tutor' as any, handleTrigger);
    return () => {
      window.removeEventListener('open-ai-tutor' as any, handleTrigger);
    };
  }, [courseId, lessonId, examAttemptId, questionId, messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: StudentAiAttachmentDto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isText =
        file.type.startsWith('text/') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.java') ||
        file.name.endsWith('.sql');

      if (isImage) {
        const base64 = await readFileAsDataUrl(file);
        newAttachments.push({
          fileName: file.name,
          fileType: file.type || 'image/jpeg',
          base64Data: base64,
        });
      } else if (isText) {
        const text = await readFileAsText(file);
        newAttachments.push({
          fileName: file.name,
          fileType: file.type || 'text/plain',
          extractedText: text,
        });
      } else {
        const base64 = await readFileAsDataUrl(file);
        newAttachments.push({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          base64Data: base64,
        });
      }
    }

    setPendingAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (customText?: string, overrideMode?: StudentAiTutorMode) => {
    const text = (customText !== undefined ? customText : inputQuestion).trim();
    if (!text && pendingAttachments.length === 0) return;
    if (loading) return;

    const currentMode = overrideMode || mode;
    const currentAttachments = [...pendingAttachments];

    const userMsg: StudentAiChatMessage = {
      role: 'USER',
      content: text || (currentAttachments.length > 0 ? 'Phân tích và giải thích hình ảnh/tệp đính kèm này giúp mình nhé!' : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputQuestion('');
    setPendingAttachments([]);
    setLoading(true);
    setError(null);

    try {
      const requestPayload: StudentAiTutorRequest = {
        question: userMsg.content,
        mode: currentMode,
        courseId,
        lessonId,
        examAttemptId,
        questionId,
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
        conversationHistory: newHistory.filter((m) => m.role !== 'SYSTEM'),
      };

      const response = await aiTutorService.askAiTutor(requestPayload);

      if (response.remainingRequests !== undefined) {
        setRemainingRequests(response.remainingRequests);
      }

      if (response.recommendations && response.recommendations.length > 0) {
        setRecommendations(response.recommendations);
      }

      const assistantMsg: StudentAiChatMessage = {
        role: 'ASSISTANT',
        content: response.answer || response.hint || 'AI Tutor đã xử lý yêu cầu của bạn.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối với AI Tutor');
      const errorMsg: StudentAiChatMessage = {
        role: 'ASSISTANT',
        content: `⚠️ **Rất tiếc:** ${err.message || 'Đã có lỗi xảy ra khi kết nối.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickChip = (chipMode: StudentAiTutorMode, promptText: string) => {
    setMode(chipMode);
    handleSendMessage(promptText, chipMode);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'ASSISTANT',
        content: '🧹 Cuộc hội thoại đã được làm mới. Hãy đặt câu hỏi hoặc tải ảnh/tệp bài tập lên nhé!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setError(null);
    setRecommendations([]);
    setPendingAttachments([]);
  };

  return (
    <>
      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[460px] md:w-[500px] h-[680px] max-h-[88vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-slate-900 p-4 border-b border-slate-800 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-md border border-white/20">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">NQD AI Tutor</h3>
                </div>
                <p className="text-[11px] text-slate-400">Hỗ trợ hỏi đáp bằng văn bản, hình ảnh & tài liệu</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {remainingRequests !== null && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    remainingRequests <= 3
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                  title="Số lượt hỏi còn lại trong 1 phút"
                >
                  ⚡ {remainingRequests} lượt/phút
                </span>
              )}

              <button
                onClick={handleClearChat}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                title="Làm mới cuộc trò chuyện"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-600 rounded-xl transition"
                title="Đóng cửa sổ"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setMode('GENERAL_QA')}
              className={`px-3 py-1 text-xs rounded-xl font-medium whitespace-nowrap transition-all ${
                mode === 'GENERAL_QA'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              💬 Hỏi đáp & Ảnh
            </button>
            <button
              onClick={() => setMode('EXPLAIN_LESSON')}
              className={`px-3 py-1 text-xs rounded-xl font-medium whitespace-nowrap transition-all ${
                mode === 'EXPLAIN_LESSON'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              📖 Giảng bài
            </button>
            <button
              onClick={() => setMode('PROVIDE_HINT')}
              className={`px-3 py-1 text-xs rounded-xl font-medium whitespace-nowrap transition-all ${
                mode === 'PROVIDE_HINT'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🔍 Gợi ý
            </button>
            <button
              onClick={() => setMode('RECOMMEND_STUDY')}
              className={`px-3 py-1 text-xs rounded-xl font-medium whitespace-nowrap transition-all ${
                mode === 'RECOMMEND_STUDY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🎯 Lộ trình
            </button>
            <button
              onClick={() => setMode('EXPLAIN_CONCEPT')}
              className={`px-3 py-1 text-xs rounded-xl font-medium whitespace-nowrap transition-all ${
                mode === 'EXPLAIN_CONCEPT'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🧠 Khái niệm
            </button>
          </div>

          {/* Quick Action Chips Bar */}
          <div className="bg-slate-100/70 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200">
            {lessonId && (
              <button
                onClick={() => handleQuickChip('EXPLAIN_LESSON', 'Hãy tóm tắt và giải thích bài học này giúp mình với!')}
                className="text-[11px] px-2.5 py-0.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200 whitespace-nowrap transition"
              >
                💡 Tóm tắt bài học này
              </button>
            )}
            <button
              onClick={() => handleQuickChip('RECOMMEND_STUDY', 'Dựa vào kết quả học tập của mình, mình nên ôn tập bài nào tiếp theo?')}
              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 whitespace-nowrap transition"
            >
              🎯 Gợi ý bài nên học
            </button>
            <button
              onClick={() => handleQuickChip('GENERAL_QA', 'Hãy giải thích chi tiết hình ảnh bài tập mình đính kèm bên dưới nhé!')}
              className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 whitespace-nowrap transition"
            >
              🖼️ Giải bài tập từ ảnh
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'USER';
              return (
                <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-start gap-2.5 max-w-[88%]">
                    {!isUser && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-xs shadow-xs text-white mt-1">
                        🤖
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                        isUser
                          ? 'bg-[#83C75D] text-white rounded-br-none'
                          : 'bg-slate-50 text-slate-900 rounded-bl-none border border-slate-200/90'
                      }`}
                    >
                      {/* Attachments preview inside message bubble */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2.5 flex flex-wrap gap-2">
                          {msg.attachments.map((att, attIdx) => {
                            const isImg = att.fileType?.startsWith('image/') || att.base64Data?.startsWith('data:image/');
                            return isImg ? (
                              <div
                                key={attIdx}
                                onClick={() => setSelectedPreviewImage(att.base64Data || null)}
                                className="relative rounded-xl overflow-hidden border border-white/20 cursor-pointer hover:opacity-90 transition max-w-[160px] max-h-[120px]"
                              >
                                <img
                                  src={att.base64Data}
                                  alt={att.fileName}
                                  className="w-full h-full object-cover rounded-xl"
                                />
                                <span className="absolute bottom-1 right-1 bg-black/60 text-[9px] px-1 py-0.5 rounded text-white font-mono">
                                  Ảnh
                                </span>
                              </div>
                            ) : (
                              <div
                                key={attIdx}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/20 rounded-xl border border-white/10 text-xs font-mono"
                              >
                                <span>📄</span>
                                <span className="truncate max-w-[140px]">{att.fileName}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {msg.role === 'ASSISTANT' ? (
                        <MathMarkdownRenderer content={msg.content} />
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                  </div>
                  {msg.timestamp && (
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                  )}
                </div>
              );
            })}

            {/* Recommendations Card List */}
            {recommendations.length > 0 && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                  <span>🎯 Bài học gợi ý ôn tập cho bạn:</span>
                </div>
                {recommendations.map((rec, i) => (
                  <div key={i} className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${rec.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                          {rec.priority}
                        </span>
                        <span className="text-xs font-medium text-white">{rec.lessonTitle || rec.topic}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-3 bg-slate-800/50 rounded-2xl w-fit border border-slate-700/30 animate-pulse">
                <div className="w-5 h-5 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs">
                  🤖
                </div>
                <span>AI Tutor đang đọc ảnh/tài liệu và biên soạn lời giải...</span>
                <div className="flex gap-1 ml-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pending Attachments Tray */}
          {pendingAttachments.length > 0 && (
            <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/90 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-slate-400 shrink-0 font-medium">Đính kèm ({pendingAttachments.length}):</span>
              {pendingAttachments.map((att, idx) => {
                const isImg = att.fileType?.startsWith('image/') || att.base64Data?.startsWith('data:image/');
                return (
                  <div
                    key={idx}
                    className="relative group shrink-0 flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200"
                  >
                    {isImg ? (
                      <img
                        src={att.base64Data}
                        alt={att.fileName}
                        className="w-6 h-6 object-cover rounded-lg border border-white/10"
                      />
                    ) : (
                      <span>📄</span>
                    )}
                    <span className="text-[11px] truncate max-w-[100px]">{att.fileName}</span>
                    <button
                      type="button"
                      onClick={() => removePendingAttachment(idx)}
                      className="ml-1 text-slate-400 hover:text-rose-400 font-bold"
                      title="Xóa tệp này"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Input */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800/80">
            {error && (
              <div className="mb-2 text-[11px] text-rose-400 bg-rose-500/10 px-2.5 py-1.5 rounded-xl border border-rose-500/20 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="text-rose-300 hover:text-white ml-2 font-bold">
                  ✕
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.csv,.json,.md,.js,.ts,.py,.java,.sql"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/80 transition-all flex-shrink-0"
                title="Đính kèm ảnh bài tập hoặc tài liệu (PNG, JPG, PDF, TXT, Code...)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              <textarea
                ref={textareaRef}
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={
                  pendingAttachments.length > 0
                    ? 'Nhập yêu cầu phân tích cho tệp đính kèm...'
                    : mode === 'EXPLAIN_LESSON'
                    ? 'Hỏi AI Tutor về bài học này...'
                    : mode === 'PROVIDE_HINT'
                    ? 'Yêu cầu gợi ý phương pháp giải...'
                    : mode === 'RECOMMEND_STUDY'
                    ? 'Yêu cầu tư vấn lộ trình học...'
                    : 'Nhập câu hỏi hoặc tải ảnh bài tập lên...'
                }
                className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none max-h-24 transition"
              />

              <button
                type="submit"
                disabled={loading || (!inputQuestion.trim() && pendingAttachments.length === 0)}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all flex-shrink-0"
                title="Gửi câu hỏi"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 p-2 rounded-2xl border border-slate-700">
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shadow-lg"
            >
              ✕
            </button>
            <img
              src={selectedPreviewImage}
              alt="Ảnh phóng to"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
