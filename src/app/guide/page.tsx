'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Compass,
  BookOpen,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Layers,
  FileSpreadsheet,
  BarChart3,
  Dumbbell,
  MessageSquareCode,
  Trophy,
  Award,
  DollarSign,
  FlaskConical,
  ShieldCheck,
  Check,
  ExternalLink,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Menu,
  X,
  FileText,
  Lightbulb,
  AlertTriangle,
  Play,
  Send,
  QrCode,
  ArrowRight,
  Users,
  Presentation,
  Flame,
  Ticket,
  Bot,
  Laptop,
  CheckCheck,
} from 'lucide-react';

type RoleTab = 'STUDENT' | 'TEACHER' | 'ADMIN';

interface DocStep {
  title: string;
  description: string;
  keyPoints?: string[];
}

interface DocArticle {
  id: string;
  category: string;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  readTime: string;
  badge?: string;
  badgeColor?: string;
  tldr: string; // Tóm tắt nhanh 30 giây
  steps: DocStep[];
  tip?: string;
  warning?: string;
  actionText?: string;
  actionHref?: string;
  mockupType?:
    | 'student-exam'
    | 'student-ai-tutor'
    | 'student-mistake'
    | 'student-payment'
    | 'teacher-ai-question'
    | 'teacher-finance'
    | 'teacher-course-slide'
    | 'none';
}

