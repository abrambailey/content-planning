"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { SORT_OPTIONS, SortField } from "./types";

interface SortControlsProps {
  sortPrimary: SortField | null;
  sortPrimaryDesc: boolean;
  sortSecondary: SortField | null;
  sortSecondaryDesc: boolean;
  onSortChange: (
    primary: SortField | null,
    primaryDesc: boolean,
    secondary: SortField | null,
    secondaryDesc: boolean
  ) => void;
}

export function SortControls({
  sortPrimary,
  sortPrimaryDesc,
  sortSecondary,
  sortSecondaryDesc,
  onSortChange,
}: SortControlsProps) {
  return (
    <div className="flex items-end gap-4">
      {/* Primary Sort */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Sort by</Label>
        <div className="flex items-center gap-1">
          <Select
            value={sortPrimary ?? ""}
            onValueChange={(value) =>
              onSortChange(
                (value || null) as SortField | null,
                sortPrimaryDesc,
                sortSecondary,
                sortSecondaryDesc
              )
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sortPrimary && (
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                onSortChange(
                  sortPrimary,
                  !sortPrimaryDesc,
                  sortSecondary,
                  sortSecondaryDesc
                )
              }
            >
              {sortPrimaryDesc ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Secondary Sort */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Then by</Label>
        <div className="flex items-center gap-1">
          <Select
            value={sortSecondary ?? ""}
            onValueChange={(value) =>
              onSortChange(
                sortPrimary,
                sortPrimaryDesc,
                (value || null) as SortField | null,
                sortSecondaryDesc
              )
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.filter((o) => o.value !== sortPrimary).map(
                (option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          {sortSecondary && (
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                onSortChange(
                  sortPrimary,
                  sortPrimaryDesc,
                  sortSecondary,
                  !sortSecondaryDesc
                )
              }
            >
              {sortSecondaryDesc ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
