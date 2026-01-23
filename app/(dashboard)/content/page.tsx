"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { useQueryStates, parseAsString, parseAsArrayOf, parseAsInteger } from "nuqs";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Plus, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ContentFiltersPanel } from "./components/content-filters";
import { ContentDataTable } from "./components/content-data-table";
import { ContentKanban } from "./components/content-kanban";
import { ContentCalendar } from "./components/content-calendar";
import { ContentEditModal } from "./components/content-edit-modal";
import { ViewToggle } from "./components/view-toggle";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { QuickEditAssignments } from "./components/quick-edit-assignments";
import { QuickEditDates } from "./components/quick-edit-dates";
import {
  getContentItems,
  getFilterOptions,
  getCalendarItems,
  deleteContentItem,
  changeWorkflowStatus,
} from "./actions";
import type {
  ContentItem,
  ContentFilters,
  ContentFilterOptions,
  ContentView,
  CalendarItem,
} from "./components/types";

// URL state parsers
const filterParsers = {
  view: parseAsString.withDefault("kanban"),
  search: parseAsString.withDefault(""),
  statuses: parseAsArrayOf(parseAsString).withDefault([]),
  types: parseAsArrayOf(parseAsString).withDefault([]),
  campaigns: parseAsArrayOf(parseAsInteger).withDefault([]),
  assignees: parseAsArrayOf(parseAsString).withDefault([]),
  priorities: parseAsArrayOf(parseAsString).withDefault([]),
  item: parseAsInteger,
  comment: parseAsInteger,
};

