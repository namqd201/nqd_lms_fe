'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { subjectService } from '@/services/subject.service';
import { courseService } from '@/services/course.service';
import { SubjectResponse } from '@/types/admin';
import { StudentCourseResponse, StudentCourseDetailResponse } from '@/types/course';
import { GRADE_LEVEL_GROUPS, isGradeMatching, getGradeGroup } from '@/constants/gradeLevels';
import {
  BookOpen,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  RotateCcw,
  Search,
  CheckCircle2,
  PlayCircle,
  Award,
  Lock,
  Clock,
  Star,
  ListChecks,
  MessageSquare,
  Megaphone,
  BookMarked,
  Sparkles,
  Share2,
  ExternalLink,
} from 'lucide-react';

const SUBJECT_ICONS: Record<string, string> = {
  MATH: '📐',
  TOAN: '📐',
  IT: '💻',
  TECH: '💻',
  ENG: '🇬🇧',
  PHYS: '⚡',
  CHEM: '🧪',
  BIO: '🌿',
  LIT: '📚',
  HIST: '🏛️',
  GEO: '🌍',
};

// Fallback subject list if backend returns empty or is unauthenticated
const FALLBACK_SUBJECTS: SubjectResponse[] = [
  {
    id: 'sub-toan',
    name: 'Toán học',
    code: 'TOAN',
    description: 'Nền tảng tư duy toán học, số học, hình học và giải tích từ Tiểu học đến Đại học.',
    status: 'ACTIVE',
    courseCount: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-it',
    name: 'Công nghệ thông tin',
    code: 'IT',
    description: 'Tin học cơ bản, tư duy thuật toán, cấu trúc dữ liệu và lập trình ứng dụng.',
    status: 'ACTIVE',
    courseCount: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-eng',
    name: 'Tiếng Anh',
    code: 'ENG',
    description: 'Ngữ pháp cơ bản, từ vựng theo chủ đề, kỹ năng giao tiếp và chứng chỉ chuẩn quốc tế.',
    status: 'ACTIVE',
    courseCount: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-lit',
    name: 'Ngữ văn',
    code: 'LIT',
    description: 'Tiếng Việt nền tảng, văn học trung đại, hiện đại và phương pháp hành văn nghị luận.',
    status: 'ACTIVE',
    courseCount: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-phys',
    name: 'Vật lý',
    code: 'PHYS',
    description: 'Cơ học, nhiệt học, điện từ học, quang học và vật lý lượng tử hiện đại.',
    status: 'ACTIVE',
    courseCount: 6,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-chem',
    name: 'Hóa học',
    code: 'CHEM',
    description: 'Bảng tuần hoàn, hóa vô cơ, hóa hữu cơ và các phương pháp cân bằng phản ứng.',
    status: 'ACTIVE',
    courseCount: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-bio',
    name: 'Sinh học',
    code: 'BIO',
    description: 'Sinh học tế bào, cơ thể sinh vật, di truyền học và hệ sinh thái môi trường.',
    status: 'ACTIVE',
    courseCount: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sub-hist-geo',
    name: 'Lịch sử & Địa lý',
    code: 'HIST',
    description: 'Lịch sử Việt Nam, văn minh thế giới, địa lý tự nhiên và kinh tế xã hội.',
    status: 'ACTIVE',
    courseCount: 5,
    createdAt: new Date().toISOString(),
  },
];