export default function GuidePage() {
  const { user, isAuthenticated, isTeacherPro, isPro, isUltra } = useAuth();

  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');
  const isTeacher = user?.roles?.some((r) => r === 'TEACHER' || r === 'ROLE_TEACHER');

  // Role detection
  const [activeRole, setActiveRole] = useState<RoleTab>('STUDENT');
  const [activeArticleId, setActiveArticleId] = useState<string>('student-quickstart');
  const [userSwitchedRole, setUserSwitchedRole] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);

  // Auto detect user role on load
  useEffect(() => {
    if (!userSwitchedRole) {
      if (isAdmin) {
        setActiveRole('TEACHER');
        setActiveArticleId('teacher-curriculum');
      } else if (isTeacher) {
        setActiveRole('TEACHER');
        setActiveArticleId('teacher-curriculum');
      } else {
        setActiveRole('STUDENT');
        setActiveArticleId('student-quickstart');
      }
    }
  }, [isAdmin, isTeacher, userSwitchedRole]);

  // --------------------------------------------------------------------------
  // DANH SÁCH BÀI HƯỚNG DẪN DÀNH CHO HỌC SINH (STUDENT ARTICLES)
  // --------------------------------------------------------------------------
  const studentArticles: DocArticle[] = [
    {
      id: 'student-quickstart',
      category: 'Khởi đầu & Tài khoản',
      title: 'Bắt đầu nhanh: Đăng nhập One-Click & Hồ sơ học sinh',
      shortTitle: 'Đăng nhập & Hồ sơ',
      icon: Compass,
      readTime: '1 phút đọc',
      badge: 'Cơ bản',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      tldr: 'Đăng nhập trực tiếp bằng Google không cần mật khẩu, cập nhật khối lớp từ 1-12 hoặc Đại học để nhận đề thi chuẩn xác.',
      steps: [
        {
          title: 'Đăng nhập bảo mật qua Google',
          description:
            'Bấm nút "Đăng nhập Google" ở góc trên bên phải màn hình. Hệ thống liên kết tự động với tài khoản Google của bạn, không lo quên mật khẩu.',
          keyPoints: ['Hỗ trợ cả máy tính và điện thoại', 'Đồng bộ tên và ảnh đại diện tự động'],
        },
        {
          title: 'Cập nhật Khối lớp & Họ tên in trên chứng chỉ',
          description:
            'Vào trang "Hồ sơ cá nhân" (/profile) để kiểm tra họ tên hiển thị. Tên này sẽ xuất hiện trên Chứng chỉ tốt nghiệp điện tử sau khi bạn hoàn thành khóa học.',
          keyPoints: ['Chọn đúng khối lớp để hệ thống lọc bài tập phù hợp', 'Có thể cập nhật ảnh và số điện thoại bất kỳ lúc nào'],
        },
      ],
      tip: 'Bạn nên sử dụng cùng một tài khoản Google khi học trên điện thoại và máy tính để đồng bộ chuỗi ngày học (Streak).',
      actionText: 'Cập nhật hồ sơ ngay',
      actionHref: '/profile',
    },
    {
      id: 'student-courses',
      category: 'Học tập & Bài giảng',
      title: 'Cách học Bài giảng Video, Slide tương tác & Tải tài liệu',
      shortTitle: 'Khóa học & Bài giảng',
      icon: BookOpen,
      readTime: '2 phút đọc',
      badge: 'Trọng tâm',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      tldr: 'Khám phá bài học với video độ nét cao, bấm nút "Trình chiếu Slide" để học tương tác toàn màn hình, tải tài liệu đính kèm bên dưới bài.',
      steps: [
        {
          title: 'Tìm kiếm & Đăng ký Khóa học',
          description:
            'Vào mục "Khóa học" (/courses). Sử dụng bộ lọc 9 môn học chính (Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa, Tin) và khối lớp để chọn khóa học bạn mong muốn.',
          keyPoints: ['Khóa học miễn phí: bấm "Bắt đầu học ngay"', 'Khóa học trả phí: quét mã VietQR SePay để kích hoạt tức thì'],
        },
        {
          title: 'Học bài & Trình chiếu Slide tương tác',
          description:
            'Trong giao diện bài học, bạn có thể chỉnh tốc độ video (1x, 1.25x, 1.5x) và bấm nút "Trình chiếu Slide" để xem slide bài giảng tương tác toàn màn hình.',
          keyPoints: [
            'Hệ thống tự động lưu vị trí video bạn đang xem dở',
            'Bấm "Hoàn thành bài học" sau khi học xong để tích lũy % tiến độ',
          ],
        },
      ],
      mockupType: 'teacher-course-slide',
      tip: 'Chế độ Trình chiếu Slide rất thích hợp khi bạn muốn vừa nghe giảng vừa chụp màn hình tóm tắt lý thuyết để ôn tập.',
      actionText: 'Khám phá khóa học',
      actionHref: '/courses',
    },
    {
      id: 'student-practice-exams',
      category: 'Luyện tập & Thi cử',
      title: 'Làm bài tập trắc nghiệm, công thức LaTeX & Thi bấm giờ',
      shortTitle: 'Làm bài tập & Đề thi',
      icon: FileSpreadsheet,
      readTime: '2 phút đọc',
      badge: 'Cần nắm vững',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      tldr: 'Làm bài tập trắc nghiệm hiển thị công thức Toán LaTeX sắc nét, đồng hồ đếm ngược tự động thu bài và xem lời giải chi tiết ngay.',
      steps: [
        {
          title: 'Làm bài tập sau mỗi bài học',
          description:
            'Sau khi xem bài giảng, bấm sang tab "Bài tập" để củng cố kiến thức. Câu hỏi hỗ trợ đầy đủ công thức Toán/Lý/Hóa LaTeX và hình ảnh sơ đồ trực quan.',
        },
        {
          title: 'Tham gia Đề thi chính thức (Timed Exams)',
          description:
            'Đồng hồ đếm ngược hiển thị ở góc trên màn hình. Hệ thống tự động lưu đáp án sau mỗi câu chọn. Khi hết giờ, bài làm sẽ tự động được nộp và chấm điểm tức thì.',
          keyPoints: [
            'Xem bảng xếp loại và phân tích phổ điểm chi tiết',
            'Xem đáp án đúng kèm lời giải từng bước để hiểu rõ bản chất',
          ],
        },
      ],
      mockupType: 'student-exam',
      warning: 'Trong thời gian làm bài thi bấm giờ, hạn chế F5 hoặc tải lại trang để tránh ảnh hưởng đến thời gian đếm ngược.',
      actionText: 'Làm bài tập ngay',
      actionHref: '/courses',
    },
    {
      id: 'student-ai-tutor',
      category: 'Trợ lý Thông minh',
      title: 'Hỏi đáp bài tập 24/7 với Trợ lý AI Tutor & Nhận diện ảnh',
      shortTitle: 'Trợ lý AI Tutor 24/7',
      icon: MessageSquareCode,
      readTime: '2 phút đọc',
      badge: 'Công nghệ AI',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      tldr: 'Gia sư AI đồng hành 24/7, hỗ trợ chụp ảnh đề bài từ điện thoại để giải thích từng bước theo phương pháp tư duy Socratic.',
      steps: [
        {
          title: 'Mở AI Tutor từ bất kỳ trang nào',
          description:
            'Bấm vào mục "AI Tutor" trên thanh menu bên trái hoặc click vào biểu tượng robot nhỏ ở góc dưới màn hình.',
        },
        {
          title: 'Chụp ảnh bài tập hoặc nhập câu hỏi',
          description:
            'Tải ảnh đề bài toán học, hình vẽ hoặc đoạn văn. AI Tutor sẽ nhận diện chữ viết (OCR) và hướng dẫn phương pháp giải từng bước.',
          keyPoints: [
            'Không chỉ đưa đáp án thô, AI giải thích vì sao lại ra kết quả đó',
            'Bạn có thể hỏi đào sâu: "Hãy cho ví dụ tương tự" hoặc "Giải thích công thức này"',
          ],
        },
      ],
      mockupType: 'student-ai-tutor',
      tip: 'Tài khoản PRO và ULTRA được ưu tiên tốc độ phản hồi AI siêu tốc và hỏi đáp không giới hạn số lượng câu hỏi.',
      actionText: 'Trò chuyện với AI Tutor',
      actionHref: '/ai-tutor',
    },
    {
      id: 'student-mistake-notebook',
      category: 'Luyện tập Thông minh',
      title: 'Sổ tay lỗi sai thông minh: Ôn tập ngắt quãng (Spaced Repetition)',
      shortTitle: 'Sổ tay lỗi sai AI',
      icon: Dumbbell,
      readTime: '2 phút đọc',
      badge: 'Độc quyền LMS',
      badgeColor: 'bg-pink-100 text-pink-700 border-pink-200',
      tldr: 'Mọi câu bạn chọn sai trong bài tập hoặc đề thi sẽ được tự động lưu vào Sổ tay lỗi sai và lên lịch ôn tập lại sau 1 ngày, 3 ngày, 7 ngày.',
      steps: [
        {
          title: 'Hệ thống tự động gom câu sai',
          description:
            'Bạn không cần ghi chép thủ công ra vở. Bất kỳ câu hỏi nào làm sai sẽ tự động xuất hiện tại mục "Sổ tay lỗi sai" (/mistake-notebook).',
        },
        {
          title: 'Ôn tập lại theo chu kỳ trí nhớ khoa học',
          description:
            'Sổ tay chia các câu hỏi theo chu kỳ ôn tập: Cần ôn hôm nay ➔ Ôn sau 3 ngày ➔ Đã thuần thục. Khi bạn làm đúng lại câu sai, câu hỏi sẽ được chuyển lên cấp độ ghi nhớ dài hạn.',
        },
      ],
      mockupType: 'student-mistake',
      tip: 'Chỉ cần dành 10 phút mỗi ngày làm lại các câu trong Sổ tay lỗi sai là cách nhanh nhất để không bao giờ mất điểm oan!',
      actionText: 'Mở Sổ tay lỗi sai',
      actionHref: '/mistake-notebook',
    },
    {
      id: 'student-classrooms-lab',
      category: 'Lớp học & Live Call',
      title: 'Tham gia Lớp học của Thầy/Cô & Buổi học trực tiếp Phòng Lab',
      shortTitle: 'Lớp học & Phòng Lab Live',
      icon: FlaskConical,
      readTime: '2 phút đọc',
      badge: 'Tương tác',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      tldr: 'Nhập mã mời để vào lớp học riêng của thầy cô, tham gia phòng Lab tương tác trực tiếp qua Video/Micro và chia sẻ màn hình.',
      steps: [
        {
          title: 'Vào lớp học bằng Mã tham gia (Class Code)',
          description:
            'Vào mục "Lớp học" (/classrooms), bấm "Tham gia bằng mã" và nhập mã code do giáo viên cung cấp để vào lớp nhận bài tập riêng.',
        },
        {
          title: 'Học trực tiếp tại Phòng Lab (Live Call)',
          description:
            'Khi giáo viên phát trực tiếp, truy cập mục "Phòng Lab" (/labs) để tham gia buổi học trực tuyến có âm thanh, hình ảnh và khung chat hỏi đáp.',
        },
      ],
      tip: 'Nên sử dụng tai nghe có mic để chất lượng trao đổi trực tiếp với thầy cô và bạn bè trong Phòng Lab được rõ nét nhất.',
      actionText: 'Vào Phòng Lab',
      actionHref: '/labs',
    },
    {
      id: 'student-gamification',
      category: 'Thành tích & Chứng chỉ',
      title: 'Chuỗi ngày học Streak, Bảng xếp hạng & Nhận Chứng chỉ',
      shortTitle: 'Streak, BXH & Chứng chỉ',
      icon: Trophy,
      readTime: '1.5 phút đọc',
      badge: 'Thưởng',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      tldr: 'Giữ ngọn lửa Streak mỗi ngày để nhận điểm thưởng, đua top Bảng xếp hạng và nhận Chứng chỉ tốt nghiệp điện tử có mã QR.',
      steps: [
        {
          title: 'Thắp sáng ngọn lửa Streak mỗi ngày',
          description:
            'Mỗi ngày học ít nhất 1 bài học hoặc hoàn thành 1 bài tập, chuỗi Streak của bạn sẽ tăng lên 1 ngày. Đạt mốc 7 ngày, 30 ngày để nhận huy hiệu danh giá.',
        },
        {
          title: 'Đua Top BXH & Tải Chứng chỉ',
          description:
            'Xem vị trí của bạn trên Bảng xếp hạng tuần/tháng (/leaderboard). Khi hoàn thành 100% khóa học, vào mục "Chứng chỉ của tôi" (/profile/certificates) để tải bằng khen kèm mã QR xác thực.',
        },
      ],
      actionText: 'Xem Bảng xếp hạng',
      actionHref: '/leaderboard',
    },
    {
      id: 'student-membership',
      category: 'Gói Hội viên & Thanh toán',
      title: 'Nâng cấp Gói PRO / ULTRA & Thanh toán VietQR SePay',
      shortTitle: 'Gói VIP & Thanh toán SePay',
      icon: Sparkles,
      readTime: '2 phút đọc',
      badge: 'VIP',
      badgeColor: 'bg-violet-100 text-violet-700 border-violet-200',
      tldr: 'Nâng cấp tài khoản PRO/ULTRA mở khóa toàn bộ bài giảng chất lượng cao, thanh toán quét mã QR qua SePay tự động kích hoạt trong vài giây.',
      steps: [
        {
          title: 'Chọn gói hội viên phù hợp',
          description:
            'Truy cập trang Bảng giá (/pricing) để chọn gói: PRO Học sinh (luyện thi & AI Tutor nâng cao) hoặc ULTRA (không giới hạn toàn sàn).',
        },
        {
          title: 'Áp dụng mã giảm giá & Quét mã VietQR',
          description:
            'Tại trang thanh toán (/payment/[orderCode]), nhập mã giảm giá (nếu có) để giảm tiền trực tiếp. Mở app ngân hàng bất kỳ (MB, Vietcombank, Techcombank, Momo, v.v.) quét mã QR trên màn hình.',
          keyPoints: [
            'Hệ thống tự động kích hoạt tài khoản trong vòng 3 - 10 giây sau khi chuyển khoản',
            'Không cần chụp biên lai gửi nhân viên hỗ trợ, mọi thứ tự động 100%',
            'Có thể bấm "Hủy đơn hàng" ngay trên trang nếu muốn đổi gói khác',
          ],
        },
      ],
      mockupType: 'student-payment',
      tip: 'Giữ nguyên nội dung chuyển khoản được tạo sẵn trong mã QR để hệ thống nhận diện giao dịch của bạn tức thì.',
      actionText: 'Nâng cấp PRO / ULTRA',
      actionHref: '/pricing',
    },
  ];

  // --------------------------------------------------------------------------
  // DANH SÁCH BÀI HƯỚNG DẪN DÀNH CHO GIÁO VIÊN (TEACHER ARTICLES)
  // --------------------------------------------------------------------------
  const teacherArticles: DocArticle[] = [
    {
      id: 'teacher-verification',
      category: 'Bắt đầu & Xét duyệt',
      title: 'Quy trình Đăng ký & Xét duyệt Giảng viên NQD-LMS',
      shortTitle: 'Đăng ký Giảng viên',
      icon: GraduationCap,
      readTime: '1.5 phút đọc',
      badge: 'Bước 1',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      tldr: 'Nộp thông tin chuyên môn và bằng cấp tại /become-teacher, Admin sẽ xét duyệt trong 12-24h và mở khóa toàn bộ công cụ giảng dạy.',
      steps: [
        {
          title: 'Gửi hồ sơ đăng ký giảng dạy',
          description:
            'Truy cập /become-teacher, điền đầy đủ chuyên môn (Toán, Lý, Hóa...), trường đang công tác và tải lên ảnh chứng chỉ/bằng cấp sư phạm.',
        },
        {
          title: 'Nhận thông báo kích hoạt quyền Giảng viên',
          description:
            'Sau khi được Admin phê duyệt, tài khoản của bạn sẽ xuất hiện thêm các menu: Quản lý Giáo trình, Quản lý Đề thi, Ngân hàng Câu hỏi và Tài chính & Rút tiền.',
        },
      ],
      actionText: 'Đăng ký giảng dạy ngay',
      actionHref: '/become-teacher',
    },
    {
      id: 'teacher-curriculum',
      category: 'Biên soạn & Giáo trình',
      title: 'Tạo Khóa học, phân chia Chương & Bài giảng Slide',
      shortTitle: 'Biên soạn Khóa học & Slide',
      icon: Layers,
      readTime: '2.5 phút đọc',
      badge: 'Cốt lõi',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      tldr: 'Thiết kế khóa học theo cấu trúc phân cấp: Khóa học ➔ Chương (Chapters) ➔ Bài học (Lessons) kèm video, slide trình chiếu và tài liệu PDF.',
      steps: [
        {
          title: 'Khởi tạo thông tin Khóa học',
          description:
            'Vào mục "Quản lý Giáo trình" (/teacher/courses) bấm "+ Tạo khóa học mới". Điền tiêu đề, chọn môn học, tải ảnh bìa (thumbnail) và đặt giá bán (hoặc 0đ nếu miễn phí).',
        },
        {
          title: 'Thêm Chương học & Bài học đa phương tiện',
          description:
            'Tạo các chương theo trình tự khoa học. Trong mỗi bài học, nhúng video bài giảng (YouTube hoặc link trực tiếp), viết tóm tắt lý thuyết bằng Markdown/LaTeX và tích hợp Slide trình chiếu.',
          keyPoints: [
            'Đính kèm bài tập tự luyện và tài liệu ôn tập định dạng PDF',
            'Chuyển trạng thái từ "Bản nháp" sang "Xuất bản" khi hoàn thiện',
          ],
        },
      ],
      mockupType: 'teacher-course-slide',
      actionText: 'Quản lý Giáo trình',
      actionHref: '/teacher/courses',
    },
    {
      id: 'teacher-questions-ai',
      category: 'Ngân hàng Đề & AI',
      title: 'Ngân hàng Câu hỏi thông minh & Sinh câu hỏi bằng AI',
      shortTitle: 'Ngân hàng Câu hỏi & AI',
      icon: HelpCircle,
      readTime: '2 phút đọc',
      badge: 'AI Generator',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      tldr: 'Quản lý kho câu hỏi phân loại theo 4 mức độ nhận thức, hỗ trợ công thức Toán LaTeX và tính năng sinh câu hỏi tự động bằng AI trong 30 giây.',
      steps: [
        {
          title: 'Soạn câu hỏi chuẩn công thức LaTeX',
          description:
            'Tại mục "Ngân hàng Câu hỏi" (/teacher/questions), bạn có thể soạn câu hỏi trắc nghiệm kèm công thức toán học sắc nét (ví dụ: $\\sqrt{x^2+1}$), đính kèm hình vẽ hình học hoặc tệp nghe mp3.',
        },
        {
          title: 'Sử dụng AI Generator để sinh câu hỏi siêu tốc',
          description:
            'Chỉ cần nhập chủ đề (ví dụ: "Định lý Pytago lớp 8") hoặc dán một đoạn văn bản bài học, AI sẽ tự động sinh trọn bộ câu hỏi, 4 phương án, đáp án đúng và lời giải chi tiết.',
        },
      ],
      mockupType: 'teacher-ai-question',
      tip: 'Bạn có thể chỉnh sửa lại nội dung do AI sinh ra trước khi lưu vào ngân hàng câu hỏi chính thức.',
      actionText: 'Mở Ngân hàng Câu hỏi',
      actionHref: '/teacher/questions',
    },
    {
      id: 'teacher-exams-matrix',
      category: 'Khảo thí & Tổ chức Thi',
      title: 'Tạo Đề thi Bấm giờ, Trộn đề theo Ma trận & Chấm tự động',
      shortTitle: 'Quản lý Đề thi & Khảo thí',
      icon: FileSpreadsheet,
      readTime: '2 phút đọc',
      badge: 'Tự động chấm',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      tldr: 'Thiết lập thời gian làm bài, tỷ lệ ma trận nhận thức (Nhận biết, Thông hiểu, Vận dụng), tự động trộn thứ tự câu hỏi và xem phổ điểm học sinh.',
      steps: [
        {
          title: 'Cấu hình thông số Đề thi',
          description:
            'Vào mục "Quản lý Đề thi" (/teacher/exams) bấm "Tạo đề thi mới". Đặt thời gian làm bài (ví dụ: 45 phút), ngày mở/đóng đề và số lần làm bài tối đa.',
        },
        {
          title: 'Nạp câu hỏi từ Ngân hàng hoặc Trộn ma trận',
          description:
            'Chọn câu hỏi cụ thể từ ngân hàng hoặc thiết lập ma trận độ khó (ví dụ: 40% Nhận biết, 30% Thông hiểu, 20% Vận dụng, 10% Vận dụng cao) để hệ thống tự động bốc đề ngẫu nhiên cho từng học sinh.',
        },
      ],
      actionText: 'Quản lý Đề thi',
      actionHref: '/teacher/exams',
    },
    {
      id: 'teacher-classes-lab',
      category: 'Lớp học & Trực tuyến',
      title: 'Quản lý Lớp học & Dạy trực tiếp Phòng Lab Live Call',
      shortTitle: 'Lớp học & Phòng Lab Live',
      icon: Presentation,
      readTime: '2 phút đọc',
      badge: 'Live Stream',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      tldr: 'Tạo lớp học, cung cấp mã mời cho học sinh, mở phòng Lab dạy trực tiếp có video, âm thanh, chia sẻ màn hình không cần cài Zoom.',
      steps: [
        {
          title: 'Tạo lớp học & Cấp mã mời',
          description:
            'Tại mục "Lớp học" (/classrooms), tạo lớp và gửi mã Class Code cho học sinh. Bạn có thể giao bài tập và đề thi độc quyền cho lớp này.',
        },
        {
          title: 'Giảng dạy trực tiếp tại Phòng Lab (/labs)',
          description:
            'Bật camera và micro để bắt đầu buổi giảng trực tiếp. Bạn có thể chia sẻ toàn màn hình bài thuyết trình PowerPoint hoặc PDF và trao đổi với học sinh qua khung chat thời gian thực.',
        },
      ],
      actionText: 'Quản lý Lớp học',
      actionHref: '/classrooms',
    },
    {
      id: 'teacher-finance-payout',
      category: 'Doanh thu & Rút tiền',
      title: 'Thống kê Doanh thu & Quy trình Gửi lệnh Rút tiền (Payout)',
      shortTitle: 'Doanh thu & Rút tiền',
      icon: DollarSign,
      readTime: '2 phút đọc',
      badge: 'Thu nhập',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      tldr: 'Theo dõi doanh số bán khóa học minh bạch và gửi yêu cầu rút tiền về tài khoản ngân hàng chính chủ qua /teacher/finance.',
      steps: [
        {
          title: 'Xem báo cáo doanh thu & Số dư khả dụng',
          description:
            'Trang "Tài chính & Rút tiền" (/teacher/finance) hiển thị chi tiết tổng doanh số, số dư khả dụng thực nhận và lịch sử học viên đăng ký.',
        },
        {
          title: 'Gửi yêu cầu Rút tiền (Payout)',
          description:
            'Nhập số tiền muốn rút và thông tin tài khoản ngân hàng (Tên ngân hàng, Số tài khoản, Chủ tài khoản). Admin sẽ đối soát và giải ngân trong 24-48 giờ làm việc.',
        },
      ],
      mockupType: 'teacher-finance',
      warning: 'Vui lòng kiểm tra chính xác số tài khoản và tên chủ tài khoản ngân hàng thụ hưởng trước khi bấm xác nhận rút tiền.',
      actionText: 'Quản lý Tài chính',
      actionHref: '/teacher/finance',
    },
  ];

  // --------------------------------------------------------------------------
  // DANH SÁCH BÀI HƯỚNG DẪN DÀNH CHO ADMIN (ADMIN ARTICLES)
  // --------------------------------------------------------------------------
  const adminArticles: DocArticle[] = [
    {
      id: 'admin-dashboard-overview',
      category: 'Quản trị Hệ thống',
      title: 'Tổng quan Vận hành Nền tảng & Dashboard Quản trị',
      shortTitle: 'Dashboard Quản trị',
      icon: BarChart3,
      readTime: '1.5 phút đọc',
      badge: 'Admin',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      tldr: 'Theo dõi tổng số người dùng, khóa học hoạt động, biểu đồ doanh thu SePay và sức khỏe hệ thống tại /admin.',
      steps: [
        {
          title: 'Giám sát chỉ số theo thời gian thực',
          description:
            'Truy cập /admin để xem số lượng học sinh đang hoạt động, số khóa học mới tạo và doanh thu theo ngày/tháng.',
        },
      ],
      actionText: 'Vào Admin Portal',
      actionHref: '/admin',
    },
    {
      id: 'admin-users-management',
      category: 'Tài khoản & Phân quyền',
      title: 'Quản lý Người dùng & Gán quyền Vai trò (Roles)',
      shortTitle: 'Người dùng & Phân quyền',
      icon: Users,
      readTime: '1.5 phút đọc',
      badge: 'Roles',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      tldr: 'Tìm kiếm học sinh, giáo viên, khóa/mở tài khoản và phân quyền vai trò ROLE_STUDENT, ROLE_TEACHER, ROLE_ADMIN.',
      steps: [
        {
          title: 'Điều chỉnh quyền hạn người dùng',
          description:
            'Tại /admin/users và /admin/roles, tìm kiếm theo email hoặc tên để cấp quyền Giảng viên hoặc Quản trị viên.',
        },
      ],
      actionText: 'Quản lý Người dùng',
      actionHref: '/admin/users',
    },
    {
      id: 'admin-teacher-approvals',
      category: 'Duyệt Giảng viên',
      title: 'Xét duyệt Hồ sơ Giáo viên & Bằng cấp Sư phạm',
      shortTitle: 'Duyệt hồ sơ Giáo viên',
      icon: ShieldCheck,
      readTime: '1.5 phút đọc',
      badge: 'Xét duyệt',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      tldr: 'Kiểm tra thông tin bằng cấp của ứng viên và bấm Phê duyệt để kích hoạt quyền ROLE_TEACHER kèm thông báo.',
      steps: [
        {
          title: 'Quy trình kiểm duyệt minh chứng',
          description:
            'Tại /admin/teacher-verifications, bấm xem chi tiết hồ sơ, xem ảnh bằng cấp và bấm "Phê duyệt" hoặc "Từ chối" kèm lý do phản hồi.',
        },
      ],
      actionText: 'Duyệt hồ sơ giáo viên',
      actionHref: '/admin/teacher-verifications',
    },
    {
      id: 'admin-finance-reconciliation',
      category: 'Tài chính & SePay',
      title: 'Đối soát Thanh toán SePay VietQR & Duyệt lệnh Payout',
      shortTitle: 'Tài chính & Payout SePay',
      icon: DollarSign,
      readTime: '2 phút đọc',
      badge: 'SePay VietQR',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      tldr: 'Đối chiếu đơn hàng SePay VietQR tự động, xử lý thủ công các đơn sai cú pháp và duyệt chuyển khoản payout cho giáo viên.',
      steps: [
        {
          title: 'Đối soát đơn hàng SePay',
          description:
            'Theo dõi mã đơn hàng, số tiền và mã giao dịch ngân hàng tại /admin/finance. Mọi thanh toán khớp lệnh sẽ tự động nâng cấp gói cho người dùng.',
        },
        {
          title: 'Phê duyệt lệnh rút tiền cho giáo viên',
          description:
            'Kiểm tra yêu cầu rút tiền, thực hiện chuyển khoản đến số tài khoản giáo viên cung cấp và bấm "Đã xử lý".',
        },
      ],
      actionText: 'Quản lý Tài chính Admin',
      actionHref: '/admin/finance',
    },
    {
      id: 'admin-coupons-promos',
      category: 'Khuyến mãi & Marketing',
      title: 'Tạo Mã Giảm giá (Coupons) & Chiến dịch Khuyến mãi',
      shortTitle: 'Mã giảm giá & Khuyến mãi',
      icon: Ticket,
      readTime: '1.5 phút đọc',
      badge: 'Marketing',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      tldr: 'Tạo mã voucher giảm theo % hoặc tiền mặt cho gói PRO, ULTRA và khóa học tại /admin/coupons.',
      steps: [
        {
          title: 'Tạo mã voucher giảm giá',
          description:
            'Tại /admin/coupons, bấm "Tạo mã mới", thiết lập mã code (ví dụ: SIEUHE2026), mức chiết khấu và thời hạn hiệu lực.',
        },
      ],
      actionText: 'Quản lý Coupons',
      actionHref: '/admin/coupons',
    },
  ];

  // Articles list according to active role
  const currentArticles = useMemo(() => {
    if (activeRole === 'STUDENT') return studentArticles;
    if (activeRole === 'TEACHER') return teacherArticles;
    return adminArticles;
  }, [activeRole]);

  // Group current articles by category for clean left sidebar
  const groupedArticles = useMemo(() => {
    const groups: Record<string, DocArticle[]> = {};
    currentArticles.forEach((art) => {
      if (!groups[art.category]) {
        groups[art.category] = [];
      }
      groups[art.category].push(art);
    });
    return groups;
  }, [currentArticles]);

  // Search filtered articles
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const all = [...studentArticles, ...teacherArticles, ...adminArticles];
    return all.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.tldr.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.steps.some((s) => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Active article object
  const activeArticle = useMemo(() => {
    const found = currentArticles.find((a) => a.id === activeArticleId);
    return found || currentArticles[0];
  }, [currentArticles, activeArticleId]);

  // Previous and next article navigation
  const currentIndex = currentArticles.findIndex((a) => a.id === activeArticle.id);
  const prevArticle = currentIndex > 0 ? currentArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < currentArticles.length - 1 ? currentArticles[currentIndex + 1] : null;

  // Handle switching role
  const handleRoleSwitch = (role: RoleTab) => {
    setActiveRole(role);
    setUserSwitchedRole(true);
    setSearchQuery('');
    setFeedbackGiven(null);
    if (role === 'STUDENT') setActiveArticleId('student-quickstart');
    else if (role === 'TEACHER') setActiveArticleId('teacher-curriculum');
    else setActiveArticleId('admin-dashboard-overview');
  };

  const handleSelectArticle = (id: string, role?: RoleTab) => {
    if (role && role !== activeRole) {
      setActiveRole(role);
      setUserSwitchedRole(true);
    }
    setActiveArticleId(id);
    setSearchQuery('');
    setFeedbackGiven(null);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER / APP BAR (Modern Docs Style)                    */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              title="Danh mục hướng dẫn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                📖
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-base leading-tight block">
                  Trung tâm Hướng dẫn
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                  NQD-LMS Docs & Guides
                </span>
              </div>
            </Link>
          </div>

          {/* Role Segmented Switcher (Centered) */}
          <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => handleRoleSwitch('STUDENT')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'STUDENT'
                  ? 'bg-white text-emerald-800 shadow-xs scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Học sinh</span>
              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded-md text-[10px]">
                {studentArticles.length}
              </span>
            </button>

            <button
              onClick={() => handleRoleSwitch('TEACHER')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'TEACHER'
                  ? 'bg-white text-indigo-800 shadow-xs scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Giáo viên</span>
              <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-md text-[10px]">
                {teacherArticles.length}
              </span>
            </button>

            {(isAdmin || activeRole === 'ADMIN') && (
              <button
                onClick={() => handleRoleSwitch('ADMIN')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeRole === 'ADMIN'
                    ? 'bg-white text-purple-800 shadow-xs scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Quản trị viên</span>
              </button>
            )}
          </div>

          {/* Quick Search Input with Dropdown */}
          <div className="relative w-full max-w-[280px] sm:max-w-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm hướng dẫn nhanh..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 border border-transparent focus:border-slate-300 focus:outline-hidden transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Search Results Popup */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in duration-100 max-h-96 overflow-y-auto">
                <div className="p-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Kết quả tìm kiếm ({filteredSearchResults.length})
                </div>
                {filteredSearchResults.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500 text-center">
                    Không tìm thấy bài viết nào chứa "{searchQuery}".
                  </p>
                ) : (
                  filteredSearchResults.map((res) => (
                    <button
                      key={res.id}
                      onClick={() =>
                        handleSelectArticle(
                          res.id,
                          studentArticles.some((x) => x.id === res.id)
                            ? 'STUDENT'
                            : teacherArticles.some((x) => x.id === res.id)
                            ? 'TEACHER'
                            : 'ADMIN'
                        )
                      }
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition flex items-start gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5 group-hover:bg-emerald-50 group-hover:text-emerald-700">
                        <res.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {res.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{res.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{res.tldr}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Role Switcher Bar */}
        <div className="sm:hidden px-4 pb-3 flex items-center justify-between border-t border-slate-100 pt-2 gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Vai trò:</span>
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <button
              onClick={() => handleRoleSwitch('STUDENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                activeRole === 'STUDENT'
                  ? 'bg-[#83C75D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              🎓 Học sinh
            </button>
            <button
              onClick={() => handleRoleSwitch('TEACHER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                activeRole === 'TEACHER'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              👨‍🏫 Giáo viên
            </button>
            {isAdmin && (
              <button
                onClick={() => handleRoleSwitch('ADMIN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  activeRole === 'ADMIN'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                🛡️ Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN WORKSPACE CONTAINER (GitBook / Stripe Docs 3-Panel)   */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-8">
        {/* ----------------------------------------------------------- */}
        {/* LEFT SIDEBAR: TOPIC & ARTICLE TREE NAVIGATION               */}
        {/* ----------------------------------------------------------- */}
        <aside
          className={`lg:w-72 shrink-0 ${
            mobileMenuOpen
              ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block'
              : 'hidden lg:block'
          }`}
        >
          {/* Mobile drawer header */}
          {mobileMenuOpen && (
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
              <span className="font-extrabold text-base text-slate-900">Danh mục hướng dẫn</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="sticky top-24 space-y-6">
            {/* Role Header Banner Badge */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                    activeRole === 'STUDENT'
                      ? 'bg-emerald-100 text-[#4e8231]'
                      : activeRole === 'TEACHER'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {activeRole === 'STUDENT' ? '🎓' : activeRole === 'TEACHER' ? '👨‍🏫' : '🛡️'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Đang xem cẩm nang
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-slate-900">
                    {activeRole === 'STUDENT'
                      ? 'Dành cho Học sinh'
                      : activeRole === 'TEACHER'
                      ? 'Dành cho Giáo viên'
                      : 'Dành cho Quản trị viên'}
                  </h3>
                </div>
              </div>

              {/* Notice if role auto-detected */}
              {isTeacher && activeRole === 'TEACHER' && (
                <p className="text-[11px] text-indigo-700 font-medium mt-2 bg-indigo-50/80 p-2 rounded-xl">
                  ✨ Tự động nhận diện tài khoản Giáo viên.
                </p>
              )}
            </div>

            {/* Categorized Menu Tree */}
            <nav className="space-y-5">
              {Object.entries(groupedArticles).map(([categoryName, articles]) => (
                <div key={categoryName} className="space-y-1">
                  <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {categoryName}
                  </p>
                  <div className="space-y-0.5">
                    {articles.map((art) => {
                      const isActive = art.id === activeArticle.id;
                      const Icon = art.icon;
                      return (
                        <button
                          key={art.id}
                          onClick={() => handleSelectArticle(art.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
                            isActive
                              ? activeRole === 'STUDENT'
                                ? 'bg-emerald-100/80 text-[#3b6d21] font-bold shadow-2xs'
                                : activeRole === 'TEACHER'
                                ? 'bg-indigo-100 text-indigo-900 font-bold shadow-2xs'
                                : 'bg-purple-100 text-purple-900 font-bold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                                isActive
                                  ? activeRole === 'STUDENT'
                                    ? 'text-[#4e8231]'
                                    : 'text-indigo-600'
                                  : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{art.shortTitle}</span>
                          </div>
                          {art.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border shrink-0 ${
                                isActive
                                  ? 'bg-white/80 border-transparent text-slate-800'
                                  : art.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {art.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Quick Helper Links */}
            <div className="pt-4 border-t border-slate-200/80 space-y-2">
              <Link
                href="/ai-tutor"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
              >
                <Bot className="w-4 h-4 text-purple-600" />
                <span>Hỏi trực tiếp AI Tutor</span>
              </Link>
              {activeRole === 'STUDENT' && !isTeacher && (
                <Link
                  href="/become-teacher"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Đăng ký làm Giảng viên</span>
                </Link>
              )}
            </div>
          </div>
        </aside>

        {/* ----------------------------------------------------------- */}
        {/* CENTER / MAIN CONTENT: EDITORIAL ARTICLE READER             */}
        {/* ----------------------------------------------------------- */}
        <main className="flex-1 min-w-0 max-w-3xl">
          <article className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-10">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-4">
              <span>Hướng dẫn</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-600 font-semibold">{activeArticle.category}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-900 font-bold truncate">{activeArticle.shortTitle}</span>
            </nav>

            {/* Article Header */}
            <div className="border-b border-slate-100 pb-6 mb-8">
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    activeArticle.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {activeArticle.category}
                </span>
                <span className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {activeArticle.readTime}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {activeArticle.title}
              </h1>

              {/* Action Link button right at top if available */}
              {activeArticle.actionHref && (
                <div className="mt-4">
                  <Link
                    href={activeArticle.actionHref}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition"
                  >
                    <span>{activeArticle.actionText || 'Trải nghiệm tính năng ngay'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* TL;DR Quick Summary Box (30-second skim) */}
            <div className="p-4.5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 border border-emerald-200/80 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-2xs">
                  ⚡
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950 mb-1">
                    Tóm tắt nhanh (TL;DR)
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {activeArticle.tldr}
                  </p>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------- */}
            {/* VISUAL MOCKUP PREVIEW (Dựa trên loại bài viết)          */}
            {/* ------------------------------------------------------- */}
            {activeArticle.mockupType && activeArticle.mockupType !== 'none' && (
              <div className="mb-10 rounded-2xl border border-slate-200 bg-slate-900 text-white p-5 shadow-lg overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                    Mô phỏng Giao diện Trực quan
                  </span>
                  <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded text-emerald-300 font-mono">
                    Live UI Preview
                  </span>
                </div>

                {/* 1. MOCKUP: Bài thi trắc nghiệm Toán LaTeX */}
                {activeArticle.mockupType === 'student-exam' && (
                  <div className="space-y-4 font-sans text-slate-900">
                    <div className="bg-white p-5 rounded-xl shadow-xs">
                      <div className="flex items-center justify-between mb-3 text-xs border-b border-slate-100 pb-2">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          Câu hỏi 1 / 20 • Toán học 10
                        </span>
                        <span className="flex items-center gap-1 font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                          ⏱️ 44:52
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mb-3">
                        Tìm tập nghiệm thực của phương trình: $x^2 - 5x + 6 = 0$
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                        <div className="p-2.5 rounded-lg border-2 border-emerald-500 bg-emerald-50/70 text-emerald-900 flex items-center justify-between">
                          <span>{'A. S = {2; 3}'}</span>
                          <Check className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                          {'B. S = {-2; -3}'}
                        </div>
                        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                          {'C. S = {1; 6}'}
                        </div>
                        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                          {'D. S = ∅ (Vô nghiệm)'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MOCKUP: Trợ lý AI Tutor Chat */}
                {activeArticle.mockupType === 'student-ai-tutor' && (
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex items-end justify-end gap-2">
                      <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-br-none max-w-sm">
                        <p className="font-medium">
                          "Thầy ơi giải thích giúp em tại sao trọng lực $P = m \cdot g$ lại có chiều luôn hướng về tâm Trái Đất?"
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        Em
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                        AI
                      </div>
                      <div className="bg-slate-800 text-slate-100 p-3.5 rounded-2xl rounded-tl-none max-w-md border border-slate-700 space-y-1.5 leading-relaxed">
                        <p className="font-bold text-emerald-400">Chào bạn! Hãy cùng suy luận nhé:</p>
                        <p>
                          Trọng lực là lực hút của Trái Đất tác dụng lên vật. Theo định luật vạn vật hấp dẫn của Newton, Trái Đất có khối lượng khổng lồ tập trung tại tâm, nên lực hút luôn có phương thẳng đứng hướng thẳng về phía tâm!
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {'Công thức: P = m · g (với g ≈ 9.8 m/s²)'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MOCKUP: Sổ tay lỗi sai Spaced Repetition */}
                {activeArticle.mockupType === 'student-mistake' && (
                  <div className="font-sans text-xs">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>CHU KỲ LẶP LẠI NGẮT QUÃNG (SPACED REPETITION)</span>
                        <span className="text-emerald-400">Hiệu quả +85% ghi nhớ</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200">
                          <span className="font-bold block text-sm text-rose-300">Giai đoạn 1</span>
                          <span className="text-[11px] mt-0.5 block">Làm sai bài thi</span>
                          <span className="text-[10px] text-slate-400 mt-2 block">Ôn lại sau 24h</span>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200">
                          <span className="font-bold block text-sm text-amber-300">Giai đoạn 2</span>
                          <span className="text-[11px] mt-0.5 block">Khắc phục 50%</span>
                          <span className="text-[10px] text-slate-400 mt-2 block">Ôn lại sau 3 ngày</span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200">
                          <span className="font-bold block text-sm text-emerald-300">Giai đoạn 3</span>
                          <span className="text-[11px] mt-0.5 block">Thuần thục 100%</span>
                          <span className="text-[10px] text-slate-400 mt-2 block">Ghi nhớ dài hạn</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. MOCKUP: SePay VietQR Payment */}
                {activeArticle.mockupType === 'student-payment' && (
                  <div className="bg-white p-4 rounded-xl text-slate-900 font-sans text-xs">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 text-2xl font-bold">
                          📱QR
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">Thanh toán tự động qua VietQR</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Cổng SePay • Quét bằng MB, VCB, Techcombank, Momo...
                          </p>
                          <span className="inline-block mt-1 font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                            Trạng thái: Tự động kích hoạt trong 5 giây
                          </span>
                        </div>
                      </div>
                      <div className="text-right sm:border-l sm:pl-4 border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Số tiền thanh toán
                        </span>
                        <span className="text-base font-black text-indigo-700">199.000 đ</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. MOCKUP: Giáo viên AI Generator câu hỏi */}
                {activeArticle.mockupType === 'teacher-ai-question' && (
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 font-sans text-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Trợ lý AI Soạn Đề</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 text-slate-300 font-mono text-[11px]">
                      Chủ đề: "Sinh 5 câu hỏi trắc nghiệm Toán 10: Phương trình đường thẳng trong mặt phẳng Oxy"
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-emerald-400 pt-1">
                      <span>✓ Đã sinh 5 câu hỏi kèm lời giải LaTeX</span>
                      <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-bold">
                        Độ chính xác cao
                      </span>
                    </div>
                  </div>
                )}

                {/* 6. MOCKUP: Giáo viên Rút tiền Payout */}
                {activeArticle.mockupType === 'teacher-finance' && (
                  <div className="bg-white p-4 rounded-xl text-slate-900 font-sans text-xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Số dư khả dụng
                        </span>
                        <p className="text-lg font-black text-emerald-700">5.250.000 đ</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        Sẵn sàng rút
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1">
                      <span>Tài khoản thụ hưởng: MB Bank - 0987654321</span>
                      <span className="font-bold text-indigo-600">Đã giải ngân</span>
                    </div>
                  </div>
                )}

                {/* 7. MOCKUP: Chế độ Slide bài giảng */}
                {activeArticle.mockupType === 'teacher-course-slide' && (
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 font-sans text-xs space-y-3">
                    <div className="aspect-video bg-slate-950 rounded-lg flex items-center justify-center relative overflow-hidden border border-slate-700">
                      <div className="text-center p-4">
                        <span className="text-emerald-400 font-bold text-sm block">
                          Bài 1: Khái niệm Vectơ & Phép toán Cộng Trừ
                        </span>
                        <span className="text-slate-400 text-xs mt-1 block">
                          Slide 3 / 12 • Tương tác trực tiếp trên trình duyệt
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded text-[10px] text-white">
                        <span>Trình chiếu toàn màn hình</span>
                        <ExternalLink className="w-3 h-3 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* STEP-BY-STEP NUMBERED WALKTHROUGH                       */}
            {/* ------------------------------------------------------- */}
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                Các bước thực hiện chi tiết
              </h3>

              {activeArticle.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {step.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                      {step.description}
                    </p>

                    {step.keyPoints && step.keyPoints.length > 0 && (
                      <ul className="mt-3 space-y-1.5 pl-1 text-xs text-slate-600">
                        {step.keyPoints.map((kp, kIdx) => (
                          <li key={kIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Tip Callout box */}
            {activeArticle.tip && (
              <div className="mt-8 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs sm:text-sm flex items-start gap-3 leading-relaxed">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold text-amber-950">Mẹo thông minh: </strong>
                  {activeArticle.tip}
                </div>
              </div>
            )}

            {/* Warning Callout box */}
            {activeArticle.warning && (
              <div className="mt-4 p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-rose-950 text-xs sm:text-sm flex items-start gap-3 leading-relaxed">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold text-rose-950">Lưu ý quan trọng: </strong>
                  {activeArticle.warning}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* PREV / NEXT NAVIGATION BUTTONS                          */}
            {/* ------------------------------------------------------- */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              {prevArticle ? (
                <button
                  onClick={() => handleSelectArticle(prevArticle.id)}
                  className="w-full sm:w-auto flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Bài trước
                    </span>
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">
                      {prevArticle.shortTitle}
                    </span>
                  </div>
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextArticle && (
                <button
                  onClick={() => handleSelectArticle(nextArticle.id)}
                  className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 px-4 py-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-right transition cursor-pointer"
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Bài tiếp theo
                    </span>
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">
                      {nextArticle.shortTitle}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* Feedback Widget (Was this page helpful?) */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span className="font-medium">Bài hướng dẫn này có hữu ích cho bạn không?</span>
              {feedbackGiven ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCheck className="w-4 h-4" /> Cảm ơn bạn đã đóng góp phản hồi!
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFeedbackGiven('yes')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Hữu ích</span>
                  </button>
                  <button
                    onClick={() => setFeedbackGiven('no')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Chưa rõ</span>
                  </button>
                </div>
              )}
            </div>
          </article>
        </main>

        {/* ----------------------------------------------------------- */}
        {/* RIGHT SIDEBAR (On this page / Quick Tips Widget)            */}
        {/* ----------------------------------------------------------- */}
        <aside className="hidden xl:block w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* On this page summary */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Trong bài viết này
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Tóm tắt nhanh (TL;DR)</span>
                </div>
                {activeArticle.mockupType && activeArticle.mockupType !== 'none' && (
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <span>Mô phỏng Giao diện</span>
                  </div>
                )}
                {activeArticle.steps.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-600 pl-3">
                    <span className="text-[10px] text-slate-400 font-mono">0{i + 1}.</span>
                    <span className="line-clamp-1">{st.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Direct Help Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block mb-1">
                Gia sư 24/7
              </span>
              <h4 className="text-xs font-black leading-snug">Vẫn còn điều chưa rõ?</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Trợ lý AI Tutor giải đáp tức thì mọi bài tập hoặc thắc mắc về hệ thống.
              </p>
              <Link
                href="/ai-tutor"
                className="mt-3.5 inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition"
              >
                <span>Hỏi AI Tutor ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
