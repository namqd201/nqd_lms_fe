export interface GradeGroup {
  level: string;
  label: string;
  grades: string[];
}

export const GRADE_LEVEL_GROUPS: GradeGroup[] = [
  {
    level: 'Tiểu học',
    label: '🏫 Tiểu học (Lớp 1 - 5)',
    grades: ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'],
  },
  {
    level: 'Trung học cơ sở',
    label: '🏫 Trung học cơ sở (Lớp 6 - 9)',
    grades: ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'],
  },
  {
    level: 'Trung học phổ thông',
    label: '🏫 Trung học phổ thông (Lớp 10 - 12)',
    grades: ['Lớp 10', 'Lớp 11', 'Lớp 12'],
  },
  {
    level: 'Đại học / Cao đẳng',
    label: '🎓 Đại học / Cao đẳng (Năm 1 - 4)',
    grades: ['Năm nhất', 'Năm 2', 'Năm 3', 'Năm 4'],
  },
];

export const ALL_GRADES: string[] = GRADE_LEVEL_GROUPS.flatMap((g) => g.grades);

export const getGradeGroup = (grade?: string | null): string => {
  if (!grade) return '';
  const gTrim = grade.trim().toLowerCase();
  for (const group of GRADE_LEVEL_GROUPS) {
    if (
      group.grades.some((gr) => gr.toLowerCase() === gTrim) ||
      group.level.toLowerCase() === gTrim ||
      gTrim.includes(group.level.toLowerCase())
    ) {
      return group.level;
    }
  }
  return grade;
};

export const normalizeGrade = (grade?: string | null): string => {
  if (!grade) return '';
  const g = grade.trim().toLowerCase();

  // Match class number 1-12 (e.g. "Lớp 1", "lop 1", "khối 1", "Grade 1", "1")
  const classMatch = g.match(/(?:lớp|lop|grade|khối|khoi)?\s*(\d+)/i);
  if (classMatch) {
    const num = parseInt(classMatch[1], 10);
    if (num >= 1 && num <= 12) {
      return `Lớp ${num}`;
    }
  }

  // Match University years
  if (g.includes('năm nhất') || g.includes('nam nhat') || g.includes('năm 1') || g.includes('nam 1')) {
    return 'Năm nhất';
  }
  if (g.includes('năm 2') || g.includes('nam 2') || g.includes('năm hai')) {
    return 'Năm 2';
  }
  if (g.includes('năm 3') || g.includes('nam 3') || g.includes('năm ba')) {
    return 'Năm 3';
  }
  if (g.includes('năm 4') || g.includes('nam 4') || g.includes('năm tư') || g.includes('năm bốn')) {
    return 'Năm 4';
  }

  return grade.trim();
};

export const isGradeMatching = (questionGrade?: string | null, targetGrade?: string | null): boolean => {
  if (!targetGrade || targetGrade === 'ALL') return true;
  if (!questionGrade) return false;

  const qNorm = normalizeGrade(questionGrade).toLowerCase();
  const tNorm = normalizeGrade(targetGrade).toLowerCase();

  return qNorm === tNorm;
};

