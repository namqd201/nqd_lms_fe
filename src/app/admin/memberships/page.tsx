'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '@/services/admin.service';
import {
  MembershipPlanResponse,
  CreateMembershipPlanData,
  UpdateMembershipPlanData,
  PlanUserType,
  BillingCycle,
} from '@/types/membership';
import { formatErrorMessage } from '@/utils/errorMessage';
import {
  Crown,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  X,
  Sparkles,
  BookOpen,
  GraduationCap,
  Presentation,
  HelpCircle,
  FileSpreadsheet,
  Clock,
  Layers,
  Bot,
  Percent,
  Download,
  Video,
  Database,
  BarChart2,
  RotateCcw,
} from 'lucide-react';

const AVAILABLE_FEATURES = [
  {
    key: 'AI_TUTOR',
    label: 'AI Tutor 24/7',
    description: 'Hỏi đáp và học kèm trợ lý ảo AI không giới hạn',
    icon: Bot,
  },
  {
    key: 'PREMIUM_COURSES',
    label: 'Khóa học chất lượng cao',
    description: 'Truy cập các bài học và khóa học có phí',
    icon: BookOpen,
  },
  {
    key: 'PREMIUM_EXAMS',
    label: 'Kho đề thi nâng cao',
    description: 'Làm đề kiểm tra, thi thử với phân tích điểm chi tiết',
    icon: FileSpreadsheet,
  },
  {
    key: 'PDF_DOWNLOAD',
    label: 'Tải tài liệu PDF',
    description: 'Tải đề thi, lời giải chi tiết định dạng PDF chuẩn',
    icon: Download,
  },
  {
    key: 'VIDEO_HIGH_QUALITY',
    label: 'Video Full HD',
    description: 'Xem video bài giảng độ phân giải cao không giới hạn',
    icon: Video,
  },
  {
    key: 'AI_EXAM_GENERATION',
    label: 'AI tạo đề & câu hỏi',
    description: 'Giáo viên tự động sinh đề thi và câu hỏi từ tài liệu',
    icon: Sparkles,
  },
  {
    key: 'AI_SLIDE_GENERATION',
    label: 'AI tạo Slide bài giảng',
    description: 'Tự động tạo slide bài thuyết trình chuẩn giáo trình',
    icon: Presentation,
  },
  {
    key: 'ADVANCED_ANALYTICS',
    label: 'Báo cáo chuyên sâu',
    description: 'Phân tích phổ điểm, độ khó câu hỏi và tiến độ học',
    icon: BarChart2,
  },
  {
    key: 'DISCOUNT_ON_PURCHASES',
    label: 'Giảm 20% mua nội dung lẻ',
    description: 'Ưu đãi giảm giá khi mua khóa học hoặc bài học đơn lẻ',
    icon: Percent,
  },
  {
    key: 'ULTRA_UNLIMITED_COURSES',
    label: 'Coursera Plus (Ultra)',
    description: 'Vào học miễn phí mọi khóa học & bài học trên sàn',
    icon: Crown,
  },
];

