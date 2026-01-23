"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "./types";

interface ContentCalendarProps {
  items: CalendarItem[];
  onMonthChange: (start: string, end: string) => void;
  onItemClick: (item: CalendarItem) => void;
}

export function ContentCalendar({
  items,
  onMonthChange,
  onItemClick,
}: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd]
  );

  // Group items by date
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, CalendarItem[]> = {};
    items.forEach((item) => {
      if (item.start_date) {
        const dateKey = format(new Date(item.start_date), "yyyy-MM-dd");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(item);
      }
    });
    return grouped;
  }, [items]);

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    const start = format(startOfMonth(newDate), "yyyy-MM-dd");
    const end = format(endOfMonth(newDate), "yyyy-MM-dd");
    onMonthChange(start, end);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    const start = format(startOfMonth(newDate), "yyyy-MM-dd");
    const end = format(endOfMonth(newDate), "yyyy-MM-dd");
    onMonthChange(start, end);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const start = format(startOfMonth(today), "yyyy-MM-dd");
    const end = format(endOfMonth(today), "yyyy-MM-dd");
    onMonthChange(start, end);
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Days */}
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayItems = itemsByDate[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={dateKey}
                className={cn(
                  "bg-background min-h-[100px] p-1",
                  !isCurrentMonth && "bg-muted/30"
                )}
              >
                {/* Day number */}
                <div className="flex justify-end mb-1">
                  <span
                    className={cn(
                      "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                      isCurrentDay && "bg-primary text-primary-foreground",
                      !isCurrentMonth && "text-muted-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Items */}
                <ScrollArea className="h-[70px]">
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map((item) => (
                      <button
                        key={`${item.item_type}-${item.item_id}`}
                        className="w-full text-left"
                        onClick={() => onItemClick(item)}
                      >
                        <div
                          className="text-xs px-1.5 py-0.5 rounded truncate"
                          style={{
                            backgroundColor: item.color + "20",
                            borderLeft: `2px solid ${item.color}`,
                          }}
                        >
                          {item.start_time && (
                            <span className="text-muted-foreground mr-1">
                              {item.start_time.slice(0, 5)}
                            </span>
                          )}
                          {item.title}
                        </div>
                      </button>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1.5">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
