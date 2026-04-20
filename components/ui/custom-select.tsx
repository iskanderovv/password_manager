"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type CustomSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type CustomSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<CustomSelectOption>;
  ariaLabel: string;
  className?: string;
};

export function CustomSelect({ value, onValueChange, options, ariaLabel, className }: CustomSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        if (open) {
          triggerRef.current?.focus();
        }
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const selectedIndex = options.findIndex((option) => option.value === value && !option.disabled);
    const firstEnabledIndex = options.findIndex((option) => !option.disabled);
    const initialIndex = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex;

    setHighlightedIndex(initialIndex);
    if (initialIndex >= 0) {
      window.requestAnimationFrame(() => {
        optionRefs.current[initialIndex]?.focus();
      });
    }
  }, [open, options, value]);

  const getNextEnabledIndex = (startIndex: number, direction: 1 | -1) => {
    if (!options.length) return -1;
    let index = startIndex;
    for (let step = 0; step < options.length; step += 1) {
      index = (index + direction + options.length) % options.length;
      if (!options[index]?.disabled) {
        return index;
      }
    }
    return -1;
  };

  const selectOption = (nextValue: string) => {
    onValueChange(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={cn(
          "group inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/80 px-3 text-left shadow-sm transition-all",
          "hover:border-primary/35 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          open && "border-primary/50 ring-2 ring-ring/20",
        )}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="truncate text-sm font-medium text-foreground/90">{selectedOption?.label ?? ""}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180 text-primary")} />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="animate-scale-in absolute left-0 top-12 z-50 w-full rounded-xl border border-border/80 bg-card p-1.5 shadow-xl"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              const nextIndex = getNextEnabledIndex(highlightedIndex, 1);
              if (nextIndex >= 0) {
                setHighlightedIndex(nextIndex);
                optionRefs.current[nextIndex]?.focus();
              }
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              const nextIndex = getNextEnabledIndex(highlightedIndex, -1);
              if (nextIndex >= 0) {
                setHighlightedIndex(nextIndex);
                optionRefs.current[nextIndex]?.focus();
              }
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              const highlightedOption = options[highlightedIndex];
              if (highlightedOption && !highlightedOption.disabled) {
                selectOption(highlightedOption.value);
              }
              return;
            }

            if (event.key === "Tab") {
              setOpen(false);
            }
          }}
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            const highlighted = index === highlightedIndex;

            return (
              <button
                key={option.value}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                  option.disabled && "cursor-not-allowed opacity-45",
                  !option.disabled && (selected
                    ? "bg-primary/15 text-primary"
                    : highlighted
                      ? "bg-muted/80 text-foreground"
                      : "text-foreground/85 hover:bg-muted/70"),
                )}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => {
                  if (!option.disabled) {
                    selectOption(option.value);
                  }
                }}
              >
                <span className="truncate">{option.label}</span>
                {selected ? <Check className="size-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
