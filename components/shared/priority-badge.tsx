"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high" | "urgent";
  showIcon?: boolean;
  className?: string;
}

const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: ArrowDown,
  },
  medium: {
    label: "Medium",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Minus,
  },
  high: {
    label: "High",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: ArrowUp,
  },
  urgent: {
    label: "Urgent",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: AlertCircle,
  },
};

export function PriorityBadge({
  priority,
  showIcon = true,
  className,
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.color, className)}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
