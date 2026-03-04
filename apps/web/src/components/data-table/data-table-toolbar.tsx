"use client";

import { Input } from "@/components/ui/input";

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      <Input
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      {children}
    </div>
  );
}