export default function ContentPage() {
  const [urlState, setUrlState] = useQueryStates(filterParsers, {
    history: "push",
  });

  const [items, setItems] = useState<ContentItem[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<ContentFilterOptions>({
    statuses: [],
    types: [],
    campaigns: [],
    users: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Dialog states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ContentItem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Quick edit dialog states (shortcuts from table/kanban)
  const [assignmentsDialogOpen, setAssignmentsDialogOpen] = useState(false);
  const [assignmentsItem, setAssignmentsItem] = useState<ContentItem | null>(null);
  const [datesDialogOpen, setDatesDialogOpen] = useState(false);
  const [datesItem, setDatesItem] = useState<ContentItem | null>(null);

  // Convert URL state to filters
  const filters: ContentFilters = useMemo(
    () => ({
      search: urlState.search,
      statuses: urlState.statuses,
      types: urlState.types,
      campaigns: urlState.campaigns,
      assignees: urlState.assignees,
      priorities: urlState.priorities as ContentFilters["priorities"],
    }),
    [urlState]
  );

  const view = urlState.view as ContentView;

  // Fetch filter options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      const options = await getFilterOptions();
      setFilterOptions(options);
    };
    fetchOptions();
  }, []);

  // Fetch content items
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const data = await getContentItems();
    setItems(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Fetch calendar items when view is calendar
  useEffect(() => {
    if (view === "calendar") {
      const today = new Date();
      const start = format(startOfMonth(today), "yyyy-MM-dd");
      const end = format(endOfMonth(today), "yyyy-MM-dd");
      getCalendarItems(start, end).then(setCalendarItems);
    }
  }, [view]);

  // Open modal from URL params (e.g., from notification link)
  useEffect(() => {
    if (urlState.item && items.length > 0 && !isLoading) {
      const itemToEdit = items.find((i) => i.id === urlState.item);
      if (itemToEdit) {
        setEditingItem(itemToEdit);
        setEditModalOpen(true);
      }
    }
  }, [urlState.item, items, isLoading]);

  // Clear URL params when modal closes
  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      setEditModalOpen(open);
      if (!open && urlState.item) {
        setUrlState({ item: null, comment: null });
      }
    },
    [urlState.item, setUrlState]
  );

  // Filter items client-side
  const filteredItems = useMemo(() => {
    let result = items;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.content_type?.name.toLowerCase().includes(searchLower) ||
          item.campaign?.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.statuses.length > 0) {
      result = result.filter(
        (item) =>
          item.workflow_status &&
          filters.statuses.includes(item.workflow_status.slug)
      );
    }

    if (filters.types.length > 0) {
      result = result.filter(
        (item) =>
          item.content_type && filters.types.includes(item.content_type.slug)
      );
    }

    if (filters.campaigns.length > 0) {
      result = result.filter(
        (item) => item.campaign && filters.campaigns.includes(item.campaign.id)
      );
    }

    if (filters.assignees.length > 0) {
      result = result.filter((item) =>
        item.assignments.some((a) => filters.assignees.includes(a.user_id))
      );
    }

    if (filters.priorities.length > 0) {
      result = result.filter((item) =>
        filters.priorities.includes(item.priority)
      );
    }

    return result;
  }, [items, filters]);

  // Handlers
  const handleFiltersChange = useCallback(
    (newFilters: ContentFilters) => {
      startTransition(() => {
        setUrlState({
          search: newFilters.search,
          statuses: newFilters.statuses,
          types: newFilters.types,
          campaigns: newFilters.campaigns,
          assignees: newFilters.assignees,
          priorities: newFilters.priorities,
        });
      });
    },
    [setUrlState]
  );

  const handleViewChange = useCallback(
    (newView: ContentView) => {
      setUrlState({ view: newView });
    },
    [setUrlState]
  );

  const handleCreateNew = () => {
    setEditingItem(null);
    setEditModalOpen(true);
  };

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleDelete = (item: ContentItem) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleView = (item: ContentItem) => {
    handleEdit(item);
  };

  const handleModalSave = async () => {
    await fetchItems();
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      await deleteContentItem(deletingItem.id);
      await fetchItems();
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    }
  };

  const handleStatusChange = async (itemId: number, newStatusId: number) => {
    // Find the new status object
    const newStatus = filterOptions.statuses.find((s) => s.id === newStatusId);
    if (!newStatus) return;

    // Optimistic update - update local state immediately
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, workflow_status: newStatus }
          : item
      )
    );

    // Then update the server (don't await/refetch to avoid reload)
    const result = await changeWorkflowStatus(itemId, newStatusId);

    // If server update failed, revert by refetching
    if (!result.success) {
      await fetchItems();
    }
  };

  const handleCalendarMonthChange = async (start: string, end: string) => {
    const items = await getCalendarItems(start, end);
    setCalendarItems(items);
  };

  const handleCalendarItemClick = (item: CalendarItem) => {
    if (item.item_type === "content_item" || item.item_type === "content_due") {
      const contentItem = items.find((i) => i.id === item.item_id);
      if (contentItem) {
        handleEdit(contentItem);
      }
    }
  };

  // Quick edit handlers
  const handleEditAssignments = (item: ContentItem) => {
    setAssignmentsItem(item);
    setAssignmentsDialogOpen(true);
  };

  const handleEditDates = (item: ContentItem) => {
    setDatesItem(item);
    setDatesDialogOpen(true);
  };

  const handleViewComments = (item: ContentItem) => {
    // Open the edit modal - comments are available in the side panel
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleViewAttachments = (item: ContentItem) => {
    // Open the edit modal - attachments are available in the tabs
    setEditingItem(item);
    setEditModalOpen(true);
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    count += filters.statuses.length;
    count += filters.types.length;
    count += filters.campaigns.length;
    count += filters.assignees.length;
    count += filters.priorities.length;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Content
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your content pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onViewChange={handleViewChange} />
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4" />
            New content
          </Button>
        </div>
      </div>

      {/* Filters (not shown in calendar view) */}
      {view !== "calendar" && (
        <Collapsible
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          className="group/collapsible rounded-lg border bg-card"
        >
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t p-4">
              <ContentFiltersPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
                filterOptions={filterOptions}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Results count */}
      {view !== "calendar" && (
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            `${filteredItems.length} content items`
          )}
        </div>
      )}

      {/* Content View */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : view === "list" ? (
        <ContentDataTable
          data={filteredItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onCreateNew={handleCreateNew}
          onEditAssignments={handleEditAssignments}
          onEditDates={handleEditDates}
          onViewAttachments={handleViewAttachments}
          onViewComments={handleViewComments}
        />
      ) : view === "kanban" ? (
        <ContentKanban
          items={filteredItems}
          statuses={filterOptions.statuses}
          onItemClick={handleView}
          onStatusChange={handleStatusChange}
          onEditAssignments={handleEditAssignments}
          onEditDates={handleEditDates}
          onViewAttachments={handleViewAttachments}
          onViewComments={handleViewComments}
          onDelete={handleDelete}
        />
      ) : (
        <ContentCalendar
          items={calendarItems}
          onMonthChange={handleCalendarMonthChange}
          onItemClick={handleCalendarItemClick}
        />
      )}

      {/* Edit Modal */}
      <ContentEditModal
        open={editModalOpen}
        onOpenChange={handleModalOpenChange}
        item={editingItem}
        filterOptions={filterOptions}
        onSave={handleModalSave}
        highlightCommentId={urlState.comment}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete content"
        description={`Are you sure you want to delete "${deletingItem?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />

      {/* Quick Edit Assignments Dialog */}
      {assignmentsItem && (
        <QuickEditAssignments
          open={assignmentsDialogOpen}
          onOpenChange={setAssignmentsDialogOpen}
          item={assignmentsItem}
          users={filterOptions.users}
          onSuccess={fetchItems}
        />
      )}

      {/* Quick Edit Dates Dialog */}
      {datesItem && (
        <QuickEditDates
          open={datesDialogOpen}
          onOpenChange={setDatesDialogOpen}
          item={datesItem}
          onSuccess={fetchItems}
        />
      )}

    </div>
  );
}
