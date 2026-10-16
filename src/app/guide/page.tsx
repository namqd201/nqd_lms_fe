'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  BarChart3,
  Dumbbell,
  MessageSquareCode,
  Trophy,
  Award,
  CreditCard,
  Flame,
  ShieldCheck,
  Users,
  Settings,
  Presentation,
  FlaskConical,
  Compass,
  ArrowRight,
  ExternalLink,
  Laptop,
  Check,
  Info,
  AlertTriangle,
  Lightbulb,
  QrCode,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  Percent,
  Play,
  RotateCcw,
} from 'lucide-react';

type RoleTab = 'STUDENT' | 'TEACHER' | 'ADMIN';

interface StepItem {
  title: string;
  desc: string;
  details?: string[];
  tips?: string;
  alert?: string;
}

interface ChapterItem {
  id: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  actionText?: string;
  actionHref?: string;
  actionColor?: string;
  steps: StepItem[];
}

interface FaqItem {
  question: string;
  answer: string;
}

export default function GuidePage() {
  const { user, isAuthenticated, isTeacherPro, isPro, isUltra } = useAuth();

  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN');
  const isTeacher = user?.roles?.some((r) => r === 'TEACHER' || r === 'ROLE_TEACHER');

  // Role auto-detection:
  // If Teacher -> default to TEACHER tab
  // If Admin -> default to TEACHER (or ADMIN)
  // Else (Student / Guest) -> default to STUDENT tab
  const [activeTab, setActiveTab] = useState<RoleTab>('STUDENT');
  const [userOverridden, setUserOverridden] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [expandedFaq, setExpandedFaq] = useState<Record<string, boolean>>({});

  // Auto-set tab based on role when user data loads (unless user already clicked another tab)
  useEffect(() => {
    if (!userOverridden) {
      if (isAdmin) {
        setActiveTab('TEACHER');
      } else if (isTeacher) {
        setActiveTab('TEACHER');
      } else {
        setActiveTab('STUDENT');
      }
    }
  }, [isTeacher, isAdmin, userOverridden]);

  // Handle manual tab switch
  const handleTabSwitch = (tab: RoleTab) => {
    setActiveTab(tab);
    setUserOverridden(true);
    setSearchQuery('');
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleFaq = (idx: string) => {
    setExpandedFaq((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // -------------------------------------------------------------
  // DỮ LIỆU HƯỚNG DẪN HỌC SINH (STUDENT DATA)
  // -------------------------------------------------------------
  const studentChapters: ChapterItem[] = [
    {
      id: 'student-start',
      badge: 'Khởi đầu',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Compass,
      title: 'Chương 1: Đăng nhập & Thiết lập Hồ sơ Cá nhân',
      subtitle: 'Bắt đầu hành trình học tập thông minh chỉ với 1 cú click chuột qua Google One-Click.',
      actionText: 'Cập nhật hồ sơ',
      actionHref: '/profile',
      actionColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      steps: [
        {
          title: 'Đăng nhập nhanh không cần mật khẩu',
          desc: 'Bấm nút "Đăng nhập Google" ở góc trên bên phải. Hệ thống kết nối an toàn với Google Account của bạn, không cần tạo mật khẩu rườm rà.',
          details: [
            'Thông tin email và ảnh đại diện được đồng bộ tự động.',
            'Bảo mật 2 lớp an toàn chuẩn Google OAuth2.',
          ],
        },
        {
          title: 'Cập nhật thông tin & Khối lớp học',
          desc: 'Truy cập mục "Hồ sơ cá nhân" để thiết lập tên đầy đủ và khối lớp bạn đang theo học (Tiểu học lớp 1-5, THCS lớp 6-9, THPT lớp 10-12 hoặc Đại học).',
          details: [
            'Tên đầy đủ sẽ được in chính xác trên Chứng chỉ hoàn thành khóa học (Certificate).',
            'Chọn đúng khối lớp giúp hệ thống gợi ý bài giảng và đề thi phù hợp nhất.',
          ],
          tips: 'Bạn có thể thay đổi số điện thoại và cập nhật ảnh đại diện bất kỳ lúc nào tại trang Hồ sơ.',
        },
      ],
    },
    {
      id: 'student-course',
      badge: 'Bài giảng',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: BookOpen,
      title: 'Chương 2: Khám phá Khóa học & Bài học Tương tác',
      subtitle: 'Tham gia học tập với video HD, chế độ trình chiếu tương tác (Slide Mode) và tài liệu đính kèm.',
      actionText: 'Khám phá khóa học',
      actionHref: '/courses',
      actionColor: 'bg-[#83C75D] hover:bg-[#72b44e] text-white',
      steps: [
        {
          title: 'Tìm kiếm & Đăng ký Khóa học',
          desc: 'Truy cập mục "Khóa học" từ thanh menu bên trái. Bạn có thể lọc bài học theo Môn học (Toán, Lý, Hóa, Văn, Anh, Sinh, Sử, Địa, Tin), theo khối lớp hoặc giảng viên yêu thích.',
          details: [
            'Khóa học miễn phí: Bấm "Bắt đầu học ngay" để vào học tức thì.',
            'Khóa học trả phí: Bấm "Mua khóa học" để thanh toán quét mã QR qua VietQR SePay tiện lợi.',
          ],
        },
        {
          title: 'Trải nghiệm học bài & Chế độ Slide tương tác',
          desc: 'Mỗi bài học được tổ chức khoa học gồm video bài giảng, tóm tắt lý thuyết bằng Markdown/LaTeX, và nút "Trình chiếu Slide".',
          details: [
            'Xem bài giảng video với tốc độ tùy chỉnh (1x, 1.25x, 1.5x, 2x).',
            'Sử dụng nút "Trình chiếu Slide" để hiển thị slide toàn màn hình, ghi chú nhanh bài học.',
            'Tải file tài liệu, bài tập về nhà đính kèm ở chân trang bài học.',
          ],
          tips: 'Sau khi xem xong bài học, hãy bấm "Hoàn thành bài học" để tích lũy % tiến độ khóa học!',
        },
      ],
    },
    {
      id: 'student-class-lab',
      badge: 'Lớp học & Live',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: FlaskConical,
      title: 'Chương 3: Tham gia Lớp học & Phòng Lab Trực tiếp',
      subtitle: 'Kết nối trực tuyến cùng thầy cô và bạn bè, tham gia buổi học Live Call trực quan.',
      actionText: 'Vào Phòng Lab',
      actionHref: '/labs',
      actionColor: 'bg-rose-600 hover:bg-rose-700 text-white',
      steps: [
        {
          title: 'Tham gia Lớp học của Thầy/Cô (Classrooms)',
          desc: 'Truy cập mục "Lớp học" (/classrooms). Bấm nút "Tham gia bằng mã" và nhập mã mời (Code) do giáo viên của bạn cung cấp.',
          details: [
            'Xem danh sách bạn cùng lớp và bảng tin thông báo của lớp.',
            'Nhận bài tập riêng và đề thi thử được giao độc quyền cho lớp.',
          ],
        },
        {
          title: 'Học trực tuyến tại Phòng Lab (Live Call)',
          desc: 'Mục "Phòng Lab" (/labs) mang đến không gian tương tác trực tiếp qua Video & Âm thanh chất lượng cao.',
          details: [
            'Bật/tắt Micro và Camera linh hoạt khi phát biểu bài.',
            'Chia sẻ màn hình và xem bài giảng trực tiếp của giáo viên.',
            'Khung chat phòng Lab cho phép gửi câu hỏi và nhận câu trả lời ngay trong buổi học.',
          ],
          tips: 'Hãy chuẩn bị tai nghe có micro để buổi học trực tiếp đạt chất lượng âm thanh tốt nhất.',
        },
      ],
    },
    {
      id: 'student-practice-exam',
      badge: 'Luyện tập & Thi',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      icon: FileSpreadsheet,
      title: 'Chương 4: Luyện tập Bài tập & Tham gia Đề thi Bấm giờ',
      subtitle: 'Củng cố kiến thức với đề thi trắc nghiệm, công thức toán LaTeX và tự động chấm điểm.',
      actionText: 'Làm bài tập ngay',
      actionHref: '/courses',
      actionColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      steps: [
        {
          title: 'Làm bài tập trắc nghiệm & Tự luận',
          desc: 'Sau mỗi bài học, hãy làm bài tập kiểm tra để đánh giá mức độ hiểu bài. Hệ thống hỗ trợ đa dạng định dạng câu hỏi:',
          details: [
            'Trắc nghiệm một lựa chọn & nhiều lựa chọn.',
            'Câu hỏi công thức Toán/Lý/Hóa hiển thị bằng LaTeX sắc nét.',
            'Câu hỏi đi kèm hình ảnh sơ đồ, biểu đồ phân tích thực tế.',
          ],
        },
        {
          title: 'Tham gia Đề thi Bấm giờ (Timed Exams)',
          desc: 'Khi tham gia đề thi chính thức, đồng hồ đếm ngược sẽ hiển thị rõ ràng trên góc màn hình.',
          details: [
            'Hệ thống tự động lưu câu trả lời sau mỗi lần chọn để phòng ngừa mất mạng.',
            'Khi hết thời gian làm bài, hệ thống sẽ tự động thu bài và chấm điểm ngay lập tức.',
            'Xem phổ điểm, bảng so sánh và phân tích lời giải chi tiết cho từng câu hỏi.',
          ],
          alert: 'Không nên tải lại trang liên tục trong khi làm bài thi để tránh ảnh hưởng đến thời gian đếm ngược.',
        },
      ],
    },
    {
      id: 'student-mistake-notebook',
      badge: 'AI Ôn tập',
      badgeColor: 'bg-pink-100 text-pink-700 border-pink-200',
      icon: Dumbbell,
      title: 'Chương 5: Sổ tay Lỗi sai Thông minh (AI Spaced Repetition)',
      subtitle: 'Tự động thu thập câu sai và nhắc nhở ôn luyện ngắt quãng để khắc phục lỗ hổng kiến thức.',
      actionText: 'Mở Sổ tay lỗi sai',
      actionHref: '/mistake-notebook',
      actionColor: 'bg-pink-600 hover:bg-pink-700 text-white',
      steps: [
        {
          title: 'Cơ chế tự động gom lỗi sai',
          desc: 'Mỗi khi bạn chọn sai một câu hỏi trong bài tập hoặc đề thi, hệ thống sẽ tự động lưu câu hỏi đó vào Sổ tay lỗi sai cá nhân (/mistake-notebook).',
          details: [
            'Ghi nhận đáp án bạn đã chọn và đáp án đúng kèm lời giải chi tiết.',
            'Phân loại lỗi sai theo môn học và mức độ nhận thức.',
          ],
        },
        {
          title: 'Thuật toán Lặp lại Ngắt quãng (Spaced Repetition)',
          desc: 'Sổ tay không chỉ lưu trữ mà còn tính toán thời điểm vàng bạn sắp quên kiến thức để nhắc bạn làm lại câu sai.',
          details: [
            'Lần 1: Ôn lại sau 24 giờ kể từ khi sai.',
            'Lần 2: Ôn lại sau 3 ngày nếu vẫn trả lời chưa chắc chắn.',
            'Lần 3: Ôn lại sau 7 ngày để khắc sâu vào trí nhớ dài hạn.',
          ],
          tips: 'Dành 10 phút mỗi ngày luyện tập trong Sổ tay lỗi sai là cách nhanh nhất để tăng từ 1 - 2 điểm bài thi!',
        },
      ],
    },
    {
      id: 'student-ai-tutor',
      badge: 'Gia sư 24/7',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: MessageSquareCode,
      title: 'Chương 6: Trợ lý Học tập Thông minh AI Tutor',
      subtitle: 'Giải đáp mọi thắc mắc học tập 24/7, nhận diện đề bài qua ảnh chụp và giải thích từng bước.',
      actionText: 'Trò chuyện với AI',
      actionHref: '/ai-tutor',
      actionColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
      steps: [
        {
          title: 'Hỏi đáp bài tập mọi lúc mọi nơi',
          desc: 'Bấm nút "AI Tutor" trên thanh menu bên trái hoặc biểu tượng robot nhỏ ở góc dưới màn hình để mở khung trò chuyện.',
          details: [
            'Hỗ trợ giải toán, lý, hóa, ngữ văn, tiếng anh và lập trình.',
            'Phương pháp Socratic: AI hướng dẫn tư duy từng bước thay vì chỉ quăng đáp án thô.',
          ],
        },
        {
          title: 'Tải ảnh chụp đề bài từ điện thoại/máy tính',
          desc: 'Bạn gặp bài toán hình học khó hoặc đề thi trên giấy? Chỉ cần chụp ảnh và tải lên khung chat.',
          details: [
            'Công nghệ OCR nhận diện chữ viết tay và công thức toán học.',
            'Hỏi thêm các câu mở rộng: "Hãy giải thích tại sao bước này ra kết quả như vậy?".',
          ],
          tips: 'Tài khoản PRO và ULTRA nhận được tốc độ phản hồi AI siêu tốc và không giới hạn số lượng câu hỏi mỗi ngày!',
        },
      ],
    },
    {
      id: 'student-progress-certs',
      badge: 'Thành tựu',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Trophy,
      title: 'Chương 7: Chuỗi Ngày Học (Streak), Bảng Xếp Hạng & Chứng Chỉ',
      subtitle: 'Thi đua nhận quà cùng bạn bè toàn quốc và nhận chứng chỉ hoàn thành khóa học uy tín.',
      actionText: 'Xem Bảng xếp hạng',
      actionHref: '/leaderboard',
      actionColor: 'bg-amber-500 hover:bg-amber-600 text-white',
      steps: [
        {
          title: 'Duy trì chuỗi ngày học liên tục (Streak)',
          desc: 'Mỗi ngày hoàn thành ít nhất 1 bài học hoặc 1 bài tập, bạn sẽ thắp sáng ngọn lửa Streak của ngày hôm đó.',
          details: [
            'Chuỗi Streak càng cao, bạn càng nhận được nhiều điểm thưởng XP.',
            'Theo dõi biểu đồ học tập trực quan tại trang "Tiến độ học tập" (/profile/progress).',
          ],
        },
        {
          title: 'Đua Top Bảng Xếp Hạng & Nhận Chứng chỉ',
          desc: 'Cạnh tranh vị trí Top 1 - 3 tuần/tháng trên Bảng xếp hạng (/leaderboard) để nhận quà tặng tài khoản ULTRA.',
          details: [
            'Khi hoàn thành 100% các bài học và bài kiểm tra của khóa học, bạn sẽ được cấp Chứng chỉ tốt nghiệp điện tử.',
            'Chứng chỉ có mã tra cứu và mã QR xác thực tại mục "Chứng chỉ của tôi" (/profile/certificates).',
          ],
        },
      ],
    },
    {
      id: 'student-pricing-payment',
      badge: 'Nâng cấp VIP',
      badgeColor: 'bg-violet-100 text-violet-700 border-violet-200',
      icon: Sparkles,
      title: 'Chương 8: Nâng cấp Hội viên PRO/ULTRA & Thanh toán SePay VietQR',
      subtitle: 'Mở khóa toàn quyền học tập đỉnh cao, thanh toán tiện lợi chỉ trong 5 giây quét mã ngân hàng.',
      actionText: 'Nâng cấp ngay',
      actionHref: '/pricing',
      actionColor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      steps: [
        {
          title: 'Lựa chọn Gói Hội viên phù hợp',
          desc: 'Truy cập trang Bảng giá (/pricing) để xem quyền lợi các gói: Miễn phí, Gói PRO (cho học sinh/giáo viên) và Gói ULTRA cao cấp nhất.',
          details: [
            'Học không giới hạn toàn bộ bài giảng chất lượng cao.',
            'Trợ lý AI Tutor thông minh hoạt động 24/7 không giới hạn lượt hỏi.',
            'Luyện thi không giới hạn với ngân hàng câu hỏi chọn lọc.',
          ],
        },
        {
          title: 'Áp dụng Mã giảm giá & Thanh toán qua SePay VietQR',
          desc: 'Khi bấm chọn gói, bạn sẽ được chuyển đến trang Thanh toán bảo mật (/payment/[orderCode]).',
          details: [
            'Nhập mã giảm giá (Coupon) nếu có và bấm "Áp dụng" để được chiết khấu trực tiếp.',
            'Mở app ngân hàng bất kỳ (Vietcombank, MB, Techcombank, VPBank, Momo, v.v.) và quét mã VietQR trên màn hình.',
            'Hệ thống tự động nhận diện giao dịch qua SePay và nâng cấp tài khoản của bạn ngay lập tức trong vài giây.',
            'Nếu đổi ý muốn chọn gói khác, bạn có thể bấm nút "Hủy đơn hàng" ngay trên trang thanh toán.',
          ],
          tips: 'Không thay đổi nội dung chuyển khoản trong mã QR để hệ thống kích hoạt tự động chuẩn xác nhất!',
        },
      ],
    },
  ];

  // -------------------------------------------------------------
  // DỮ LIỆU HƯỚNG DẪN GIÁO VIÊN (TEACHER DATA)
  // -------------------------------------------------------------
  const teacherChapters: ChapterItem[] = [
    {
      id: 'teacher-register',
      badge: 'Đăng ký',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: GraduationCap,
      title: 'Chương 1: Đăng ký & Xét duyệt Quyền Giảng viên',
      subtitle: 'Gia nhập đội ngũ giáo viên NQD-LMS để xây dựng bài giảng và mở rộng tầm ảnh hưởng giáo dục.',
      actionText: 'Đăng ký Giảng viên',
      actionHref: '/become-teacher',
      actionColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      steps: [
        {
          title: 'Gửi hồ sơ đăng ký giảng dạy',
          desc: 'Truy cập đường dẫn /become-teacher từ thanh menu hoặc menu tài khoản cá nhân.',
          details: [
            'Điền đầy đủ thông tin: Chuyên môn giảng dạy, trường học/cơ quan công tác, số năm kinh nghiệm.',
            'Tải lên ảnh chụp bằng cấp, chứng chỉ sư phạm hoặc giấy chứng nhận năng lực.',
            'Cung cấp liên kết kênh bài giảng mẫu (YouTube, Google Drive, v.v.) nếu có.',
          ],
        },
        {
          title: 'Thời gian xét duyệt & Kích hoạt',
          desc: 'Ban quản trị NQD-LMS sẽ xét duyệt hồ sơ trong vòng 12 - 24 giờ làm việc. Sau khi duyệt thành công, tài khoản của bạn sẽ tự động được cấp quyền ROLE_TEACHER và mở khóa menu quản trị giảng viên.',
          tips: 'Sau khi được duyệt, bạn sẽ thấy thêm các mục: "Quản lý Giáo trình", "Quản lý Đề thi", "Thống kê & Báo cáo", "Tài chính & Rút tiền" trên thanh menu bên trái.',
        },
      ],
    },
    {
      id: 'teacher-courses',
      badge: 'Giáo trình',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: Layers,
      title: 'Chương 2: Biên soạn Khóa học, Chương & Bài giảng Đa phương tiện',
      subtitle: 'Tạo khóa học chuyên nghiệp với cấu trúc bài học phân cấp, video bài giảng và slide tương tác.',
      actionText: 'Quản lý giáo trình',
      actionHref: '/teacher/courses',
      actionColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      steps: [
        {
          title: 'Tạo Khóa học mới',
          desc: 'Vào mục "Quản lý Giáo trình" (/teacher/courses) và bấm nút "+ Tạo khóa học mới".',
          details: [
            'Nhập tên khóa học hấp dẫn, chọn Môn học và Khối lớp tương ứng.',
            'Tải lên ảnh bìa đại diện (Thumbnail) sắc nét với kích thước chuẩn 16:9.',
            'Thiết lập giá bán khóa học (hoặc đặt 0 VNĐ để phát hành miễn phí cho cộng đồng).',
            'Viết phần mô tả tổng quan về kiến thức và đầu ra học viên sẽ đạt được.',
          ],
        },
        {
          title: 'Thiết kế Chương học (Chapters) & Bài học (Lessons)',
          desc: 'Một khóa học chuẩn gồm các Chương lớn, mỗi Chương chứa nhiều Bài học nhỏ theo lộ trình bài bản.',
          details: [
            'Thêm Chương mới: Đặt tên chương và thứ tự hiển thị.',
            'Thêm Bài học: Nhập tiêu đề, đính kèm đường dẫn video bài giảng (YouTube hoặc lưu trữ đám mây).',
            'Soạn nội dung bài học bằng Markdown chuẩn đẹp, chèn công thức Toán LaTeX ($...$).',
            'Tích hợp Slide bài giảng: Học sinh có thể bấm xem slide trực tiếp khi học.',
          ],
          tips: 'Khóa học tạo xong sẽ ở trạng thái Nháp (Draft). Sau khi biên soạn đầy đủ nội dung, hãy gạt sang trạng thái "Xuất bản" (Publish) để học sinh có thể đăng ký học!',
        },
      ],
    },
    {
      id: 'teacher-questions',
      badge: 'Ngân hàng đề',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: HelpCircle,
      title: 'Chương 3: Xây dựng Ngân hàng Câu hỏi & Tích hợp Trợ lý AI',
      subtitle: 'Quản lý hàng ngàn câu hỏi phân loại theo môn, mức độ khó và sinh câu hỏi tự động với AI.',
      actionText: 'Ngân hàng câu hỏi',
      actionHref: '/teacher/questions',
      actionColor: 'bg-purple-600 hover:bg-purple-700 text-white',
      steps: [
        {
          title: 'Tạo câu hỏi thủ công chất lượng cao',
          desc: 'Vào mục "Ngân hàng Câu hỏi" (/teacher/questions) và bấm "Thêm câu hỏi mới".',
          details: [
            'Chọn môn học, khối lớp, chủ đề kiến thức và mức độ khó: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao.',
            'Hỗ trợ đầy đủ công thức Toán/Lý/Hóa LaTeX (ví dụ: $\\frac{-b \\pm \\sqrt{\\Delta}}{2a}$).',
            'Đính kèm ảnh minh họa đề bài sắc nét (sơ đồ mạch điện, hình học không gian, biểu đồ, v.v.).',
            'Đính kèm tệp âm thanh nghe (.mp3) cho các bài thi môn Tiếng Anh.',
            'Soạn sẵn lời giải chi tiết từng bước để học sinh xem sau khi làm bài.',
          ],
        },
        {
          title: 'Sinh câu hỏi siêu tốc với Trợ lý AI',
          desc: 'Tiết kiệm 80% thời gian soạn đề bằng tính năng AI Generator tích hợp ngay trong ngân hàng câu hỏi.',
          details: [
            'Nhập chủ đề kiến thức hoặc dán đoạn văn bản bài học vào khung AI.',
            'Chọn số lượng câu hỏi và tỷ lệ độ khó mong muốn.',
            'AI tự động tạo trọn bộ câu hỏi, 4 phương án lựa chọn, chỉ rõ đáp án đúng và lời giải chi tiết.',
            'Giáo viên dễ dàng chỉnh sửa lại trước khi lưu vào ngân hàng chung.',
          ],
          tips: 'Bạn có thể gắn thẻ (Tags) cho câu hỏi để sau này lọc và tạo đề thi theo ma trận cực kỳ thuận tiện.',
        },
      ],
    },
    {
      id: 'teacher-exams',
      badge: 'Tổ chức thi',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      icon: FileSpreadsheet,
      title: 'Chương 4: Tạo & Quản lý Đề thi Bấm giờ (Exams)',
      subtitle: 'Cấu hình ma trận đề thi, tự động trộn đề, thiết lập thời gian làm bài và chấm điểm tự động.',
      actionText: 'Quản lý đề thi',
      actionHref: '/teacher/exams',
      actionColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      steps: [
        {
          title: 'Cấu hình thông số Đề thi',
          desc: 'Vào mục "Quản lý Đề thi" (/teacher/exams) và bấm "Tạo đề thi mới".',
          details: [
            'Đặt tên đề thi (ví dụ: Đề kiểm tra 1 tiết Toán 10 - Chương Vectơ).',
            'Thiết lập thời gian làm bài (ví dụ: 45 phút, 90 phút).',
            'Thiết lập số lần làm bài tối đa (1 lần đối với thi thật, hoặc không giới hạn với đề luyện tập).',
            'Thời gian mở đề và hạn chót nộp bài.',
          ],
        },
        {
          title: 'Phương thức nạp câu hỏi vào đề',
          desc: 'Hỗ trợ 3 cách tạo đề thi linh hoạt:',
          details: [
            'Cách 1: Chọn câu hỏi cụ thể từ Ngân hàng câu hỏi cá nhân.',
            'Cách 2: Trộn đề ngẫu nhiên theo ma trận độ khó (ví dụ: 40% Nhận biết, 30% Thông hiểu, 20% Vận dụng, 10% Vận dụng cao).',
            'Cách 3: Sử dụng AI Exam Builder để sinh đề thi hoàn chỉnh trong 30 giây.',
          ],
        },
        {
          title: 'Chấm thi & Xem phân tích phổ điểm',
          desc: 'Hệ thống tự động chấm điểm bài làm trắc nghiệm ngay khi học sinh nộp bài.',
          details: [
            'Xem danh sách thí sinh đã nộp bài, thời gian làm bài và số điểm đạt được.',
            'Xem biểu đồ phân bố phổ điểm và tỷ lệ các câu hỏi học sinh hay làm sai nhất để kịp thời giảng lại trên lớp.',
          ],
        },
      ],
    },
    {
      id: 'teacher-classroom-labs',
      badge: 'Tương tác',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: Presentation,
      title: 'Chương 5: Quản lý Lớp học & Dạy trực tuyến Live Call',
      subtitle: 'Tạo không gian lớp học riêng, giao bài tập về nhà và phát trực tiếp bài giảng có hình ảnh/âm thanh.',
      actionText: 'Tạo Lớp học',
      actionHref: '/classrooms',
      actionColor: 'bg-rose-600 hover:bg-rose-700 text-white',
      steps: [
        {
          title: 'Tạo Lớp học & Cung cấp Mã mời',
          desc: 'Tại trang "Lớp học" (/classrooms), giáo viên tạo lớp học mới và gửi Mã lớp (Class Code) cho học sinh tham gia.',
          details: [
            'Quản lý danh sách học sinh theo danh sách lớp.',
            'Giao bài tập hoặc chỉ định đề thi riêng biệt cho lớp với thời hạn nộp bài rõ ràng.',
          ],
        },
        {
          title: 'Tổ chức buổi học trực tiếp tại Phòng Lab (/labs)',
          desc: 'Không cần cài đặt thêm phần mềm ngoài (như Zoom hay Meet), giáo viên có thể mở phòng giảng dạy trực tiếp ngay trên NQD-LMS.',
          details: [
            'Phát video và âm thanh bài giảng độ nét cao.',
            'Chia sẻ toàn màn hình hoặc cửa sổ slide thuyết trình.',
            'Quản lý micro của học sinh, giải đáp thắc mắc trực tiếp qua khung chat.',
          ],
        },
      ],
    },
    {
      id: 'teacher-finance',
      badge: 'Doanh thu & Rút tiền',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: DollarSign,
      title: 'Chương 6: Thống kê Doanh thu & Yêu cầu Rút tiền (Payout)',
      subtitle: 'Theo dõi báo cáo tăng trưởng học viên và nhận thanh toán doanh thu minh bạch về tài khoản ngân hàng.',
      actionText: 'Quản lý tài chính',
      actionHref: '/teacher/finance',
      actionColor: 'bg-amber-600 hover:bg-amber-700 text-white',
      steps: [
        {
          title: 'Theo dõi Báo cáo & Thống kê Giảng dạy',
          desc: 'Trang "Thống kê & Báo cáo" (/teacher/analytics) giúp giáo viên nắm bắt toàn diện bức tranh đào tạo:',
          details: [
            'Tổng số lượng học viên đăng ký theo từng ngày, tuần, tháng.',
            'Tỷ lệ học sinh hoàn thành các khóa học.',
            'Doanh số bán khóa học và số dư khả dụng thực nhận.',
          ],
        },
        {
          title: 'Quy trình Yêu cầu Rút tiền (Payout)',
          desc: 'Tại trang "Tài chính & Rút tiền" (/teacher/finance), giáo viên có thể gửi lệnh rút tiền về tài khoản ngân hàng.',
          details: [
            'Nhập số tiền muốn rút (tối thiểu theo quy định hệ thống).',
            'Điền thông tin tài khoản ngân hàng nhận tiền: Tên ngân hàng, Số tài khoản, Tên chủ tài khoản chính xác.',
            'Bấm "Gửi yêu cầu rút tiền". Admin sẽ phê duyệt và chuyển khoản trong vòng 24 - 48 giờ làm việc.',
            'Lịch sử giao dịch và trạng thái lệnh rút tiền được cập nhật minh bạch theo thời gian thực.',
          ],
          tips: 'Kiểm tra kỹ số tài khoản ngân hàng thụ hưởng trước khi xác nhận gửi yêu cầu rút tiền.',
        },
      ],
    },
  ];

  // -------------------------------------------------------------
  // DỮ LIỆU HƯỚNG DẪN ADMIN (ADMIN DATA)
  // -------------------------------------------------------------
  const adminChapters: ChapterItem[] = [
    {
      id: 'admin-dashboard',
      badge: 'Quản trị chung',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: BarChart3,
      title: '1. Tổng quan & Dashboard Quản trị',
      subtitle: 'Theo dõi các chỉ số quan trọng về người dùng, khóa học, doanh thu và tải hệ thống.',
      actionText: 'Vào Admin Dashboard',
      actionHref: '/admin',
      actionColor: 'bg-purple-600 hover:bg-purple-700 text-white',
      steps: [
        {
          title: 'Giám sát hoạt động toàn sàn',
          desc: 'Trang Admin Dashboard (/admin) cung cấp các biểu đồ thống kê tăng trưởng người dùng mới, tỷ lệ hoàn thành khóa học và doanh thu SePay theo thời gian.',
          details: [
            'Theo dõi số lượng học sinh, giáo viên đang online.',
            'Biểu đồ biến động doanh thu theo tuần, tháng, quý.',
          ],
        },
      ],
    },
    {
      id: 'admin-users-roles',
      badge: 'Người dùng & Quyền',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Users,
      title: '2. Quản lý Người dùng & Phân quyền Roles',
      subtitle: 'Tra cứu tài khoản, cấp quyền TEACHER/ADMIN hoặc khóa tài khoản vi phạm.',
      actionText: 'Quản lý người dùng',
      actionHref: '/admin/users',
      actionColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      steps: [
        {
          title: 'Tìm kiếm & Điều chỉnh quyền hạn',
          desc: 'Tại trang /admin/users và /admin/roles, quản trị viên có thể tìm kiếm người dùng theo email hoặc họ tên.',
          details: [
            'Gán hoặc thu hồi vai trò: ROLE_STUDENT, ROLE_TEACHER, ROLE_ADMIN.',
            'Khóa hoặc kích hoạt lại tài khoản khi phát hiện dấu hiệu vi phạm điều khoản.',
          ],
        },
      ],
    },
    {
      id: 'admin-teacher-approvals',
      badge: 'Duyệt giảng viên',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: ShieldCheck,
      title: '3. Xét duyệt Hồ sơ Giáo viên (Teacher Verifications)',
      subtitle: 'Kiểm duyệt minh chứng bằng cấp và kích hoạt quyền giảng dạy cho ứng viên.',
      actionText: 'Duyệt hồ sơ',
      actionHref: '/admin/teacher-verifications',
      actionColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      steps: [
        {
          title: 'Quy trình kiểm tra & Phê duyệt',
          desc: 'Khi người dùng nộp đơn tại /become-teacher, yêu cầu sẽ xuất hiện tại /admin/teacher-verifications.',
          details: [
            'Kiểm tra thông tin bằng cấp, chứng chỉ sư phạm đính kèm.',
            'Bấm "Phê duyệt" để tự động nâng cấp tài khoản sang ROLE_TEACHER kèm thông báo.',
            'Hoặc bấm "Từ chối" kèm lời giải thích lý do để ứng viên bổ sung hồ sơ.',
          ],
        },
      ],
    },
    {
      id: 'admin-finance-payout',
      badge: 'Tài chính & SePay',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: DollarSign,
      title: '4. Quản lý Tài chính, Doanh thu & Lệnh Rút tiền Payout',
      subtitle: 'Đối soát giao dịch ngân hàng SePay VietQR và xử lý chuyển tiền cho giáo viên.',
      actionText: 'Quản lý tài chính',
      actionHref: '/admin/finance',
      actionColor: 'bg-amber-600 hover:bg-amber-700 text-white',
      steps: [
        {
          title: 'Đối soát đơn hàng SePay',
          desc: 'Theo dõi toàn bộ đơn hàng gói PRO/ULTRA và khóa học. Hệ thống tự động ghi nhận thanh toán qua Webhook SePay VietQR.',
          details: [
            'Tra cứu chi tiết mã đơn hàng (orderCode), số tiền thực nhận và mã tham chiếu ngân hàng.',
            'Khắc phục đơn hàng thủ công nếu có trường hợp khách hàng chuyển khoản sai nội dung.',
          ],
        },
        {
          title: 'Duyệt lệnh rút tiền (Payouts) của Giáo viên',
          desc: 'Kiểm tra số dư hợp lệ và danh sách yêu cầu rút tiền của giáo viên.',
          details: [
            'Xác nhận thông tin số tài khoản và ngân hàng nhận tiền.',
            'Sau khi thực hiện chuyển khoản cho giáo viên, bấm "Đã xử lý" để cập nhật trạng thái đơn rút tiền.',
          ],
        },
      ],
    },
    {
      id: 'admin-promotions-coupons',
      badge: 'Khuyến mãi',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: Flame,
      title: '5. Quản lý Sự kiện Giảm giá & Mã Coupon',
      subtitle: 'Tạo mã voucher chiết khấu cho học sinh và các đợt flash sale toàn sàn.',
      actionText: 'Quản lý mã giảm giá',
      actionHref: '/admin/coupons',
      actionColor: 'bg-rose-600 hover:bg-rose-700 text-white',
      steps: [
        {
          title: 'Tạo mã giảm giá linh hoạt',
          desc: 'Tại trang /admin/coupons, bạn có thể tạo mã giảm theo % (ví dụ: GIAM50) hoặc giảm tiền mặt trực tiếp (ví dụ: 100.000 VNĐ).',
          details: [
            'Giới hạn số lượt dùng tối đa và thời gian hết hạn.',
            'Áp dụng cho toàn bộ gói dịch vụ PRO/ULTRA hoặc từng khóa học cụ thể.',
          ],
        },
      ],
    },
  ];

  // -------------------------------------------------------------
  // DỮ LIỆU HỎI ĐÁP THƯỜNG GẶP (FAQ)
  // -------------------------------------------------------------
  const studentFaqs: FaqItem[] = [
    {
      question: 'Tôi có cần trả phí để học bài trên NQD-LMS không?',
      answer:
        'NQD-LMS cung cấp rất nhiều bài giảng và tài liệu hoàn toàn miễn phí. Đối với các khóa học nâng cao đặc biệt hoặc gói thành viên PRO/ULTRA (mở khóa toàn bộ bài giảng độc quyền và trợ lý AI Tutor không giới hạn), bạn có thể nâng cấp bằng phương thức thanh toán VietQR quét mã siêu nhanh.',
    },
    {
      question: 'Tôi quét mã thanh toán VietQR qua SePay thì bao lâu tài khoản được kích hoạt?',
      answer:
        'Hệ thống NQD-LMS tích hợp cổng thanh toán tự động SePay VietQR. Ngay sau khi bạn chuyển khoản thành công từ app ngân hàng, tài khoản của bạn sẽ tự động được kích hoạt và nâng cấp sau khoảng 3 đến 10 giây mà không cần sự can thiệp thủ công của nhân viên hỗ trợ.',
    },
    {
      question: 'Nếu tôi gặp bài toán khó mà không hiểu thì làm thế nào?',
      answer:
        'Bạn có thể bấm vào tính năng AI Tutor trên menu hoặc biểu tượng robot nhỏ ở góc màn hình. Hãy nhập câu hỏi hoặc chụp ảnh đề bài tải lên, AI Tutor sẽ phân tích và giải thích từng bước giải quyết vấn đề cho bạn 24/7.',
    },
    {
      question: 'Sổ tay lỗi sai thông minh hoạt động ra sao?',
      answer:
        'Bất kỳ câu hỏi nào bạn làm sai trong các bài tập hoặc đề thi sẽ được tự động đưa vào mục "Sổ tay lỗi sai". Dựa trên thuật toán Lặp lại ngắt quãng (Spaced Repetition), hệ thống sẽ lên lịch nhắc nhở bạn luyện lại các câu sai sau 1 ngày, 3 ngày, 7 ngày cho đến khi bạn hoàn toàn làm chủ kiến thức đó.',
    },
    {
      question: 'Làm thế nào để nhận được Chứng chỉ hoàn thành khóa học?',
      answer:
        'Khi bạn hoàn thành tất cả các bài học trong giáo trình và đạt điểm yêu cầu trong bài kiểm tra kết thúc khóa học, hệ thống sẽ tự động cấp Chứng chỉ điện tử có tên của bạn cùng mã QR xác thực tại mục "Chứng chỉ của tôi".',
    },
  ];

  const teacherFaqs: FaqItem[] = [
    {
      question: 'Làm thế nào để tôi được cấp quyền Giáo viên để tạo khóa học?',
      answer:
        'Bạn chỉ cần truy cập trang "/become-teacher", điền thông tin chuyên môn giảng dạy và đính kèm hình ảnh bằng cấp, chứng chỉ sư phạm liên quan. Ban quản trị NQD-LMS sẽ xét duyệt và kích hoạt quyền giáo viên cho bạn trong vòng 12 - 24 giờ.',
    },
    {
      question: 'Tôi có thể tải video bài giảng lên bằng cách nào?',
      answer:
        'Bạn có thể nhúng đường dẫn video từ YouTube (để ở chế độ Không công khai/Unlisted hoặc Công khai), hoặc sử dụng các liên kết video trực tiếp để học sinh xem mượt mà trên mọi thiết bị.',
    },
    {
      question: 'AI Generator trong ngân hàng câu hỏi có thể làm được gì?',
      answer:
        'AI Generator cho phép bạn dán đoạn văn bản nội dung bài giảng hoặc nhập một chủ đề bất kỳ, sau đó AI sẽ tự động sinh ra các câu hỏi trắc nghiệm kèm 4 phương án, đáp án đúng và lời giải chi tiết chuẩn công thức LaTeX.',
    },
    {
      question: 'Doanh thu bán khóa học được tính và chi trả như thế nào?',
      answer:
        'Khi có học sinh mua khóa học của bạn, số tiền sau khi trừ tỷ lệ phí nền tảng sẽ được cộng trực tiếp vào Số dư khả dụng của bạn. Bạn có thể gửi lệnh rút tiền (Payout) về tài khoản ngân hàng bất kỳ lúc nào tại trang "/teacher/finance".',
    },
    {
      question: 'Phòng Lab (Live Call) hỗ trợ những tính năng gì trong giờ dạy?',
      answer:
        'Phòng Lab hỗ trợ truyền phát Video & Âm thanh trực tiếp độ trễ thấp, chia sẻ màn hình bài giảng, trình chiếu slide, tương tác đặt câu hỏi và quản lý mic của học sinh trong phòng học.',
    },
  ];

  const adminFaqs: FaqItem[] = [
    {
      question: 'Làm thế nào để đối soát một đơn hàng nếu người dùng chuyển khoản sai nội dung?',
      answer:
        'Tại trang Admin Finance (/admin/finance), bạn có thể kiểm tra danh sách log giao dịch của SePay, đối chiếu số tiền và mã đơn hàng của người dùng để xác nhận kích hoạt tài khoản thủ công.',
    },
    {
      question: 'Quy trình xử lý lệnh rút tiền (Payout) của giảng viên như thế nào?',
      answer:
        'Giảng viên gửi yêu cầu rút tiền -> Lệnh hiển thị trong mục Yêu cầu rút tiền tại /admin/finance -> Quản trị viên đối soát số dư -> Thực hiện chuyển khoản ngân hàng -> Bấm xác nhận "Đã hoàn thành" để hệ thống cập nhật lịch sử.',
    },
  ];

  // Lựa chọn bộ dữ liệu theo tab đang kích hoạt
  const currentChapters = useMemo(() => {
    let list: ChapterItem[] = [];
    if (activeTab === 'STUDENT') list = studentChapters;
    else if (activeTab === 'TEACHER') list = teacherChapters;
    else list = adminChapters;

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((chap) => {
      const matchTitle = chap.title.toLowerCase().includes(q);
      const matchSub = chap.subtitle.toLowerCase().includes(q);
      const matchSteps = chap.steps.some(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.desc.toLowerCase().includes(q) ||
          (s.details && s.details.some((d) => d.toLowerCase().includes(q)))
      );
      return matchTitle || matchSub || matchSteps;
    });
  }, [activeTab, searchQuery]);

  const currentFaqs = useMemo(() => {
    if (activeTab === 'STUDENT') return studentFaqs;
    if (activeTab === 'TEACHER') return teacherFaqs;
    return adminFaqs;
  }, [activeTab]);

  return (
    <div className="w-full min-h-screen bg-slate-50/80 pb-20">
      {/* --------------------------------------------------------- */}
      {/* TOP HERO BANNER */}
      {/* --------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        {/* Background ambient decorative glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold tracking-wide uppercase mb-3 border border-white/10">
                <Compass className="w-3.5 h-3.5" />
                <span>Trung tâm Trợ giúp & Hướng dẫn</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Cẩm nang Sử dụng NQD-LMS
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                Hướng dẫn chi tiết từng bước giúp bạn làm chủ mọi tính năng học tập, thi cử và giảng dạy thông minh trên nền tảng NQD-LMS.
              </p>
            </div>

            {/* Role Detected Indicator Box */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 max-w-md shrink-0 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg shrink-0">
                  {isTeacher ? '👨‍🏫' : isAdmin ? '🛡️' : '🎓'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">Vai trò của bạn:</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      {isAdmin ? 'Quản trị viên' : isTeacher ? 'Giáo viên' : 'Học sinh'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">
                    {isAdmin
                      ? 'Hệ thống tự động mở khóa toàn bộ cẩm nang dành cho Giáo viên, Học sinh & Admin.'
                      : isTeacher
                      ? 'Giao diện tự động tối ưu hóa cẩm nang Quản lý Giáo trình, Đề thi & Doanh thu.'
                      : 'Giao diện tự động tối ưu hóa cẩm nang Học tập, Luyện thi, AI Tutor & Sổ lỗi sai.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="mt-8 max-w-2xl relative">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tính năng: AI Tutor, đề thi, LaTeX, sổ lỗi sai, SePay, rút tiền..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium shadow-md focus:outline-hidden focus:ring-3 focus:ring-emerald-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Quick search suggestion tags */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-300">
              <span className="text-slate-400">Từ khóa phổ biến:</span>
              {['AI Tutor', 'Sổ tay lỗi sai', 'Đề thi bấm giờ', 'SePay VietQR', 'Phòng Lab', 'Rút tiền', 'Mã giảm giá'].map(
                (tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium transition cursor-pointer border border-white/10"
                  >
                    #{tag}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- */}
      {/* ROLE SWITCHER TABS */}
      {/* --------------------------------------------------------- */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 overflow-x-auto gap-3 no-scrollbar">
            <div className="flex items-center gap-2">
              {/* Tab 1: Học sinh */}
              <button
                onClick={() => handleTabSwitch('STUDENT')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'STUDENT'
                    ? 'bg-[#83C75D] text-white shadow-sm shadow-[#83C75D]/30 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>🎓 Dành cho Học sinh</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                    activeTab === 'STUDENT'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {studentChapters.length} mục
                </span>
              </button>

              {/* Tab 2: Giáo viên */}
              <button
                onClick={() => handleTabSwitch('TEACHER')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'TEACHER'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>👨‍🏫 Dành cho Giáo viên</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                    activeTab === 'TEACHER'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {teacherChapters.length} mục
                </span>
              </button>

              {/* Tab 3: Admin (Hiển thị nổi bật nếu là Admin) */}
              <button
                onClick={() => handleTabSwitch('ADMIN')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'ADMIN'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>🛡️ Quản trị viên</span>
                {isAdmin && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-black bg-amber-400 text-slate-900 uppercase">
                    Admin
                  </span>
                )}
              </button>
            </div>

            {/* Quick Helper Badge */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Bấm vào từng mục để xem hướng dẫn chi tiết</span>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- */}
      {/* MAIN CONTENT AREA */}
      {/* --------------------------------------------------------- */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Dynamic Context Header Card */}
        <div className="mb-8 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 ${
                activeTab === 'STUDENT'
                  ? 'bg-emerald-100 text-[#4e8231]'
                  : activeTab === 'TEACHER'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {activeTab === 'STUDENT' ? '🎓' : activeTab === 'TEACHER' ? '👨‍🏫' : '🛡️'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {activeTab === 'STUDENT'
                  ? 'Cẩm nang Học sinh: Tự tin học tập & Bứt phá điểm số'
                  : activeTab === 'TEACHER'
                  ? 'Cẩm nang Giáo viên: Thiết kế Giáo trình, Khảo thí & Doanh thu'
                  : 'Cẩm nang Quản trị: Vận hành Hệ thống & Đối soát Tài chính'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'STUDENT'
                  ? 'Hướng dẫn sử dụng toàn bộ tính năng bài học, phòng lab, đề thi, AI Tutor và sổ tay lỗi sai.'
                  : activeTab === 'TEACHER'
                  ? 'Hướng dẫn tạo khóa học, soạn ngân hàng câu hỏi AI, tổ chức đề thi và gửi lệnh rút tiền.'
                  : 'Tài liệu hướng dẫn quản lý tài khoản người dùng, duyệt hồ sơ giảng viên và đối soát SePay.'}
              </p>
            </div>
          </div>

          {/* Quick CTA button for non-teachers in Teacher Tab */}
          {activeTab === 'TEACHER' && !isTeacher && !isAdmin && (
            <Link
              href="/become-teacher"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
            >
              <span>Đăng ký làm Giảng viên</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {activeTab === 'STUDENT' && !isPro && !isUltra && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              <span>Nâng cấp PRO / ULTRA</span>
            </Link>
          )}
        </div>

        {/* Search Results Notice */}
        {searchQuery.trim() && (
          <div className="mb-6 flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm">
            <span>
              Kết quả tìm kiếm cho từ khóa: <strong className="underline font-bold">{searchQuery}</strong> ({currentChapters.length} mục)
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* CHAPTERS LIST (ACCORDION CARDS) */}
        {/* ------------------------------------------------------- */}
        <div className="space-y-4">
          {currentChapters.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-700">Không tìm thấy nội dung phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">
                Hãy thử lại với từ khóa khác hoặc chuyển sang tab hướng dẫn tương ứng.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Xem toàn bộ cẩm nang
              </button>
            </div>
          ) : (
            currentChapters.map((chapter, idx) => {
              const Icon = chapter.icon;
              // Expand first chapter by default or if searched
              const isExpanded =
                expandedChapters[chapter.id] !== undefined
                  ? expandedChapters[chapter.id]
                  : idx === 0 || searchQuery.trim().length > 0;

              return (
                <div
                  key={chapter.id}
                  id={chapter.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all overflow-hidden"
                >
                  {/* Chapter Header (Clickable toggle) */}
                  <div
                    onClick={() => toggleChapter(chapter.id)}
                    className="p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                        <Icon className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${chapter.badgeColor}`}
                          >
                            {chapter.badge}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {chapter.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                          {chapter.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {chapter.actionHref && (
                        <Link
                          href={chapter.actionHref}
                          onClick={(e) => e.stopPropagation()}
                          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                            chapter.actionColor || 'bg-slate-800 text-white'
                          }`}
                        >
                          <span>{chapter.actionText || 'Khám phá'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                      <button
                        type="button"
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      >
                        <ChevronDown
                          className={`w-5 h-5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-slate-700' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Chapter Steps Body (Collapsible) */}
                  {isExpanded && (
                    <div className="px-5 pb-6 pt-2 border-t border-slate-100 bg-slate-50/40">
                      <div className="space-y-4 mt-3">
                        {chapter.steps.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs"
                          >
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-900">
                                  {step.title}
                                </h4>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {step.desc}
                                </p>

                                {step.details && step.details.length > 0 && (
                                  <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600 pl-1">
                                    {step.details.map((detail, dIdx) => (
                                      <li key={dIdx} className="flex items-start gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{detail}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}

                                {step.tips && (
                                  <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                      <strong className="font-semibold text-amber-950">Mẹo hữu ích: </strong>
                                      {step.tips}
                                    </div>
                                  </div>
                                )}

                                {step.alert && (
                                  <div className="mt-3 p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                      <strong className="font-semibold text-rose-950">Lưu ý quan trọng: </strong>
                                      {step.alert}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mobile Action Link button inside expanded accordion */}
                      {chapter.actionHref && (
                        <div className="mt-4 sm:hidden pt-3 border-t border-slate-200">
                          <Link
                            href={chapter.actionHref}
                            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs ${
                              chapter.actionColor || 'bg-slate-800 text-white'
                            }`}
                          >
                            <span>{chapter.actionText || 'Khám phá ngay'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ------------------------------------------------------- */}
        {/* FREQUENTLY ASKED QUESTIONS (FAQ) */}
        {/* ------------------------------------------------------- */}
        <div className="mt-14">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-extrabold text-slate-900">Câu hỏi thường gặp (FAQ)</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Giải đáp các thắc mắc phổ biến nhất khi sử dụng nền tảng NQD-LMS.
          </p>

          <div className="space-y-3">
            {currentFaqs.map((faq, fIdx) => {
              const isFaqOpen = !!expandedFaq[`${activeTab}-${fIdx}`];
              return (
                <div
                  key={fIdx}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(`${activeTab}-${fIdx}`)}
                    className="w-full text-left p-4.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer select-none"
                  >
                    <span className="font-bold text-sm text-slate-900">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isFaqOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {isFaqOpen && (
                    <div className="px-4.5 pb-4.5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* SUPPORT / CONTACT FOOTER BANNER */}
        {/* ------------------------------------------------------- */}
        <div className="mt-14 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
          <div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase tracking-wider border border-indigo-500/30">
              Cần thêm trợ giúp?
            </span>
            <h3 className="text-xl sm:text-2xl font-black mt-2">
              Chúng tôi luôn đồng hành cùng bạn 24/7
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Nếu bạn có bất kỳ thắc mắc kỹ thuật hoặc câu hỏi về bài giảng, đội ngũ hỗ trợ NQD-LMS và Trợ lý AI Tutor luôn sẵn sàng hỗ trợ bạn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/ai-tutor"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span>Trò chuyện với AI Tutor</span>
              <MessageSquareCode className="w-4 h-4" />
            </Link>
            <Link
              href="/courses"
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/20 flex items-center gap-2"
            >
              <span>Vào học ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
