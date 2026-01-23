"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductFilters, FEATURE_GROUPS } from "./types";

interface FilterPanelProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  filterOptions: {
    brands: string[];
    productTypes: string[];
    formFactors: string[];
    hearingLossLevels: string[];
  };
}

export function FilterPanel({
  filters,
  onFiltersChange,
  filterOptions,
}: FilterPanelProps) {
  const updateFilter = useCallback(
    <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const toggleFeature = useCallback(
    (feature: string) => {
      const currentValue = filters.features[feature as keyof typeof filters.features];
      const newFeatures = { ...filters.features };
      if (currentValue === undefined) {
        newFeatures[feature as keyof typeof newFeatures] = true;
      } else {
        delete newFeatures[feature as keyof typeof newFeatures];
      }
      updateFilter("features", newFeatures);
    },
    [filters.features, updateFilter]
  );

  return (
    <div className="space-y-4">
      {/* Row 1: Search + Dropdown Filters */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Search */}
          <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
            <Input
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </div>

          {/* Dropdown Filters */}
          <MultiSelectFilter
            placeholder="Brand"
            options={filterOptions.brands}
            selected={filters.brands}
            onSelectionChange={(value) => updateFilter("brands", value)}
          />
          <MultiSelectFilter
            placeholder="Type"
            options={filterOptions.productTypes}
            selected={filters.productTypes}
            onSelectionChange={(value) => updateFilter("productTypes", value)}
          />
          <MultiSelectFilter
            placeholder="Class"
            options={["OTC", "Rx"]}
            selected={filters.productClasses}
            onSelectionChange={(value) =>
              updateFilter("productClasses", value as ("OTC" | "Rx")[])
            }
          />
          <MultiSelectFilter
            placeholder="Form Factor"
            options={filterOptions.formFactors}
            selected={filters.formFactors}
            onSelectionChange={(value) => updateFilter("formFactors", value)}
          />
          <MultiSelectFilter
            placeholder="Hearing Loss"
            options={filterOptions.hearingLossLevels}
            selected={filters.hearingLossLevels}
            onSelectionChange={(value) => updateFilter("hearingLossLevels", value)}
          />
        </div>
      </div>

      {/* Row 2: Hardware Features */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Hardware Features
        </Label>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:flex xl:flex-wrap xl:gap-x-8">
          {Object.entries(FEATURE_GROUPS).map(([groupKey, features]) => (
            <div key={groupKey} className="space-y-1.5">
              <span className="text-xs font-medium capitalize text-muted-foreground">
                {groupKey}
              </span>
              <div className="space-y-1">
                {features.map((feature) => (
                  <div key={feature.key} className="flex items-center gap-2">
                    <Checkbox
                      id={feature.key}
                      checked={filters.features[feature.key as keyof typeof filters.features] === true}
                      onCheckedChange={() => toggleFeature(feature.key)}
                      className="h-3.5 w-3.5"
                    />
                    <label
                      htmlFor={feature.key}
                      className="text-xs leading-none cursor-pointer"
                    >
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Range Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 pt-2 border-t">
        {/* Price Range */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Price:</span>
          <Input
            type="number"
            placeholder="Min"
            value={filters.priceMin ?? ""}
            onChange={(e) =>
              updateFilter("priceMin", e.target.value ? Number(e.target.value) : null)
            }
            className="h-8 w-20 text-xs"
          />
          <span className="text-xs text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.priceMax ?? ""}
            onChange={(e) =>
              updateFilter("priceMax", e.target.value ? Number(e.target.value) : null)
            }
            className="h-8 w-20 text-xs"
          />
        </div>

        {/* HT Score Range */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">HT Score:</span>
          <Input
            type="number"
            placeholder="Min"
            value={filters.scoreMin ?? ""}
            onChange={(e) =>
              updateFilter("scoreMin", e.target.value ? Number(e.target.value) : null)
            }
            className="h-8 w-20 text-xs"
            step="0.1"
          />
          <span className="text-xs text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.scoreMax ?? ""}
            onChange={(e) =>
              updateFilter("scoreMax", e.target.value ? Number(e.target.value) : null)
            }
            className="h-8 w-20 text-xs"
            step="0.1"
          />
        </div>
      </div>
    </div>
  );
}

interface MultiSelectFilterProps {
  placeholder: string;
  options: string[];
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
                    key={option}
                    onSelect={() => toggleOption(option)}
                    className="text-sm"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3.5 w-3.5",
                        selected.includes(option) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
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