// Helper to generate realistic standard curriculum for any grade if no DB course exists
function generateStandardCurriculum(subjectName: string, gradeLevel: string) {
  const isElementary = ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'].includes(gradeLevel);
  const isHighSchool = ['Lớp 10', 'Lớp 11', 'Lớp 12'].includes(gradeLevel);
  const isUni = gradeLevel.includes('Năm');

  if (subjectName.toLowerCase().includes('toán')) {
    if (gradeLevel === 'Lớp 1') {
      return [
        {
          id: 'ch-1',
          displayOrder: 1,
          title: 'Chương 1: Cộng trừ phạm vi 100',
          description: 'Học sinh nắm vững cấu trúc số và các phép tính cộng trừ cơ bản không nhớ và có nhớ trong phạm vi 100.',
          lessons: [
            {
              id: 'les-1',
              displayOrder: 1,
              title: 'BÀI 1 — CỘNG TRONG PHẠM VI 100',
              summary: 'Học sinh biết cách cộng trừ trong phạm vi 100, rèn luyện kỹ năng đặt tính rồi tính.',
              estimatedMinutes: 45,
            },
            {
              id: 'les-2',
              displayOrder: 2,
              title: 'BÀI 2 — TRỪ TRONG PHẠM VI 100',
              summary: 'Quy tắc trừ số có hai chữ số, giải bài toán có lời văn một phép trừ.',
              estimatedMinutes: 45,
            },
            {
              id: 'les-3',
              displayOrder: 3,
              title: 'BÀI 3 — LUYỆN TẬP CHUNG VẬN DỤNG CỘNG TRỪ',
              summary: 'Tổng hợp các dạng bài tập tính nhẩm nhanh và toán đố tư duy thực tế.',
              estimatedMinutes: 40,
            },
          ],
        },
        {
          id: 'ch-2',
          displayOrder: 2,
          title: 'Chương 2: Hình học cơ bản và Đo lường thời gian',
          description: 'Nhận biết điểm, đoạn thẳng, hình tam giác, hình tròn, đơn vị đo xăng-ti-mét và xem đồng hồ.',
          lessons: [
            {
              id: 'les-4',
              displayOrder: 1,
              title: 'BÀI 1 — ĐIỂM VÀ ĐOẠN THẲNG',
              summary: 'Cách dùng thước thẳng để đo và vẽ đoạn thẳng có độ dài cho trước.',
              estimatedMinutes: 35,
            },
            {
              id: 'les-5',
              displayOrder: 2,
              title: 'BÀI 2 — ĐƠN VỊ ĐO XĂNG-TI-MÉT (cm)',
              summary: 'Làm quen với thước kẻ cm, ước lượng độ dài đồ vật xung quanh.',
              estimatedMinutes: 35,
            },
            {
              id: 'les-6',
              displayOrder: 3,
              title: 'BÀI 3 — XEM ĐỒNG HỒ & THỜI KHÓA BIỂU HÀNG NGÀY',
              summary: 'Xem giờ đúng trên mặt đồng hồ kim, sắp xếp thời gian biểu học tập và vui chơi.',
              estimatedMinutes: 30,
            },
          ],
        },
      ];
    }

    if (isElementary) {
      return [
        {
          id: 'ch-elem-1',
          displayOrder: 1,
          title: 'Chương 1: Các phép tính với số tự nhiên',
          description: 'Hệ thống phép tính cộng, trừ, nhân, chia và quy tắc thứ tự thực hiện phép tính.',
          lessons: [
            { id: 'l1', displayOrder: 1, title: 'BÀI 1 — PHÉP TÍNH VÀ QUY TẮC THỨ TỰ', summary: 'Quy tắc ưu tiên nhân chia trước, cộng trừ sau.', estimatedMinutes: 45 },
            { id: 'l2', displayOrder: 2, title: 'BÀI 2 — BÀI TOÁN TÌM X CƠ BẢN', summary: 'Phương pháp tìm thành phần chưa biết của phép tính.', estimatedMinutes: 45 },
            { id: 'l3', displayOrder: 3, title: 'BÀI 3 — GIẢI TOÁN CÓ LỜI VĂN', summary: 'Kỹ năng tóm tắt đề bài và lập lời giải mạch lạc.', estimatedMinutes: 40 },
          ],
        },
        {
          id: 'ch-elem-2',
          displayOrder: 2,
          title: 'Chương 2: Hình học và Đại lượng đo lường',
          description: 'Chu vi, diện tích các hình phẳng cơ bản và đổi đơn vị đo.',
          lessons: [
            { id: 'l4', displayOrder: 1, title: 'BÀI 1 — CHU VI VÀ DIỆN TÍCH HÌNH CHỮ NHẬT, HÌNH VUÔNG', summary: 'Công thức và ứng dụng thực tiễn.', estimatedMinutes: 40 },
            { id: 'l5', displayOrder: 2, title: 'BÀI 2 — ĐỔI CÁC ĐƠN VỊ ĐO THÔNG DỤNG', summary: 'Bảng đơn vị đo độ dài, khối lượng và diện tích.', estimatedMinutes: 35 },
          ],
        },
      ];
    }

    if (isHighSchool) {
      return [
        {
          id: 'ch-hs-1',
          displayOrder: 1,
          title: 'Chương 1: Hàm số & Phương trình đại số',
          description: 'Khảo sát sự biến thiên của hàm số, các dạng phương trình và bất phương trình trọng tâm.',
          lessons: [
            { id: 'l1', displayOrder: 1, title: 'BÀI 1 — TÍNH ĐƠN ĐIỆU VÀ CỰC TRỊ CỦA HÀM SỐ', summary: 'Ứng dụng đạo hàm tìm khoảng đồng biến, nghịch biến và cực trị.', estimatedMinutes: 50 },
            { id: 'l2', displayOrder: 2, title: 'BÀI 2 — GIÁ TRỊ LỚN NHẤT & NHỎ NHẤT TRÊN ĐOẠN', summary: 'Phương pháp bảng biến thiên và đánh giá đại số.', estimatedMinutes: 45 },
            { id: 'l3', displayOrder: 3, title: 'BÀI 3 — ĐƯỜNG TIỆM CẬN CỦA ĐỒ THỊ', summary: 'Tiệm cận đứng, tiệm cận ngang và bài toán chứa tham số.', estimatedMinutes: 45 },
          ],
        },
        {
          id: 'ch-hs-2',
          displayOrder: 2,
          title: 'Chương 2: Hình học không gian & Tọa độ Oxyz',
          description: 'Quan hệ song song, vuông góc trong không gian và hệ tọa độ Oxyz.',
          lessons: [
            { id: 'l4', displayOrder: 1, title: 'BÀI 1 — GÓC VÀ KHOẢNG CÁCH TRONG KHÔNG GIAN', summary: 'Khoảng cách từ điểm đến mặt phẳng, góc giữa đường thẳng và mặt phẳng.', estimatedMinutes: 50 },
            { id: 'l5', displayOrder: 2, title: 'BÀI 2 — PHƯƠNG TRÌNH MẶT PHẲNG VÀ ĐƯỜNG THẲNG', summary: 'Viết phương trình mặt phẳng, vị trí tương đối và bài toán cực trị tọa độ.', estimatedMinutes: 50 },
          ],
        },
      ];
    }

    if (isUni) {
      return [
        {
          id: 'ch-uni-1',
          displayOrder: 1,
          title: 'Chương 1: Giải tích cổ điển & Đại số tuyến tính',
          description: 'Chuỗi số, ma trận, định thức và hệ phương trình tuyến tính.',
          lessons: [
            { id: 'l1', displayOrder: 1, title: 'BÀI 1 — MA TRẬN VÀ CÁC PHÉP BIẾN ĐỔI SƠ CẤP', summary: 'Hạng của ma trận, ma trận nghịch đảo và định thức.', estimatedMinutes: 60 },
            { id: 'l2', displayOrder: 2, title: 'BÀI 2 — HỆ PHƯƠNG TRÌNH TUYẾN TÍNH CRAMER & GAUSS', summary: 'Giải hệ phương trình thuần nhất và không thuần nhất.', estimatedMinutes: 60 },
          ],
        },
      ];
    }
  }

  // Generic fallback curriculum for other subjects
  return [
    {
      id: 'ch-gen-1',
      displayOrder: 1,
      title: `Chương 1: Kiến thức nền tảng — ${subjectName} (${gradeLevel})`,
      description: `Hệ thống khái niệm cơ sở, lý thuyết trọng tâm và định hướng tiếp cận môn ${subjectName}.`,
      lessons: [
        {
          id: 'l-gen-1',
          displayOrder: 1,
          title: `BÀI 1 — KHÁI NIỆM & LÝ THUYẾT TRỌNG TÂM`,
          summary: `Khái quát lý thuyết trọng tâm và các dạng bài điển hình môn ${subjectName} ${gradeLevel}.`,
          estimatedMinutes: 45,
        },
        {
          id: 'l-gen-2',
          displayOrder: 2,
          title: `BÀI 2 — PHƯƠNG PHÁP GIẢI & KỸ NĂNG VẬN DỤNG`,
          summary: `Phương pháp tư duy logic và kỹ năng thực hành bài tập cốt lõi.`,
          estimatedMinutes: 45,
        },
      ],
    },
    {
      id: 'ch-gen-2',
      displayOrder: 2,
      title: `Chương 2: Chuyên đề nâng cao & Đề ôn luyện`,
      description: `Hệ thống bài tập vận dụng cao, đề thi mẫu và phương pháp làm bài đạt điểm tối đa.`,
      lessons: [
        {
          id: 'l-gen-3',
          displayOrder: 1,
          title: `BÀI 1 — CHUYÊN ĐỀ ÔN TẬP TỔNG HỢP`,
          summary: `Tổng hợp kiến thức theo sơ đồ tư duy, giải quyết bài toán thực tế.`,
          estimatedMinutes: 40,
        },
        {
          id: 'l-gen-4',
          displayOrder: 2,
          title: `BÀI 2 — ĐỀ THI ĐÁNH GIÁ NĂNG LỰC ĐẦU RA`,
          summary: `Kiểm tra mức độ thành thạo kiến thức chuẩn GDPT.`,
          estimatedMinutes: 45,
        },
      ],
    },
  ];
}

