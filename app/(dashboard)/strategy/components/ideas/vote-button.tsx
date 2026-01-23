"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  voteCount: number;
  userVote: 1 | -1 | null;
  onVote: (vote: 1 | -1) => void;
  disabled?: boolean;
}

export function VoteButton({
  voteCount,
  userVote,
  onVote,
  disabled,
}: VoteButtonProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          userVote === 1 && "text-green-600 bg-green-50 hover:bg-green-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onVote(1);
        }}
        disabled={disabled}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      <span
        className={cn(
          "text-sm font-medium min-w-[2ch] text-center",
          voteCount > 0 && "text-green-600",
          voteCount < 0 && "text-red-600"
        )}
      >
        {voteCount}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          userVote === -1 && "text-red-600 bg-red-50 hover:bg-red-100"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onVote(-1);
        }}
        disabled={disabled}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
