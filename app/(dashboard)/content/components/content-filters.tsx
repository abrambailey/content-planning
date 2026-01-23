"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentFilters, ContentFilterOptions } from "./types";
import { DEFAULT_CONTENT_FILTERS } from "./types";

interface ContentFiltersProps {
  filters: ContentFilters;
  onFiltersChange: (filters: ContentFilters) => void;
  filterOptions: ContentFilterOptions;
}

export function ContentFiltersPanel({
  filters,
  onFiltersChange,
  filterOptions,
}: ContentFiltersProps) {
  const updateFilter = useCallback(
    <K extends keyof ContentFilters>(key: K, value: ContentFilters[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange(DEFAULT_CONTENT_FILTERS);
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.search ||
    filters.statuses.length > 0 ||
    filters.types.length > 0 ||
    filters.campaigns.length > 0 ||
    filters.assignees.length > 0 ||
    filters.priorities.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {/* Search */}
        <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
          <Input
            placeholder="Search content..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <MultiSelectFilter
          placeholder="Status"
          options={filterOptions.statuses.map((s) => ({
            value: s.slug,
            label: s.name,
          }))}
          selected={filters.statuses}
          onSelectionChange={(value) => updateFilter("statuses", value)}
        />

        {/* Content Type Filter */}
        <MultiSelectFilter
          placeholder="Type"
          options={filterOptions.types.map((t) => ({
            value: t.slug,
            label: t.name,
          }))}
          selected={filters.types}
          onSelectionChange={(value) => updateFilter("types", value)}
        />

        {/* Campaign Filter */}
        <MultiSelectFilter
          placeholder="Campaign"
          options={filterOptions.campaigns.map((c) => ({
            value: String(c.id),
            label: c.name,
          }))}
          selected={filters.campaigns.map(String)}
          onSelectionChange={(value) =>
            updateFilter(
              "campaigns",
              value.map((v) => Number(v))
            )
          }
        />

        {/* Assignee Filter */}
        <MultiSelectFilter
          placeholder="Assignee"
          options={filterOptions.users.map((u) => ({
            value: u.id,
            label: u.display_name || u.email,
          }))}
          selected={filters.assignees}
          onSelectionChange={(value) => updateFilter("assignees", value)}
        />

        {/* Priority Filter */}
        <MultiSelectFilter
          placeholder="Priority"
          options={[
            { value: "urgent", label: "Urgent" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
          selected={filters.priorities}
          onSelectionChange={(value) =>
            updateFilter("priorities", value as ContentFilters["priorities"])
          }
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

interface MultiSelectFilterProps {
  placeholder: string;
  options: { value: string; label: string }[];
  selected: string[];
  onSelectionChange: (value: string[]) => void;
}

function MultiSelectFilter({
  placeholder,
  options,
  selected,
  onSelectionChange,
}: MultiSelectFilterProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onSelectionChange(selected.filter((s) => s !== option));
    } else {
      onSelectionChange([...selected, option]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-9 w-full justify-between font-normal"
        >
          {selected.length > 0 ? (
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {selected.length}
              </Badge>
              <span className="truncate text-xs text-muted-foreground">
                {placeholder}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search...`} className="h-8 text-sm" />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-xs">
              No results.
            </CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[200px]">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggleOption(option.value)}
                    className="text-sm"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3.5 w-3.5",
                        selected.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
