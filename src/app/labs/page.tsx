'use client';

import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Video,
  Radio,
  Calendar,
  Clock,
  User,
  Users,
  Plus,
  Share2,
  Copy,
  Check,
  Play,
  Film,
  Lock,
  ExternalLink,
  Trash2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  Eye,
  GraduationCap,
  Tv,
  Layers,
  CheckCircle,
} from 'lucide-react';
import {
  labService,
  LabRoomItem,
  LabRecordedVideoItem,
  CreateLabRoomInput,
} from '@/services/lab.service';
import { useAuth } from '@/context/AuthContext';

export default function LabsPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');
  const isTeacher = user?.roles?.some((r) => r === 'TEACHER' || r === 'ROLE_TEACHER');

  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = {
    success: (text: string) => {
      setToast({ type: 'success', text });
      setTimeout(() => setToast(null), 3500);
    },
    error: (text: string) => {
      setToast({ type: 'error', text });
      setTimeout(() => setToast(null), 3500);
    },
    info: (text: string) => {
      setToast({ type: 'info', text });
      setTimeout(() => setToast(null), 3500);
    },
  };

  const [activeTab, setActiveTab] = useState<'rooms' | 'videos'>('rooms');
  const [loading, setLoading] = useState(true);
  const [labs, setLabs] = useState<LabRoomItem[]>([]);
  const [videos, setVideos] = useState<LabRecordedVideoItem[]>([]);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateLabRoomInput>({
    title: '',
    description: '',
    speakerName: user?.fullName || '',
    speakerTitle: 'Giảng viên',
    coverImageUrl: '',
    scheduledStartTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    estimatedDurationMinutes: 60,
  });

  // Video Player Modal State
  const [playingVideo, setPlayingVideo] = useState<LabRecordedVideoItem | null>(null);

  // Copy Link State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Syncing State
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const data = await labService.getPublicLabs();
      setLabs(data);
    } catch (err: any) {
      console.error('Failed to fetch lab rooms', err);
      showToast.error(err.message || 'Không thể tải danh sách phòng Lab');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await labService.getMyRecordedVideos();
      setVideos(data);
    } catch (err: any) {
      console.error('Failed to fetch recorded videos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rooms') {
      fetchLabs();
    } else {
      fetchVideos();
    }
  }, [activeTab, isAuthenticated]);

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.speakerName.trim() || !formData.scheduledStartTime) {
      showToast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    try {
      setCreating(true);
      const newRoom = await labService.createLab({
        ...formData,
        scheduledStartTime: new Date(formData.scheduledStartTime).toISOString(),
      });
      showToast.success('Tạo phòng Lab trực tuyến thành công!');
      setIsCreateOpen(false);
      setLabs((prev) => [newRoom, ...prev]);
    } catch (err: any) {
      showToast.error(err.message || 'Lỗi khi tạo phòng Lab');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyPublicLink = (room: LabRoomItem) => {
    const url = room.guestMeetingUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedId(room.id);
    showToast.success('Đã sao chép link tham gia công khai cho mọi người!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleUpdateStatus = async (room: LabRoomItem, status: 'SCHEDULED' | 'LIVE' | 'ENDED') => {
    try {
      const updated = await labService.updateStatus(room.id, status);
      setLabs((prev) => prev.map((r) => (r.id === room.id ? updated : r)));
      showToast.success(`Đã cập nhật trạng thái phòng: ${status === 'LIVE' ? 'Đang Trực Tiếp 🔴' : 'Đã Kết Thúc'}`);
    } catch (err: any) {
      showToast.error(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa/đóng phòng Lab này không?')) return;
    try {
      await labService.deleteLab(roomId);
      setLabs((prev) => prev.filter((r) => r.id !== roomId));
      showToast.success('Đã xóa phòng Lab thành công');
    } catch (err: any) {
      showToast.error(err.message || 'Không thể xóa phòng Lab');
    }
  };

  const handleSyncRecordings = async (roomId: string) => {
    try {
      setSyncingId(roomId);
      const res = await labService.sync100msRecordings(roomId);
      showToast.success(res.message);
      if (res.syncedCount > 0 && activeTab === 'videos') {
        fetchVideos();
      }
    } catch (err: any) {
      showToast.error(err.message || 'Lỗi khi đồng bộ video bản ghi');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa video bản ghi này không?')) return;
    try {
      await labService.deleteRecordedVideo(videoId);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      showToast.success('Đã xóa video bản ghi thành công');
    } catch (err: any) {
      showToast.error(err.message || 'Không thể xóa video');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm">
          <div
            className={`p-4 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-slate-950/90 border-indigo-500/50 text-indigo-200'
            }`}
          >
            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* ========================================================
          HERO BANNER
          ======================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-rose-950 to-indigo-950 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-rose-500/20 shadow-xl">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-semibold backdrop-blur-xs">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                <span>Không Gian Training & Chia Sẻ Kiến Thức Mở • Public Video Call</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-rose-100 to-amber-200 bg-clip-text text-transparent">
                Phòng Lab Trực Tuyến
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Nơi các <strong>Giáo viên, Giảng viên, Giáo sư, Tiến sĩ, Thạc sĩ</strong> chủ động mở các buổi
                training chuyên đề, hội thảo và chia sẻ kinh nghiệm thực chiến.
                <strong> Link phòng là Public</strong> — bất kỳ ai cũng có thể vào tham gia tự do.
                Video sau khi lưu lại được bảo mật, chỉ hiển thị cho Chủ phòng và Admin.
              </p>
            </div>

            {/* Action button */}
            <div className="shrink-0">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    showToast.info('Vui lòng đăng nhập để đăng ký tạo phòng Lab');
                    return;
                  }
                  setIsCreateOpen(true);
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2.5 active:scale-95 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>+ Đăng Ký Tạo Phòng Lab</span>
              </button>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="mt-8 flex items-center gap-2 p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 w-fit">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'rooms'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Lịch Online Lab Sắp Tới</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-black">
                {labs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'videos'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Video Đã Lưu (Chủ Phòng & Admin)</span>
              <Lock className="w-3 h-3 text-amber-300" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          BODY CONTENT
          ======================================================== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-8">
        {/* ================= TAB 1: UPCOMING & LIVE LABS ================= */}
        {activeTab === 'rooms' && (
          <div>
            {loading ? (
              <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">Đang tải danh sách phòng Lab...</p>
              </div>
            ) : labs.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-2xl">
                  🧪
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-slate-800">Chưa có buổi Online Lab nào</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Bạn là giảng viên, giáo sư, tiến sĩ hay chuyên gia muốn chia sẻ kiến thức? Hãy bấm nút
                    <strong> "+ Đăng Ký Tạo Phòng Lab"</strong> để bắt đầu buổi training công khai đầu tiên!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {labs.map((room) => {
                  const isLive = room.status === 'LIVE';
                  const isEnded = room.status === 'ENDED';
                  const startDate = new Date(room.scheduledStartTime);
                  const isMyRoom = room.isHostOrAdmin;

                  return (
                    <div
                      key={room.id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-rose-300"
                    >
                      {/* Image / Header banner */}
                      <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                        <img
                          src={
                            room.coverImageUrl ||
                            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
                          }
                          alt={room.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black shadow-md animate-pulse">
                              <Radio className="w-3.5 h-3.5" />
                              <span>ĐANG TRỰC TIẾP</span>
                            </span>
                          ) : isEnded ? (
                            <span className="px-3 py-1 rounded-full bg-slate-800/80 backdrop-blur-xs text-slate-300 text-[11px] font-bold">
                              Đã kết thúc
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-xs text-white text-[11px] font-bold">
                              Sắp diễn ra
                            </span>
                          )}

                          <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold">
                            🌐 Public Lab
                          </span>
                        </div>

                        {/* Duration */}
                        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[11px] backdrop-blur-xs font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{room.estimatedDurationMinutes} phút</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                              {room.speakerTitle || 'Giảng viên'}
                            </span>
                            <span className="text-xs font-bold text-slate-700 truncate">
                              {room.speakerName}
                            </span>
                          </div>

                          <h3 className="font-extrabold text-slate-900 text-base line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                            {room.title}
                          </h3>

                          {room.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {room.description}
                            </p>
                          )}
                        </div>

                        {/* Time & Host info */}
                        <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-rose-500" />
                              <span>{startDate.toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="font-semibold text-slate-700">
                              {startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Tạo bởi: {room.hostName}</span>
                            <span className="text-emerald-600 font-semibold">Tối đa {room.maxParticipants} người</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 space-y-2">
                          {/* PUBLIC JOIN BUTTON (FOR EVERYONE) */}
                          <a
                            href={room.guestMeetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition text-center"
                          >
                            <Video className="w-4 h-4" />
                            <span>Tham Gia Phòng Lab (Public)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <div className="flex items-center gap-2">
                            {/* Copy Public Link */}
                            <button
                              onClick={() => handleCopyPublicLink(room)}
                              className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 transition"
                            >
                              {copiedId === room.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-bold">Đã sao chép</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>

                            {/* HOST EXCLUSIVE BUTTONS */}
                            {isMyRoom && room.hostMeetingUrl && (
                              <a
                                href={room.hostMeetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs flex items-center gap-1 hover:bg-amber-100 transition"
                                title="Vào với quyền Diễn giả / Chủ phòng (Bật mic/camera/ghi hình)"
                              >
                                <span>Host 🎙️</span>
                              </a>
                            )}
                          </div>

                          {/* Host Controls */}
                          {isMyRoom && (
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5">
                                {!isLive && !isEnded && (
                                  <button
                                    onClick={() => handleUpdateStatus(room, 'LIVE')}
                                    className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100"
                                  >
                                    Bắt đầu Live
                                  </button>
                                )}
                                {isLive && (
                                  <button
                                    onClick={() => handleUpdateStatus(room, 'ENDED')}
                                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200"
                                  >
                                    Kết thúc
                                  </button>
                                )}
                                <button
                                  onClick={() => handleSyncRecordings(room.id)}
                                  disabled={syncingId === room.id}
                                  className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 flex items-center gap-1"
                                >
                                  <RefreshCw className={`w-2.5 h-2.5 ${syncingId === room.id ? 'animate-spin' : ''}`} />
                                  <span>Lưu video</span>
                                </button>
                              </div>
                              <button
                                onClick={() => handleDeleteRoom(room.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Xóa phòng"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PRIVATE RECORDED VIDEOS ================= */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            {/* Privacy notice banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xl font-bold">
                🔒
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Quyền Riêng Tư Bản Ghi Video Phòng Lab</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-200 text-amber-900">
                    Bảo mật
                  </span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Theo thiết kế của hệ thống: Sau khi buổi Online Lab kết thúc, video ghi hình sẽ được lưu lại
                  và <strong>chỉ hiển thị riêng cho Chủ kênh (Host/Diễn giả)</strong> và <strong>Quản trị viên (Admin)</strong>.
                  Người ngoài và các học viên tham gia thông thường sẽ không thể xem hay truy cập danh mục video lưu này.
                </p>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-xs p-8 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-2xl">
                  🔒
                </div>
                <h3 className="text-base font-bold text-slate-800">Cần đăng nhập để xem video của bạn</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hãy đăng nhập bằng tài khoản Giảng viên hoặc Admin để quản lý kho video bản ghi phòng Lab của bạn.
                </p>
              </div>
            ) : loading ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
                <div className="w-10 h-10 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">Đang tải video bản ghi của bạn...</p>
              </div>
            ) : videos.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-xs p-8 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-2xl">
                  🎬
                </div>
                <h3 className="text-base font-bold text-slate-800">Chưa có video bản ghi nào</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Khi bạn kết thúc buổi Lab và bật tính năng ghi hình trên 100ms, hệ thống sẽ tự động lưu lại video
                  và hiển thị tại đây để bạn có thể xem lại hoặc tải về máy.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                  >
                    {/* Video thumbnail placeholder */}
                    <div className="relative h-44 bg-slate-900 flex items-center justify-center group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="w-14 h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer z-10"
                        onClick={() => setPlayingVideo(vid)}
                      >
                        <Play className="w-6 h-6 fill-current ml-0.5" />
                      </div>
                      <span className="absolute bottom-3 left-3 text-xs text-white/90 font-medium z-10 flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-rose-400" />
                        <span>{vid.durationMinutes ? `${vid.durationMinutes} phút` : 'Bản ghi'}</span>
                      </span>
                      {isAdmin && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold z-10">
                          Admin View
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[11px] font-semibold text-rose-600 block line-clamp-1">
                          {vid.labRoomTitle}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-2">
                          {vid.title}
                        </h4>
                        {vid.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {vid.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Chủ kênh: {vid.ownerName}</span>
                        <span>{vid.recordedDate || new Date(vid.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => setPlayingVideo(vid)}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Xem Video</span>
                        </button>
                        <a
                          href={vid.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteVideo(vid.id)}
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition"
                          title="Xóa video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: TẠO PHÒNG LAB MỚI
          ======================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl">
                  🧪
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Đăng Ký Tạo Phòng Lab Mới</h2>
                  <p className="text-xs text-slate-500">Mở phòng training trực tuyến công khai cho mọi người</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLab} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tiêu đề buổi Lab / Training <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Workshop Giải đề Toán 3D & Phương pháp Tư duy Socratic"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Danh xưng / Học hàm <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.speakerTitle}
                    onChange={(e) => setFormData({ ...formData, speakerTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-800 bg-white"
                  >
                    <option value="Giáo sư">Giáo sư (GS)</option>
                    <option value="Phó Giáo sư">Phó Giáo sư (PGS)</option>
                    <option value="Tiến sĩ">Tiến sĩ (TS)</option>
                    <option value="Thạc sĩ">Thạc sĩ (ThS)</option>
                    <option value="Giảng viên">Giảng viên</option>
                    <option value="Giảng viên cao cấp">Giảng viên cao cấp</option>
                    <option value="Chuyên gia">Chuyên gia</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên diễn giả / Chủ phòng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Họ và tên diễn giả"
                    value={formData.speakerName}
                    onChange={(e) => setFormData({ ...formData, speakerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledStartTime}
                    onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Thời lượng dự kiến (phút)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    value={formData.estimatedDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  URL Ảnh bìa / Poster (Tùy chọn)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.coverImageUrl}
                  onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mô tả & Nội dung chia sẻ
                </label>
                <textarea
                  rows={3}
                  placeholder="Tóm tắt những kiến thức bổ ích sẽ được chia sẻ trong buổi Lab..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-800 resize-none"
                />
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
                💡 <strong>Lưu ý:</strong> Link tham gia sẽ được tạo công khai. Sau khi kết thúc, video lưu lại sẽ chỉ hiển thị riêng tư cho bạn và Quản trị viên.
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition disabled:opacity-50"
                >
                  {creating ? 'Đang tạo phòng...' : 'Xác nhận tạo phòng Lab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: VIDEO PLAYER
          ======================================================== */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-sm truncate max-w-lg">{playingVideo.title}</h3>
                <span className="text-xs text-slate-400">Buổi Lab: {playingVideo.labRoomTitle}</span>
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                src={playingVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                Trình duyệt của bạn không hỗ trợ phát video này.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
