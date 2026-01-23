"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import type { ContentItem, WorkflowStatus } from "./types";

interface ContentKanbanProps {
  items: ContentItem[];
  statuses: WorkflowStatus[];
  onItemClick: (item: ContentItem) => void;
  onStatusChange: (itemId: number, newStatusId: number) => Promise<void>;
  onEditAssignments?: (item: ContentItem) => void;
  onEditDates?: (item: ContentItem) => void;
  onViewAttachments?: (item: ContentItem) => void;
  onViewComments?: (item: ContentItem) => void;
  onDelete?: (item: ContentItem) => void;
}

export function ContentKanban({
  items,
  statuses,
  onItemClick,
  onStatusChange,
  onEditAssignments,
  onEditDates,
  onViewAttachments,
  onViewComments,
  onDelete,
}: ContentKanbanProps) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group items by status
  const itemsByStatus = useMemo(() => {
    const grouped: Record<number, ContentItem[]> = {};
    statuses.forEach((status) => {
      grouped[status.id] = [];
    });
    items.forEach((item) => {
      const statusId = item.workflow_status?.id;
      if (statusId && grouped[statusId]) {
        grouped[statusId].push(item);
      }
    });
    return grouped;
  }, [items, statuses]);

  const activeItem = useMemo(
    () => (activeId ? items.find((i) => i.id === activeId) : null),
    [activeId, items]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItemId = active.id as number;
    const overId = over.id as string;

    // Check if dropped on a column
    if (overId.startsWith("column-")) {
      const newStatusId = Number(overId.replace("column-", ""));
      const activeItem = items.find((i) => i.id === activeItemId);

      if (activeItem && activeItem.workflow_status?.id !== newStatusId) {
        await onStatusChange(activeItemId, newStatusId);
      }
    }
  };

  // Sort statuses by display_order, filter out terminal statuses from main view
  const sortedStatuses = useMemo(
    () =>
      [...statuses]
        .filter((s) => !s.is_terminal)
        .sort((a, b) => a.display_order - b.display_order),
    [statuses]
  );

  // Include terminal statuses at the end
  const terminalStatuses = useMemo(
    () =>
      [...statuses]
        .filter((s) => s.is_terminal)
        .sort((a, b) => a.display_order - b.display_order),
    [statuses]
  );

  const allStatuses = [...sortedStatuses, ...terminalStatuses];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex gap-4 p-1">
          {allStatuses.map((status) => (
            <KanbanColumn
              key={status.id}
              status={status}
              items={itemsByStatus[status.id] || []}
              onItemClick={onItemClick}
              onEditAssignments={onEditAssignments}
              onEditDates={onEditDates}
              onViewAttachments={onViewAttachments}
              onViewComments={onViewComments}
              onDelete={onDelete}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay>
        {activeItem && (
          <div className="w-[280px]">
            <KanbanCard item={activeItem} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
