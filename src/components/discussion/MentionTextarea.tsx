'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MentionCandidateResponse } from '@/types/discussion';
import { AtSign, GraduationCap, User as UserIcon } from 'lucide-react';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  candidates: MentionCandidateResponse[];
  onMentionedUsersChange: (ids: string[]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  candidates,
  onMentionedUsersChange,
  placeholder = 'Nhập nội dung... (Gõ @ để nhắc đến giảng viên hoặc bạn cùng lớp)',
  rows = 3,
  className = '',
  disabled = false,
  required = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mention State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [mentionedMap, setMentionedMap] = useState<Map<string, string>>(new Map()); // fullName -> id

  // Filter candidates based on query
  const filteredCandidates = candidates.filter((c) => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(lowerQuery) ||
      (c.email && c.email.toLowerCase().includes(lowerQuery))
    );
  }).slice(0, 6); // Top 6 candidates

  // Sync mentionedMap with parent
  const syncMentionedIds = useCallback(
    (newMap: Map<string, string>, currentText: string) => {
      // Only keep IDs of users whose @FullName is still in the text
      const validIds: string[] = [];
      newMap.forEach((id, name) => {
        if (currentText.includes(`@${name}`)) {
          validIds.push(id);
        }
      });
      onMentionedUsersChange(validIds);
    },
    [onMentionedUsersChange]
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(text);

    // Look backward from cursorPos to find '@'
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if '@' is at start of string or preceded by whitespace/newline
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || charBeforeAt === '\t') {
        const potentialQuery = textBeforeCursor.slice(lastAtIndex + 1);
        // If there's no newline or too many spaces in the query, open popup
        if (!potentialQuery.includes('\n') && potentialQuery.length <= 25) {
          setMentionStartIndex(lastAtIndex);
          setQuery(potentialQuery);
          setIsOpen(true);
          setSelectedIndex(0);
          syncMentionedIds(mentionedMap, text);
          return;
        }
      }
    }

    setIsOpen(false);
    syncMentionedIds(mentionedMap, text);
  };

  const insertMention = (candidate: MentionCandidateResponse) => {
    if (!textareaRef.current || mentionStartIndex === -1) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;

    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(cursorPos);
    const mentionText = `@${candidate.fullName} `;

    const newText = beforeMention + mentionText + afterMention;
    onChange(newText);

    // Update mentioned map
    const newMap = new Map(mentionedMap);
    newMap.set(candidate.fullName, candidate.id);
    setMentionedMap(newMap);
    syncMentionedIds(newMap, newText);

    setIsOpen(false);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = beforeMention.length + mentionText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen || filteredCandidates.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCandidates.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCandidates.length) % filteredCandidates.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(filteredCandidates[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        className={className}
      />

      {/* Autocomplete Popup */}
      {isOpen && filteredCandidates.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bottom-full mb-1 left-0 w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 font-sans"
        >
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5 text-[#83C75D]">
              <AtSign className="w-3.5 h-3.5" />
              Nhắc đến thành viên ({filteredCandidates.length})
            </span>
            <span className="text-[10px] text-slate-400">Dùng ↑ ↓ Enter để chọn</span>
          </div>

          <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
            {filteredCandidates.map((candidate, idx) => {
              const isSelected = idx === selectedIndex;
              const isTeacher = candidate.roleInCourse === 'TEACHER';

              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => insertMention(candidate)}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-[#83C75D]/10 text-slate-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isTeacher ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-[#83C75D]'
                      }`}
                    >
                      {candidate.avatarUrl ? (
                        <img
                          src={candidate.avatarUrl}
                          alt={candidate.fullName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        candidate.fullName?.charAt(0)?.toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {candidate.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {candidate.email}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isTeacher ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                        <GraduationCap className="w-3 h-3" />
                        Giảng viên
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <UserIcon className="w-3 h-3" />
                        Học viên
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
