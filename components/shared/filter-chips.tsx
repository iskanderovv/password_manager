"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type FilterChipsProps = {
  filters: string[];
};

export function FilterChips({ filters }: FilterChipsProps) {
  const [selected, setSelected] = useState(filters[0] ?? "");

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          type="button"
          key={filter}
          onClick={() => setSelected(filter)}
          className={cn(
            "rounded-full border border-border/80 bg-card px-3 py-1 text-xs text-muted-foreground transition",
            selected === filter && "border-primary/50 bg-primary/10 text-primary",
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