export default function AdminMembershipsPage() {
  const [plans, setPlans] = useState<MembershipPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('ALL');
  const [billingCycleFilter, setBillingCycleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlanResponse | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [planCode, setPlanCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [userType, setUserType] = useState<PlanUserType>('STUDENT');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('0');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [active, setActive] = useState<boolean>(true);
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('PUBLISHED');

  // Limits form fields (-1 or empty = Unlimited)
  const [examLimitPerWeek, setExamLimitPerWeek] = useState<string>('7');
  const [aiQuestionLimitPerDay, setAiQuestionLimitPerDay] = useState<string>('10');
  const [maxClassesLimit, setMaxClassesLimit] = useState<string>('');
  const [maxQuestionsLimit, setMaxQuestionsLimit] = useState<string>('');
  const [aiPromptLimitPerMonth, setAiPromptLimitPerMonth] = useState<string>('100');
  const [examCreationLimit, setExamCreationLimit] = useState<string>('50');
  const [dailyCourseEnrollmentLimit, setDailyCourseEnrollmentLimit] = useState<string>('');
  const [monthlyCourseEnrollmentLimit, setMonthlyCourseEnrollmentLimit] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Delete State
  const [deletingPlan, setDeletingPlan] = useState<MembershipPlanResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load plans from backend
  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await adminService.getMembershipPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể tải danh sách gói hội viên'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Handle Seeding / Restoring default plans
  const handleSeedDefaults = async () => {
    if (!confirm('Hệ thống sẽ nạp và khôi phục các gói hội viên mặc định (Free, Pro, Ultra). Bạn có chắc chắn muốn tiếp tục?')) {
      return;
    }
    setIsSeeding(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await adminService.initDefaultMembershipPlans();
      setPlans(res);
      setSuccessMsg('Đã khôi phục và nạp danh sách gói hội viên mặc định thành công!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Lỗi khi nạp gói mặc định'));
    } finally {
      setIsSeeding(false);
    }
  };

  // Open Modal for Create or Edit
  const openModal = (plan?: MembershipPlanResponse) => {
    setModalError(null);
    if (plan) {
      setEditingPlan(plan);
      setPlanCode(plan.planCode || plan.code || '');
      setName(plan.name || '');
      setUserType(plan.userType || 'STUDENT');
      setDescription(plan.description || '');
      setPrice(String(plan.price || 0));
      setBillingCycle(plan.billingCycle || 'MONTHLY');
      setActive(plan.active !== false);
      setStatus(plan.status || 'PUBLISHED');
      setExamLimitPerWeek(plan.examLimitPerWeek !== undefined && plan.examLimitPerWeek !== null ? String(plan.examLimitPerWeek) : '');
      setAiQuestionLimitPerDay(plan.aiQuestionLimitPerDay !== undefined && plan.aiQuestionLimitPerDay !== null ? String(plan.aiQuestionLimitPerDay) : '');
      setMaxClassesLimit(plan.maxClassesLimit !== undefined && plan.maxClassesLimit !== null ? String(plan.maxClassesLimit) : '');
      setMaxQuestionsLimit(plan.maxQuestionsLimit !== undefined && plan.maxQuestionsLimit !== null ? String(plan.maxQuestionsLimit) : '');
      setAiPromptLimitPerMonth(plan.aiPromptLimitPerMonth !== undefined && plan.aiPromptLimitPerMonth !== null ? String(plan.aiPromptLimitPerMonth) : '100');
      setExamCreationLimit(plan.examCreationLimit !== undefined && plan.examCreationLimit !== null ? String(plan.examCreationLimit) : '50');
      setDailyCourseEnrollmentLimit(plan.dailyCourseEnrollmentLimit !== undefined && plan.dailyCourseEnrollmentLimit !== null ? String(plan.dailyCourseEnrollmentLimit) : '');
      setMonthlyCourseEnrollmentLimit(plan.monthlyCourseEnrollmentLimit !== undefined && plan.monthlyCourseEnrollmentLimit !== null ? String(plan.monthlyCourseEnrollmentLimit) : '');
      setSelectedFeatures(Array.isArray(plan.features) ? plan.features : []);
    } else {
      setEditingPlan(null);
      setPlanCode('');
      setName('');
      setUserType('STUDENT');
      setDescription('');
      setPrice('99000');
      setBillingCycle('MONTHLY');
      setActive(true);
      setStatus('PUBLISHED');
      setExamLimitPerWeek('-1');
      setAiQuestionLimitPerDay('-1');
      setMaxClassesLimit('');
      setMaxQuestionsLimit('');
      setAiPromptLimitPerMonth('100');
      setExamCreationLimit('50');
      setDailyCourseEnrollmentLimit('');
      setMonthlyCourseEnrollmentLimit('');
      setSelectedFeatures(['AI_TUTOR', 'PREMIUM_COURSES', 'PREMIUM_EXAMS']);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setModalError(null);
  };

  // Toggle Feature checkbox
  const toggleFeature = (featKey: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featKey) ? prev.filter((k) => k !== featKey) : [...prev, featKey]
    );
  };

  // Parse integer or null for limits
  const parseLimit = (val: string): number | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? undefined : parsed;
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!name.trim()) {
      setModalError('Vui lòng nhập tên gói hội viên');
      return;
    }

    if (!editingPlan && !planCode.trim()) {
      setModalError('Vui lòng nhập mã định danh gói (ví dụ: PRO_STUDENT_MONTHLY)');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setModalError('Giá tiền không hợp lệ');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPlan) {
        const updateData: UpdateMembershipPlanData = {
          name: name.trim(),
          userType,
          description: description.trim() || undefined,
          price: priceNum,
          currency: 'VND',
          billingCycle,
          active,
          status,
          examLimitPerWeek: parseLimit(examLimitPerWeek),
          aiQuestionLimitPerDay: parseLimit(aiQuestionLimitPerDay),
          maxClassesLimit: parseLimit(maxClassesLimit),
          maxQuestionsLimit: parseLimit(maxQuestionsLimit),
          aiPromptLimitPerMonth: parseLimit(aiPromptLimitPerMonth),
          examCreationLimit: parseLimit(examCreationLimit),
          dailyCourseEnrollmentLimit: parseLimit(dailyCourseEnrollmentLimit),
          monthlyCourseEnrollmentLimit: parseLimit(monthlyCourseEnrollmentLimit),
          features: selectedFeatures,
        };

        const updated = await adminService.updateMembershipPlan(editingPlan.id, updateData);
        setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setSuccessMsg(`Đã cập nhật gói "${updated.name}" thành công!`);
      } else {
        const createData: CreateMembershipPlanData = {
          planCode: planCode.trim().toUpperCase(),
          name: name.trim(),
          userType,
          description: description.trim() || undefined,
          price: priceNum,
          currency: 'VND',
          billingCycle,
          active,
          status,
          examLimitPerWeek: parseLimit(examLimitPerWeek),
          aiQuestionLimitPerDay: parseLimit(aiQuestionLimitPerDay),
          maxClassesLimit: parseLimit(maxClassesLimit),
          maxQuestionsLimit: parseLimit(maxQuestionsLimit),
          aiPromptLimitPerMonth: parseLimit(aiPromptLimitPerMonth),
          examCreationLimit: parseLimit(examCreationLimit),
          dailyCourseEnrollmentLimit: parseLimit(dailyCourseEnrollmentLimit),
          monthlyCourseEnrollmentLimit: parseLimit(monthlyCourseEnrollmentLimit),
          features: selectedFeatures,
        };

        const created = await adminService.createMembershipPlan(createData);
        setPlans((prev) => [created, ...prev]);
        setSuccessMsg(`Đã tạo gói mới "${created.name}" thành công!`);
      }

      closeModal();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setModalError(formatErrorMessage(err, 'Lưu gói hội viên thất bại'));
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Toggle Active Status
  const handleToggleStatus = async (plan: MembershipPlanResponse) => {
    try {
      const nextActive = !plan.active;
      const updated = await adminService.toggleMembershipPlanStatus(plan.id, nextActive);
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSuccessMsg(`Đã ${nextActive ? 'bật kích hoạt' : 'tạm ngưng'} gói "${plan.name}"`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể đổi trạng thái gói'));
    }
  };

  // Delete Plan
  const handleDeletePlan = async () => {
    if (!deletingPlan) return;
    setIsDeleting(true);
    try {
      await adminService.deleteMembershipPlan(deletingPlan.id);
      setPlans((prev) => prev.filter((p) => p.id !== deletingPlan.id));
      setSuccessMsg(`Đã xóa gói "${deletingPlan.name}" thành công!`);
      setDeletingPlan(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(formatErrorMessage(err, 'Không thể xóa gói hội viên'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // Search
      const search = searchTerm.toLowerCase();
      const codeMatch = (plan.planCode || plan.code || '').toLowerCase().includes(search);
      const nameMatch = (plan.name || '').toLowerCase().includes(search);
      const descMatch = (plan.description || '').toLowerCase().includes(search);
      if (search && !codeMatch && !nameMatch && !descMatch) return false;

      // User Type
      if (userTypeFilter !== 'ALL' && plan.userType !== userTypeFilter) return false;

      // Billing Cycle
      if (billingCycleFilter !== 'ALL' && plan.billingCycle !== billingCycleFilter) return false;

      // Status
      if (statusFilter === 'ACTIVE' && !plan.active) return false;
      if (statusFilter === 'INACTIVE' && plan.active) return false;

      return true;
    });
  }, [plans, searchTerm, userTypeFilter, billingCycleFilter, statusFilter]);

  // Stats calculation
  const totalPlans = plans.length;
  const activePlansCount = plans.filter((p) => p.active).length;
  const studentPlansCount = plans.filter((p) => p.userType === 'STUDENT').length;
  const teacherPlansCount = plans.filter((p) => p.userType === 'TEACHER').length;

  const formatPrice = (p: number) => {
    if (p === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(p) + ' đ';
  };

  const getCycleLabel = (cycle: BillingCycle) => {
    switch (cycle) {
      case 'MONTHLY':
        return '/ tháng';
      case 'QUARTERLY':
        return '/ quý (3 tháng)';
      case 'YEARLY':
        return '/ năm';
      case 'LIFETIME':
        return 'trọn đời';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Quản lý Gói Hội viên (Membership Plans)
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Cấu hình thông tin, giá bán, hạn mức làm đề, câu hỏi AI và đặc quyền cho Học sinh & Giáo viên
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSeedDefaults}
            disabled={isSeeding || isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
            title="Tự động kiểm tra và nạp lại các gói mặc định nếu bị thiếu"
          >
            {isSeeding ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <RotateCcw className="w-4 h-4 text-slate-500" />}
            <span>Nạp lại gói mặc định</span>
          </button>

          <button
            onClick={loadPlans}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo gói mới</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-rose-100 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số gói</p>
            <p className="text-lg font-black text-slate-900">{totalPlans}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đang mở bán</p>
            <p className="text-lg font-black text-emerald-600">{activePlansCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gói Học sinh</p>
            <p className="text-lg font-black text-sky-600">{studentPlansCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gói Giáo viên</p>
            <p className="text-lg font-black text-indigo-600">{teacherPlansCount}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã gói..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {/* User Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'STUDENT', label: 'Học sinh' },
              { id: 'TEACHER', label: 'Giáo viên' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setUserTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  userTypeFilter === tab.id
                    ? 'bg-white text-purple-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Billing Cycle Filter */}
          <select
            value={billingCycleFilter}
            onChange={(e) => setBillingCycleFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="ALL">Mọi chu kỳ</option>
            <option value="MONTHLY">Theo Tháng</option>
            <option value="YEARLY">Theo Năm</option>
            <option value="LIFETIME">Trọn đời</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Đang mở bán</option>
            <option value="INACTIVE">Tạm ngưng</option>
          </select>
        </div>
      </div>

      {/* Grid of Plans */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-bold">Đang tải danh sách gói hội viên...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Crown className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Không tìm thấy gói hội viên nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || userTypeFilter !== 'ALL' || billingCycleFilter !== 'ALL'
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc.'
              : 'Hiện chưa có gói hội viên nào trong cơ sở dữ liệu. Bấm "Nạp lại gói mặc định" để khởi tạo nhanh.'}
          </p>
          <button
            onClick={handleSeedDefaults}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Nạp lại gói mặc định ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => {
            const isStudent = plan.userType === 'STUDENT';
            const isTeacher = plan.userType === 'TEACHER';
            const isAll = plan.userType === 'ALL';

            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between bg-white rounded-2xl border transition-all hover:shadow-md relative overflow-hidden ${
                  plan.active
                    ? isStudent
                      ? 'border-sky-200/80 hover:border-sky-400'
                      : isTeacher
                      ? 'border-purple-200/80 hover:border-purple-400'
                      : 'border-emerald-200/80 hover:border-emerald-400'
                    : 'border-slate-200 opacity-75 bg-slate-50/50'
                }`}
              >
                {/* Top Badge Strip */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${
                          isStudent
                            ? 'bg-sky-100 text-sky-700'
                            : isTeacher
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isStudent ? 'Học sinh' : isTeacher ? 'Giáo viên' : 'Học sinh & GV'}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          plan.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {plan.active ? '● Hoạt động' : 'Tạm ngưng'}
                      </span>

                      {plan.hasDiscount && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse">
                          Sale -{plan.discountPercent}%
                        </span>
                      )}
                    </div>

                    {/* Quick Active Toggle */}
                    <button
                      onClick={() => handleToggleStatus(plan)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        plan.active ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                      title={plan.active ? 'Bấm để tạm ngưng gói' : 'Bấm để kích hoạt gói'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          plan.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Title & Code */}
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {plan.name}
                  </h3>
                  <p className="text-[11px] font-mono font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md inline-block mt-1">
                    {plan.planCode || plan.code}
                  </p>

                  {/* Price */}
                  <div className="mt-3.5 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">
                      {formatPrice(plan.discountedPrice !== undefined ? plan.discountedPrice : plan.price)}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {getCycleLabel(plan.billingCycle)}
                    </span>
                    {plan.hasDiscount && plan.originalPrice && (
                      <span className="text-xs text-slate-400 line-through ml-1">
                        {formatPrice(plan.originalPrice)}
                      </span>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {plan.description}
                    </p>
                  )}

                  {/* Structured Limits Box */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                      Hạn mức sử dụng
                    </p>

                    {isStudent && (
                      <>
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" /> Đề thi / tuần:
                          </span>
                          <span className="font-bold">
                            {plan.examLimitPerWeek === -1 || plan.examLimitPerWeek === null || plan.examLimitPerWeek === undefined
                              ? 'Không giới hạn'
                              : `${plan.examLimitPerWeek} đề`}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-slate-700">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Bot className="w-3.5 h-3.5 text-purple-600" /> Câu hỏi AI / ngày:
                          </span>
                          <span className="font-bold">
                            {plan.aiQuestionLimitPerDay === -1 || plan.aiQuestionLimitPerDay === null || plan.aiQuestionLimitPerDay === undefined
                              ? 'Không giới hạn'
                              : `${plan.aiQuestionLimitPerDay} câu`}
                          </span>
                        </div>

                        {(plan.dailyCourseEnrollmentLimit || plan.monthlyCourseEnrollmentLimit) && (
                          <div className="flex justify-between items-center text-slate-700">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> Khóa học Ultra:
                            </span>
                            <span className="font-bold">
                              {plan.dailyCourseEnrollmentLimit || '∞'} / ngày • {plan.monthlyCourseEnrollmentLimit || '∞'} / tháng
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {isTeacher && (
                      <>
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Presentation className="w-3.5 h-3.5 text-indigo-600" /> Tối đa lớp học:
                          </span>
                          <span className="font-bold">
                            {plan.maxClassesLimit === -1 || plan.maxClassesLimit === null || plan.maxClassesLimit === undefined
                              ? 'Không giới hạn'
                              : `${plan.maxClassesLimit} lớp`}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-slate-700">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Ngân hàng câu hỏi:
                          </span>
                          <span className="font-bold">
                            {plan.maxQuestionsLimit === -1 || plan.maxQuestionsLimit === null || plan.maxQuestionsLimit === undefined
                              ? 'Không giới hạn'
                              : `${plan.maxQuestionsLimit} câu`}
                          </span>
                        </div>
                      </>
                    )}

                    {plan.examCreationLimit !== undefined && plan.examCreationLimit !== null && (
                      <div className="flex justify-between items-center text-slate-700">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Tạo đề thi AI:
                        </span>
                        <span className="font-bold">
                          {plan.examCreationLimit === -1 ? 'Không giới hạn' : `${plan.examCreationLimit} lượt`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feature Badges */}
                  <div className="mt-3.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                      Đặc quyền & Tính năng
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(plan.features) && plan.features.length > 0 ? (
                        plan.features.slice(0, 5).map((fKey) => {
                          const matched = AVAILABLE_FEATURES.find((f) => f.key === fKey);
                          return (
                            <span
                              key={fKey}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60"
                              title={matched?.description}
                            >
                              ✓ {matched?.label || fKey}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chưa gán đặc quyền</span>
                      )}
                      {Array.isArray(plan.features) && plan.features.length > 5 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700">
                          +{plan.features.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openModal(plan)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sửa cấu hình</span>
                  </button>

                  <button
                    onClick={() => setDeletingPlan(plan)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa / Ẩn gói"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo / Chỉnh sửa Gói Hội viên */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingPlan ? 'Cập nhật Gói Hội viên' : 'Tạo Gói Hội viên Mới'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingPlan ? `Mã gói: ${editingPlan.planCode || editingPlan.code}` : 'Thiết lập thông tin và hạn mức cho gói hội viên'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Thông tin cơ bản */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 border-b border-purple-100 pb-1.5 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> 1. Thông tin chung
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã định danh gói (Code) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: PRO_STUDENT_MONTHLY"
                      value={planCode}
                      disabled={!!editingPlan}
                      onChange={(e) => setPlanCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                      className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Viết hoa không dấu, ngăn cách bằng dấu gạch dưới.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên hiển thị của gói <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Gói Học Sinh Pro (Tháng)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đối tượng sử dụng <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={userType}
                      onChange={(e) => setUserType(e.target.value as PlanUserType)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="STUDENT">Học sinh (Student)</option>
                      <option value="TEACHER">Giáo viên (Teacher)</option>
                      <option value="ALL">Cả hai (All Users)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chu kỳ thanh toán <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="MONTHLY">Hàng tháng (Monthly)</option>
                      <option value="QUARTERLY">Hàng quý (Quarterly - 3 tháng)</option>
                      <option value="YEARLY">Hàng năm (Yearly)</option>
                      <option value="LIFETIME">Trọn đời (Lifetime - Miễn phí)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Giá niêm yết (VNĐ) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      step="1000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô tả gói dịch vụ
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả tóm tắt lợi ích nổi bật của gói này..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded-md border-slate-300 focus:ring-purple-500"
                    />
                    <span>Kích hoạt mở bán ngay (Active)</span>
                  </label>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700">Phát hành:</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 font-semibold"
                    >
                      <option value="PUBLISHED">Công khai (PUBLISHED)</option>
                      <option value="DRAFT">Bản nháp (DRAFT)</option>
                      <option value="ARCHIVED">Lưu trữ (ARCHIVED)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cấu hình hạn mức (Limits) */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 border-b border-purple-100 pb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 2. Cấu hình hạn mức (Limits)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal normal-case">
                    * Điền <span className="font-bold font-mono text-purple-600">-1</span> hoặc để trống để đặt <strong>Không giới hạn</strong>
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lượt thi làm đề / tuần (Học sinh)
                    </label>
                    <input
                      type="number"
                      placeholder="-1 (Không giới hạn)"
                      value={examLimitPerWeek}
                      onChange={(e) => setExamLimitPerWeek(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Gói Free thường là 7 đề/tuần, Gói Pro là -1</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Câu hỏi AI Tutor / ngày (Học sinh)
                    </label>
                    <input
                      type="number"
                      placeholder="-1 (Không giới hạn)"
                      value={aiQuestionLimitPerDay}
                      onChange={(e) => setAiQuestionLimitPerDay(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Gói Free thường là 10 câu/ngày, Gói Pro là -1</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tối đa lớp học quản lý (Giáo viên)
                    </label>
                    <input
                      type="number"
                      placeholder="-1 (Không giới hạn)"
                      value={maxClassesLimit}
                      onChange={(e) => setMaxClassesLimit(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Gói GV Miễn phí thường là 5 lớp, Gói Pro là -1</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số lượng câu hỏi ngân hàng (Giáo viên)
                    </label>
                    <input
                      type="number"
                      placeholder="-1 (Không giới hạn)"
                      value={maxQuestionsLimit}
                      onChange={(e) => setMaxQuestionsLimit(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Gói GV Miễn phí thường là 100 câu, Gói Pro là -1</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      AI Prompts hỗ trợ / tháng
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      value={aiPromptLimitPerMonth}
                      onChange={(e) => setAiPromptLimitPerMonth(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lượt tạo đề thi AI / tháng
                    </label>
                    <input
                      type="number"
                      placeholder="50"
                      value={examCreationLimit}
                      onChange={(e) => setExamCreationLimit(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ghi danh khóa học / ngày (Gói Ultra)
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 10"
                      value={dailyCourseEnrollmentLimit}
                      onChange={(e) => setDailyCourseEnrollmentLimit(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ghi danh khóa học / tháng (Gói Ultra)
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 100"
                      value={monthlyCourseEnrollmentLimit}
                      onChange={(e) => setMonthlyCourseEnrollmentLimit(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Tính năng & Đặc quyền (Features) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 border-b border-purple-100 pb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> 3. Danh sách Đặc quyền & Tính năng
                  </span>
                  <span className="text-[10px] text-purple-600 font-bold">
                    Đã chọn {selectedFeatures.length} đặc quyền
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_FEATURES.map((feat) => {
                    const isChecked = selectedFeatures.includes(feat.key);
                    const Icon = feat.icon;
                    return (
                      <div
                        key={feat.key}
                        onClick={() => toggleFeature(feat.key)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-purple-50/70 border-purple-300 shadow-2xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 mt-0.5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${isChecked ? 'text-purple-600' : 'text-slate-400'}`} />
                            <span>{feat.label}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {feat.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 rounded-xl transition-all disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingPlan ? 'Lưu thay đổi' : 'Tạo gói hội viên'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa / Ẩn gói */}
      {deletingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">
                Xác nhận xóa gói hội viên?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gói <strong>"{deletingPlan.name}"</strong> ({deletingPlan.planCode || deletingPlan.code}) sẽ được chuyển vào kho lưu trữ (soft-delete) và ẩn khỏi trang thanh toán.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingPlan(null)}
                disabled={isDeleting}
                className="w-full py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeletePlan}
                disabled={isDeleting}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200 rounded-xl transition-all disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
