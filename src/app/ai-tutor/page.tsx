'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { aiTutorService } from '@/services/aiTutor.service';
import { MathMarkdownRenderer } from '@/components/MathMarkdownRenderer';
import {
  StudentAiTutorMode,
  StudentAiAttachmentDto,
  AiTutorConversationDto,
  AiTutorMessageDto,
} from '@/types/aiTutor';
import {
  Bot,
  User as UserIcon,
  Send,
  Square,
  Plus,
  Trash2,
  Edit2,
  Paperclip,
  FileText,
  X,
  Sparkles,
  Search,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';

export default function AiTutorPage() {
  const { user, isAuthenticated } = useAuth();

  // Conversations state
  const [conversations, setConversations] = useState<AiTutorConversationDto[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiTutorMessageDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Rename conversation state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Input & Generation state
  const [inputQuery, setInputQuery] = useState('');
  const [mode, setMode] = useState<StudentAiTutorMode>('GENERAL_QA');
  const [attachments, setAttachments] = useState<StudentAiAttachmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Abort controller ref for stop generation
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversations list
  const loadConversations = async (selectFirst = true) => {
    if (!isAuthenticated) return;
    try {
      setLoadingConversations(true);
      const list = await aiTutorService.getConversations();
      setConversations(list);
      if (selectFirst && list.length > 0 && !activeConvId) {
        selectConversation(list[0].id);
      } else if (list.length === 0) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);

  // Select a conversation and load its messages
  const selectConversation = async (id: string) => {
    try {
      setActiveConvId(id);
      setLoadingMessages(true);
      const detail = await aiTutorService.getConversationDetail(id);
      setMessages(detail.messages || []);
      if (detail.mode) {
        setMode(detail.mode);
      }
    } catch (err) {
      console.error('Failed to load conversation detail:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Create new chat
  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([
      {
        id: 'welcome',
        role: 'ASSISTANT',
        content:
          '👋 **Xin chào! Mình là NQD AI Tutor.**\n\nMình có thể hỗ trợ bạn giải đáp bài học, hướng dẫn giải bài tập và ôn luyện kiến thức. Bạn cần mình giúp gì hôm nay?',
        createdAt: new Date().toISOString(),
      },
    ]);
    setAttachments([]);
    setInputQuery('');
    textareaRef.current?.focus();
  };

  // Handle clipboard paste (Ctrl+V for images/screenshots)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processFile(file);
        }
      }
    }
  };

  // Process file upload / dropped file
  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('Tệp quá lớn! Vui lòng chọn tệp nhỏ hơn 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAttachments((prev) => [
        ...prev,
        {
          fileName: file.name || `screenshot_${Date.now()}.png`,
          fileType: file.type || 'image/png',
          base64Data: base64,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      processFile(files[i]);
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Send message
  const handleSendMessage = async () => {
    const text = inputQuery.trim();
    if ((!text && attachments.length === 0) || isLoading) return;

    const currentAttachments = [...attachments];
    const userMsg: AiTutorMessageDto = {
      id: `user-${Date.now()}`,
      role: 'USER',
      content: text,
      attachments: currentAttachments,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setAttachments([]);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await aiTutorService.askAiTutor(
        {
          conversationId: activeConvId || undefined,
          question: text || 'Hãy giải thích và phân tích chi tiết hình ảnh/tài liệu này giúp mình nhé!',
          mode: mode,
          attachments: currentAttachments,
        },
        controller.signal
      );

      const aiMsg: AiTutorMessageDto = {
        id: `ai-${Date.now()}`,
        role: 'ASSISTANT',
        content: response.answer || response.hint || 'Không nhận được câu trả lời từ AI.',
        recommendations: response.recommendations,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If this was a new conversation, update active conversation ID and reload list
      if (!activeConvId && response.conversationId) {
        setActiveConvId(response.conversationId);
      }
      loadConversations(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            id: `aborted-${Date.now()}`,
            role: 'ASSISTANT',
            content: '⏹ *Bạn đã dừng quá trình tạo câu trả lời.*',
            createdAt: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'ASSISTANT',
            content: `⚠️ **Lỗi:** ${err.message || 'Không thể kết nối tới AI Tutor.'}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // Rename conversation
  const handleSaveRename = async (id: string) => {
    if (!editingTitle.trim()) return;
    try {
      await aiTutorService.renameConversation(id, editingTitle.trim());
      setEditingConvId(null);
      loadConversations(false);
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa đoạn chat này không?')) return;
    try {
      await aiTutorService.deleteConversation(id);
      if (activeConvId === id) {
        handleNewChat();
      }
      loadConversations(false);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex h-full w-full min-h-0 bg-white text-slate-900 overflow-hidden font-sans">
      {/* Left History Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72 sm:w-80' : 'w-0 -translate-x-full'
        } transition-all duration-300 ease-in-out shrink-0 h-full bg-slate-50 border-r border-slate-200 flex flex-col z-20 overflow-hidden`}
      >
        <div className="p-3.5 shrink-0 border-b border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Đoạn chat mới</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition"
            title="Đóng danh sách chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3.5 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm lịch sử..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 space-y-1 py-1 custom-scrollbar">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Đang tải lịch sử...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-400">
              {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có lịch sử trò chuyện'}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeConvId === c.id;
              const isEditing = editingConvId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 font-semibold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveRename(c.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(c.id)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white text-slate-900 px-2 py-0.5 rounded border border-indigo-500 w-full text-xs shadow-2xs"
                      />
                    ) : (
                      <span className="truncate">{c.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConvId(c.id);
                          setEditingTitle(c.title);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                        title="Đổi tên"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Xóa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full min-w-0 min-h-0 bg-white relative overflow-hidden">
        {/* Top Header - LOCKED IN PLACE */}
        <header className="h-14 shrink-0 px-4 border-b border-slate-200 flex items-center justify-between bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                title="Mở lịch sử chat"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm shadow-sm">
                🤖
              </div>
              <h1 className="font-bold text-sm text-slate-900">
                {activeConvId
                  ? conversations.find((c) => c.id === activeConvId)?.title || 'Đang trò chuyện'
                  : 'Trợ lý AI Tutor'}
              </h1>
            </div>
          </div>

          {/* Mode Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setMode('GENERAL_QA')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                mode === 'GENERAL_QA'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hỏi đáp chung
            </button>
            <button
              onClick={() => setMode('EXPLAIN_LESSON')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                mode === 'EXPLAIN_LESSON'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Giảng bài học
            </button>
            <button
              onClick={() => setMode('PROVIDE_HINT')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                mode === 'PROVIDE_HINT'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Gợi ý giải bài
            </button>
            <button
              onClick={() => setMode('RECOMMEND_STUDY')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                mode === 'RECOMMEND_STUDY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Lộ trình học
            </button>
          </div>
        </header>

        {/* Message Stream - ONLY THIS CONTAINER SCROLLS ON MOUSE WHEEL */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl w-full mx-auto">
          {loadingMessages ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-sm font-medium">Đang tải cuộc trò chuyện...</span>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.role === 'USER';
              return (
                <div
                  key={m.id || idx}
                  className={`flex items-start gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold shadow-xs ${
                      isUser
                        ? 'bg-slate-900 text-white'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                    }`}
                  >
                    {isUser ? (
                      user?.fullName ? (
                        user.fullName.charAt(0).toUpperCase()
                      ) : (
                        <UserIcon className="w-4 h-4" />
                      )
                    ) : (
                      '🤖'
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 shadow-xs ${
                      isUser
                        ? 'bg-[#83C75D] text-white rounded-tr-xs font-medium'
                        : 'bg-slate-50 text-slate-900 rounded-tl-xs border border-slate-200/90'
                    }`}
                  >
                    {/* User Attachments if any */}
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {m.attachments.map((att, attIdx) => (
                          <div
                            key={attIdx}
                            className={`border rounded-2xl p-2 flex items-center gap-2 max-w-xs ${
                              isUser
                                ? 'bg-black/20 border-white/30 text-white'
                                : 'bg-white border-slate-200 text-slate-900'
                            }`}
                          >
                            {att.base64Data && att.fileType.startsWith('image') ? (
                              <img
                                src={att.base64Data}
                                alt={att.fileName}
                                className="w-16 h-16 object-cover rounded-xl border border-black/10"
                              />
                            ) : (
                              <FileText className={`w-6 h-6 ${isUser ? 'text-white' : 'text-indigo-600'}`} />
                            )}
                            <div className="flex flex-col min-w-0 pr-1">
                              <span className="text-xs font-semibold truncate">
                                {att.fileName}
                              </span>
                              <span className="text-[10px] opacity-80 uppercase font-mono">
                                {att.fileType.split('/')[1] || 'FILE'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Content Renderer */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    ) : (
                      <MathMarkdownRenderer content={m.content} className="text-slate-900 font-normal" />
                    )}

                    {/* Recommendations Cards if any */}
                    {m.recommendations && m.recommendations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                        <p className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <span>Gợi ý học tập được cá nhân hóa:</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {m.recommendations.map((rec, rIdx) => (
                            <div
                              key={rIdx}
                              className="bg-white border border-slate-200 rounded-2xl p-3 text-xs shadow-2xs"
                            >
                              <p className="font-bold text-slate-900">{rec.lessonTitle || rec.topic}</p>
                              <p className="text-slate-500 text-[11px] mt-1">{rec.reason}</p>
                              {rec.lessonId && (
                                <Link
                                  href={`/courses/${rec.courseId}/lessons/${rec.lessonId}`}
                                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                                >
                                  <span>Ôn tập ngay</span>
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* AI Thinking / Generating state */}
          {isLoading && (
            <div className="flex items-start gap-4 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl shrink-0 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-sm shadow-xs">
                🤖
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-3xl rounded-tl-xs p-4 text-xs text-indigo-700 font-medium flex items-center gap-3 shadow-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>AI đang suy nghĩ và tính toán câu trả lời...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Workspace - FIXED AT BOTTOM */}
        <div className="shrink-0 p-4 bg-white border-t border-slate-200 max-w-4xl w-full mx-auto">
          {/* Attachment Preview Badges */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="relative group bg-slate-100 border border-slate-200 rounded-2xl p-2 flex items-center gap-2 pr-8 shadow-2xs animate-in fade-in"
                >
                  {att.base64Data && att.fileType.startsWith('image') ? (
                    <img
                      src={att.base64Data}
                      alt={att.fileName}
                      className="w-10 h-10 object-cover rounded-xl border border-slate-300"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-indigo-600" />
                  )}
                  <div className="flex flex-col min-w-0 max-w-[140px]">
                    <span className="text-xs font-semibold text-slate-800 truncate">{att.fileName}</span>
                    <span className="text-[10px] text-slate-500">Đã đính kèm</span>
                  </div>
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-200 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 focus-within:border-indigo-600 focus-within:bg-white rounded-3xl p-2 sm:p-3 shadow-2xs transition-all">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*,application/pdf,text/*"
              className="hidden"
            />

            {/* File upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 rounded-2xl transition shrink-0"
              title="Tải ảnh đề bài hoặc tệp tài liệu"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Main Textarea */}
            <textarea
              ref={textareaRef}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Nhập câu hỏi..."
              rows={1}
              className="flex-1 bg-transparent text-slate-900 text-sm placeholder-slate-400 focus:outline-none resize-none max-h-32 min-h-[2.5rem] py-1.5 px-2"
            />

            {/* Action Button: Send or Stop Generation */}
            {isLoading ? (
              <button
                onClick={handleStopGeneration}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition shrink-0 hover:scale-105"
                title="Dừng tạo câu trả lời"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Dừng lại</span>
              </button>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={!inputQuery.trim() && attachments.length === 0}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm transition shrink-0 hover:scale-105"
                title="Gửi câu hỏi (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-2">
            NQD AI Tutor có thể mắc lỗi. Vui lòng kiểm tra lại các thông tin quan trọng. Nhấn Shift + Enter để xuống dòng.
          </p>
        </div>
      </main>
    </div>
  );
}
