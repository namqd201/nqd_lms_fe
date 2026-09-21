import React, { useMemo } from 'react';

interface MentionCandidateLike {
  id?: string;
  fullName?: string;
  name?: string;
}

interface MentionBadgeTextProps {
  content: string;
  className?: string;
  candidates?: MentionCandidateLike[];
}

export const MentionBadgeText: React.FC<MentionBadgeTextProps> = ({
  content,
  className = '',
  candidates = [],
}) => {
  if (!content) return null;

  const parts = useMemo(() => {
    // 1. If candidate names are available, build specific matching pattern
    const candidateNames = (candidates || [])
      .map((c) => (c.fullName || c.name || '').trim())
      .filter((name) => name.length > 0)
      .sort((a, b) => b.length - a.length)
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const candidatePattern =
      candidateNames.length > 0 ? `@(?:${candidateNames.join('|')})` : null;

    // 2. Generic pattern for names: @Word followed by capitalized words (e.g. @Nguyễn Văn A, @Duy Quang, @admin)
    // \p{Lu} = Uppercase Letter, \p{Ll} = Lowercase Letter, \p{L} = Any Letter, \p{N} = Number
    const generalPattern = '@[\\p{L}\\p{N}_]+(?:\\s+[\\p{Lu}][\\p{Ll}\\p{N}_]*)*';

    const fullPattern = candidatePattern
      ? `(${candidatePattern}|${generalPattern})`
      : `(${generalPattern})`;

    const regex = new RegExp(fullPattern, 'gu');
    return content.split(regex);
  }, [content, candidates]);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part && part.startsWith('@') && part.length > 1) {
          return (
            <span
              key={index}
              className="inline-flex items-center font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-1.5 py-0.5 rounded-md text-[11px] mx-0.5 hover:bg-indigo-100 transition-colors"
            >
              {part}
            </span>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};

export default MentionBadgeText;
