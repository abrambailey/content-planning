"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  color?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  onCreate?: (name: string) => Promise<string | null>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  createText?: string;
  className?: string;
  allowClear?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  onCreate,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  createText = "Create",
  className,
  allowClear = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const selectedOption = options.find((option) => option.value === value);

  // Check if search matches any existing option
  const searchLower = search.toLowerCase().trim();
  const hasExactMatch = options.some(
    (option) => option.label.toLowerCase() === searchLower
  );
  const showCreateOption = onCreate && search.trim() && !hasExactMatch;

  const handleCreate = async () => {
    if (!onCreate || !search.trim()) return;
    setIsCreating(true);
    try {
      const newValue = await onCreate(search.trim());
      if (newValue) {
        onValueChange(newValue);
        setOpen(false);
        setSearch("");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between overflow-hidden font-normal", className)}
        >
          {selectedOption ? (
            <span className="flex min-w-0 items-center gap-2">
              {selectedOption.color && (
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              <span className="truncate">{selectedOption.label}</span>
            </span>
          ) : (
            <span className="text-muted-foreground truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {showCreateOption ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  <Plus className="h-4 w-4" />
                  {isCreating ? "Creating..." : `${createText} "${search.trim()}"`}
                </button>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onValueChange(null);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-muted-foreground">None</span>
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.color && (
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0 mr-2"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
