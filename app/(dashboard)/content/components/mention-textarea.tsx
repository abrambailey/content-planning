"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { User } from "./types";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  users: User[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export interface MentionTextareaRef {
  focus: () => void;
}

export const MentionTextarea = forwardRef<MentionTextareaRef, MentionTextareaProps>(
  function MentionTextarea(
    { value, onChange, onKeyDown, users, placeholder, className, disabled },
    ref
  ) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [mentionSearch, setMentionSearch] = useState("");
    const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    // Filter users based on search
    const filteredUsers = users.filter((user) => {
      if (!mentionSearch) return true;
      const search = mentionSearch.toLowerCase();
      const name = user.display_name?.toLowerCase() || "";
      const email = user.email.toLowerCase();
      return name.includes(search) || email.includes(search);
    }).slice(0, 5); // Limit to 5 suggestions

    const insertMention = useCallback(
      (user: User) => {
        if (mentionStartPos === null) return;

        const before = value.slice(0, mentionStartPos);
        const after = value.slice(textareaRef.current?.selectionStart || mentionStartPos);
        const mentionText = user.display_name
          ? `@${user.display_name.replace(/\s+/g, "")} `
          : `@${user.email} `;

        onChange(before + mentionText + after);
        setShowSuggestions(false);
        setMentionSearch("");
        setMentionStartPos(null);

        // Focus and set cursor position after the mention
        setTimeout(() => {
          if (textareaRef.current) {
            const newPos = before.length + mentionText.length;
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newPos, newPos);
          }
        }, 0);
      },
      [value, onChange, mentionStartPos]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart;
        onChange(newValue);

        // Check if we should show mention suggestions
        const textBeforeCursor = newValue.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
          const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
          // Only show if @ is at start or preceded by space, and no space after @
          const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : " ";
          if ((charBeforeAt === " " || charBeforeAt === "\n" || lastAtIndex === 0) && !textAfterAt.includes(" ")) {
            setShowSuggestions(true);
            setMentionSearch(textAfterAt);
            setMentionStartPos(lastAtIndex);
            setSuggestionIndex(0);
            return;
          }
        }

        setShowSuggestions(false);
        setMentionSearch("");
        setMentionStartPos(null);
      },
      [onChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions && filteredUsers.length > 0) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSuggestionIndex((prev) =>
              prev < filteredUsers.length - 1 ? prev + 1 : 0
            );
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setSuggestionIndex((prev) =>
              prev > 0 ? prev - 1 : filteredUsers.length - 1
            );
            return;
          }
          if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            insertMention(filteredUsers[suggestionIndex]);
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setShowSuggestions(false);
            return;
          }
        }

        onKeyDown?.(e);
      },
      [showSuggestions, filteredUsers, suggestionIndex, insertMention, onKeyDown]
    );

    // Close suggestions when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          suggestionsRef.current &&
          !suggestionsRef.current.contains(e.target as Node) &&
          textareaRef.current &&
          !textareaRef.current.contains(e.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          rows={1}
        />

        {showSuggestions && filteredUsers.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute left-0 right-0 bottom-full mb-1 bg-popover border rounded-md shadow-md z-50 overflow-hidden"
          >
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-accent",
                  index === suggestionIndex && "bg-accent"
                )}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSuggestionIndex(index)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {user.display_name || user.email.split("@")[0]}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);