export default function KnowledgePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Navigation levels: SUBJECTS -> GRADES -> CLASS_CONTENT
  const [viewLevel, setViewLevel] = useState<'SUBJECTS' | 'GRADES' | 'CLASS_CONTENT'>('SUBJECTS');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string | null>(null);

  // Data states
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [publishedCourses, setPublishedCourses] = useState<StudentCourseResponse[]>([]);
  const [activeCourseDetail, setActiveCourseDetail] = useState<StudentCourseDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState<string>('');

  // Class Content View states
  const [activeTab, setActiveTab] = useState<'syllabus' | 'discussions' | 'announcements'>('syllabus');
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({ 'ch-1': true, '0': true });

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [subsData, coursesData] = await Promise.all([
          subjectService.getActiveSubjects().catch(() => []),
          courseService.getPublishedCourses().catch(() => []),
        ]);

        if (subsData && subsData.length > 0) {
          setSubjects(subsData);
        } else {
          setSubjects(FALLBACK_SUBJECTS);
        }

        if (coursesData && coursesData.length > 0) {
          setPublishedCourses(coursesData);
        }
      } catch {
        setSubjects(FALLBACK_SUBJECTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Active Subject object
  const activeSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || null;
  }, [subjects, selectedSubjectId]);

  // Find if there is an exact published course matching this subject & grade
  const matchingCourse = useMemo(() => {
    if (!activeSubject || !selectedGradeLevel) return null;
    return publishedCourses.find((c) => {
      const matchSub =
        (c.subjectName && c.subjectName.toLowerCase() === activeSubject.name.toLowerCase()) ||
        c.code?.toLowerCase().includes(activeSubject.code.toLowerCase());
      const matchGrade = isGradeMatching(c.gradeLevel, selectedGradeLevel);
      return matchSub && matchGrade;
    });
  }, [activeSubject, selectedGradeLevel, publishedCourses]);

  // When selectedGradeLevel changes, attempt to load real course structure if available
  useEffect(() => {
    if (matchingCourse) {
      courseService
        .getStudentCourseStructure(matchingCourse.id)
        .then((detail) => {
          setActiveCourseDetail(detail);
          if (detail.chapters && detail.chapters.length > 0) {
            setOpenChapters({ [detail.chapters[0].id]: true });
          }
        })
        .catch(() => setActiveCourseDetail(null));
    } else {
      setActiveCourseDetail(null);
      setOpenChapters({ 'ch-1': true, 'ch-elem-1': true, 'ch-hs-1': true, 'ch-gen-1': true });
    }
  }, [matchingCourse, selectedGradeLevel]);

  // Toggle chapter accordion
  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // Compute curriculum chapters: either from real course detail or generated standard
  const chapters = useMemo(() => {
    if (activeCourseDetail && activeCourseDetail.chapters && activeCourseDetail.chapters.length > 0) {
      return activeCourseDetail.chapters;
    }
    if (!activeSubject || !selectedGradeLevel) return [];
    return generateStandardCurriculum(activeSubject.name, selectedGradeLevel);
  }, [activeCourseDetail, activeSubject, selectedGradeLevel]);

  const totalLessons = useMemo(() => {
    return chapters.reduce((acc, ch) => acc + (ch.lessons ? ch.lessons.length : 0), 0);
  }, [chapters]);

  // Education tier label
  const educationTier = useMemo(() => {
    if (!selectedGradeLevel) return 'Tiểu học';
    return getGradeGroup(selectedGradeLevel) || 'Phổ thông';
  }, [selectedGradeLevel]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ========================================================================= */}
        {/* LEVEL 1: MÔN HỌC (SUBJECTS VIEW)                                          */}
        {/* ========================================================================= */}
        {viewLevel === 'SUBJECTS' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#83C75D]/15 text-[#4e8231] border border-[#83C75D]/30">
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>Nền tảng học tập & Ôn luyện</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Kiến thức cơ bản
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  Hệ thống kiến thức trọng tâm, giáo trình chuẩn và bài giảng cốt lõi phân chia theo từng môn học và khối lớp. Chọn môn học bên dưới để bắt đầu khám phá.
                </p>
              </div>

              {/* Search Bar */}
              <div className="w-full md:w-80">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm môn học..."
                    value={subjectSearchQuery}
                    onChange={(e) => setSubjectSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#83C75D] shadow-2xs transition"
                  />
                </div>
              </div>
            </div>

            {/* Subjects Grid */}
            {isLoading ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
                <RotateCcw className="w-8 h-8 animate-spin text-[#83C75D]" />
                <p className="text-sm font-semibold">Đang tải danh mục môn học...</p>
              </div>
            ) : subjects.length === 0 ? (
              <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-8">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">Chưa có môn học nào</h3>
                <p className="text-xs text-slate-400 mt-1">Hệ thống đang cập nhật danh mục kiến thức.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {subjects
                  .filter((s) => {
                    if (!subjectSearchQuery.trim()) return true;
                    const q = subjectSearchQuery.toLowerCase();
                    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
                  })
                  .map((sub) => {
                    const icon = SUBJECT_ICONS[sub.code.toUpperCase()] || '📖';

                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubjectId(sub.id);
                          setViewLevel('GRADES');
                        }}
                        className="group bg-white border border-slate-200/90 hover:border-[#83C75D] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between hover:-translate-y-1"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-3xl p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:scale-110 transition-transform">
                              {icon}
                            </span>
                            <span className="px-3 py-1 bg-[#83C75D]/15 text-[#4e8231] font-bold text-xs rounded-full border border-[#83C75D]/30">
                              Lớp 1 — 12
                            </span>
                          </div>
                          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-[#4e8231] transition-colors">
                            {sub.name}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">Mã môn: {sub.code}</p>
                          {sub.description && (
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {sub.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#4e8231] group-hover:text-[#386221]">
                          <span>Khám phá các khối lớp</span>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 2: KHỐI LỚP (GRADES SELECTION VIEW)                                 */}
        {/* ========================================================================= */}
        {viewLevel === 'GRADES' && activeSubject && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Breadcrumb & Navigation */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                  <button
                    onClick={() => setViewLevel('SUBJECTS')}
                    className="hover:text-[#4e8231] transition-colors cursor-pointer"
                  >
                    Kiến thức cơ bản
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[#4e8231] font-bold">Môn {activeSubject.name}</span>
                </div>

                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                  <span className="text-2xl">{SUBJECT_ICONS[activeSubject.code.toUpperCase()] || '📖'}</span>
                  <span>Môn {activeSubject.name} — Chọn khối lớp</span>
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Chọn khối lớp từ Lớp 1 đến Đại học để xem chi tiết toàn bộ kiến thức cơ bản và giáo trình học tập tương ứng
                </p>
              </div>

              <button
                onClick={() => setViewLevel('SUBJECTS')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer self-start sm:self-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Chọn môn khác</span>
              </button>
            </div>

            {/* Grade Level Groups */}
            <div className="space-y-8">
              {GRADE_LEVEL_GROUPS.map((group, gIdx) => (
                <div key={gIdx} className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-5 h-5 text-[#4e8231]" />
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{group.label}</h2>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {group.grades.map((grade) => {
                      return (
                        <div
                          key={grade}
                          onClick={() => {
                            setSelectedGradeLevel(grade);
                            setViewLevel('CLASS_CONTENT');
                          }}
                          className="group bg-white border border-slate-200/90 hover:border-[#83C75D] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between hover:-translate-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900 group-hover:text-[#4e8231] transition-colors">
                              {grade}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                              Chuẩn GDPT
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 mt-3 group-hover:text-[#4e8231] flex items-center justify-between font-semibold">
                            <span>Xem kiến thức</span>
                            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 3: NỘI DUNG TRONG LỚP (MATCHING THE USER PHOTO DESIGN)              */}
        {/* ========================================================================= */}
        {viewLevel === 'CLASS_CONTENT' && activeSubject && selectedGradeLevel && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Back link */}
            <button
              onClick={() => setViewLevel('GRADES')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#4e8231] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách khối lớp</span>
            </button>

            {/* Hero Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden relative">
              <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
                <div className="space-y-4 max-w-2xl flex-1">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
                      {matchingCourse?.code || `${activeSubject.code}${selectedGradeLevel.replace(/\D/g, '') || '01'}`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#83C75D]/15 text-[#4e8231] border border-[#83C75D]/30">
                      {activeSubject.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                      {educationTier}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      Miễn phí (Free)
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {matchingCourse ? matchingCourse.name : `${activeSubject.name} ${selectedGradeLevel} cơ bản`}
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {matchingCourse?.description ||
                        `Hệ thống kiến thức nền tảng, bài giảng lý thuyết và bài tập rèn luyện kỹ năng cốt lõi dành cho học sinh ${selectedGradeLevel}.`}
                    </p>
                  </div>

                  {/* Meta stats */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#83C75D]/20 text-[#4e8231] flex items-center justify-center font-bold text-xs">
                        {matchingCourse?.creatorName ? matchingCourse.creatorName.charAt(0) : 'T'}
                      </div>
                      <span>
                        Giảng viên:{' '}
                        <strong className="text-slate-800">
                          {matchingCourse?.creatorName || 'Ban chuyên môn NQD-LMS'}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span>
                        {chapters.length} chương • {totalLessons} bài học
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span className="font-bold text-slate-800">4.8</span>
                      <span className="text-slate-400">(đánh giá chuẩn GDPT)</span>
                    </div>
                  </div>
                </div>

                {/* Right Box: Course Progress & Action Card */}
                <div className="w-full lg:w-80 rounded-2xl p-5 space-y-4 shrink-0 border bg-slate-50 border-slate-200/80">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Tiến độ khóa học</span>
                      <span className="text-xs font-bold text-[#4e8231]">0%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-[#83C75D] rounded-full transition-all duration-300" style={{ width: '0%' }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Đã hoàn thành 0/{totalLessons} bài</span>
                    </div>
                  </div>

                  {matchingCourse ? (
                    <Link
                      href={'/courses/' + matchingCourse.id}
                      className="w-full py-3.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-xs shadow-md shadow-[#83C75D]/25 transition-all inline-flex items-center justify-center gap-2 transform active:scale-95"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Tiếp tục bài học</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        const firstChapter = chapters[0];
                        if (firstChapter && firstChapter.lessons && firstChapter.lessons.length > 0) {
                          alert(`Bắt đầu học bài: ${firstChapter.lessons[0].title}`);
                        }
                      }}
                      className="w-full py-3.5 rounded-2xl bg-[#83C75D] hover:bg-[#72b44e] text-white font-bold text-xs shadow-md shadow-[#83C75D]/25 transition-all inline-flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Tiếp tục bài học</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Certificate & Completion Criteria Banner (matching yellow card in screenshot) */}
            <div className="bg-gradient-to-br from-white to-amber-50/40 border border-amber-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base">Chứng chỉ hoàn thành khóa học</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                        Đang hoàn thành 4 tiêu chí
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Để nhận chứng chỉ, học viên cần hoàn thành cả 4 điều kiện dưới đây.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 border border-amber-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Chưa đủ 4 điều kiện</span>
                  </span>
                </div>
              </div>

              {/* 4 Tiêu chí hoàn thành */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-amber-100">
                {/* 1. Bài học lý thuyết */}
                <div className="p-3.5 rounded-2xl border bg-white/80 border-slate-200 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      1. Bài học lý thuyết
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      0/{totalLessons}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Còn thiếu {totalLessons} bài học
                  </p>
                </div>

                {/* 2. Video bài giảng */}
                <div className="p-3.5 rounded-2xl border bg-white/80 border-slate-200 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <PlayCircle className="w-3.5 h-3.5 text-purple-600" />
                      2. Video bài giảng
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      0/1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Còn thiếu 1 video (xem hết không tua)
                  </p>
                </div>

                {/* 3. Bài tập luyện tập */}
                <div className="p-3.5 rounded-2xl border bg-white/80 border-slate-200 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5 text-amber-600" />
                      3. Bài tập luyện tập
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      0/{totalLessons}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Còn thiếu {totalLessons} bài tập chưa đạt
                  </p>
                </div>

                {/* 4. Bài kiểm tra / Thi */}
                <div className="p-3.5 rounded-2xl border bg-white/80 border-slate-200 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-rose-600" />
                      4. Bài kiểm tra / Thi
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      0/1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Còn thiếu 1 bài thi chưa đạt
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation (matching screenshot: green active tab) */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
              <button
                onClick={() => setActiveTab('syllabus')}
                className={'px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ' + (
                  activeTab === 'syllabus'
                    ? 'bg-[#83C75D] text-white shadow-sm shadow-[#83C75D]/25'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                )}
              >
                <BookOpen className="w-4 h-4" />
                <span>Giáo trình & Đánh giá</span>
              </button>

              <button
                onClick={() => setActiveTab('discussions')}
                className={'px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ' + (
                  activeTab === 'discussions'
                    ? 'bg-[#83C75D] text-white shadow-sm shadow-[#83C75D]/25'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Thảo luận & Hỏi đáp</span>
              </button>

              <button
                onClick={() => setActiveTab('announcements')}
                className={'px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ' + (
                  activeTab === 'announcements'
                    ? 'bg-[#83C75D] text-white shadow-sm shadow-[#83C75D]/25'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                )}
              >
                <Megaphone className="w-4 h-4" />
                <span>Thông báo</span>
              </button>
            </div>

            {/* TAB 1: SYLLABUS & CURRICULUM ACCORDION */}
            {activeTab === 'syllabus' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Giáo trình chi tiết</h2>
                  <span className="text-xs font-semibold text-slate-500">
                    {chapters.length} chương • {totalLessons} bài học
                  </span>
                </div>

                {chapters.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 text-xs">
                    Hiện chưa cập nhật chương mục nào cho khối lớp này.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chapters.map((chapter: any, chIdx: number) => {
                      const isOpen = !!openChapters[chapter.id || String(chIdx)];

                      return (
                        <div
                          key={chapter.id || chIdx}
                          className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all"
                        >
                          <button
                            onClick={() => toggleChapter(chapter.id || String(chIdx))}
                            className="w-full p-4 sm:px-6 flex items-center justify-between gap-4 text-left bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              {isOpen ? (
                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <div>
                                <h3 className="font-extrabold text-sm text-slate-900">
                                  {chapter.title}
                                </h3>
                                {chapter.description && (
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                    {chapter.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold text-slate-400 shrink-0 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                                {chapter.lessons ? chapter.lessons.length : 0} bài
                              </span>
                            </div>
                          </button>

                          {isOpen && (
                            <div className="divide-y divide-slate-100 border-t border-slate-100">
                              {!chapter.lessons || chapter.lessons.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400">
                                  Chương này chưa có bài học nào.
                                </div>
                              ) : (
                                chapter.lessons.map((lesson: any, lesIdx: number) => {
                                  return (
                                    <div
                                      key={lesson.id || lesIdx}
                                      className="p-4 sm:px-6 flex items-center justify-between gap-4 transition-colors group hover:bg-[#83C75D]/5"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors bg-slate-100 text-slate-500 group-hover:bg-[#83C75D]/20 group-hover:text-[#4e8231]">
                                          <PlayCircle className="w-4 h-4" />
                                        </div>
                                        <div className="truncate">
                                          <div className="flex items-center gap-2">
                                            <p className="text-xs sm:text-sm font-bold truncate transition-colors text-slate-800 group-hover:text-[#4e8231]">
                                              {lesson.displayOrder}. {lesson.title}
                                            </p>
                                          </div>
                                          {lesson.summary && (
                                            <p className="text-xs text-slate-400 truncate mt-0.5">
                                              {lesson.summary}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 shrink-0">
                                        {lesson.estimatedMinutes && (
                                          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                                            <Clock className="w-3 h-3" />
                                            <span>{lesson.estimatedMinutes} phút</span>
                                          </span>
                                        )}

                                        {matchingCourse ? (
                                          <Link
                                            href={`/courses/${matchingCourse.id}/lessons/${lesson.id}`}
                                            className="px-3 py-1.5 rounded-xl bg-[#83C75D]/15 text-[#4e8231] text-xs font-bold hover:bg-[#83C75D] hover:text-white transition-all inline-flex items-center gap-1"
                                          >
                                            <span>Học bài</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          </Link>
                                        ) : (
                                          <button
                                            onClick={() => alert(`Xem bài học: ${lesson.title}`)}
                                            className="px-3 py-1.5 rounded-xl bg-[#83C75D]/15 text-[#4e8231] text-xs font-bold hover:bg-[#83C75D] hover:text-white transition-all inline-flex items-center gap-1 cursor-pointer"
                                          >
                                            <span>Học bài</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DISCUSSIONS */}
            {activeTab === 'discussions' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Thảo luận môn học & hỏi đáp kiến thức</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Khu vực trao đổi phương pháp giải toán, thảo luận bài tập khó và nhận giải đáp từ giáo viên và cộng đồng học viên {selectedGradeLevel}.
                </p>
                <button
                  onClick={() => alert('Chức năng gửi câu hỏi thảo luận đang được kết nối.')}
                  className="px-4 py-2 rounded-xl bg-[#83C75D] hover:bg-[#72b44e] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Đặt câu hỏi thảo luận
                </button>
              </div>
            )}

            {/* TAB 3: ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <Megaphone className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Thông báo chuyên môn & Lịch học</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Cập nhật các thông tin hướng dẫn ôn tập, đề cương kiểm tra định kỳ và tài liệu bổ trợ mới nhất cho môn {activeSubject.name} {selectedGradeLevel}.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
