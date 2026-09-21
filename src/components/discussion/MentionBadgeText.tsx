import React from 'react';

interface MentionBadgeTextProps {
  content: string;
  className?: string;
}

export const MentionBadgeText: React.FC<MentionBadgeTextProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split text by mention patterns: @ followed by characters until special punctuation or end of name
  // Format: @Name (e.g. @Quách Duy Nam or @Nguyen Van A)
  const regex = /(@[A-Za-z0-9À-ỹ_]+(?:\s+[A-Za-z0-9À-ỹ_]+)*)/g;
  const parts = content.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('@') && part.length > 1) {
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
