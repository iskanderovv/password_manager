"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastInput = {
  message: string;
  variant?: ToastVariant;
};

type ToastItem = ToastInput & { id: number };

type ToastContextValue = {
  notify: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);

    setToasts((prev) => [...prev, { id, variant: input.variant ?? "info", message: input.message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2200);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "animate-fade-in-up rounded-xl border px-3 py-2 text-sm shadow-md backdrop-blur",
              toast.variant === "success" && "border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
              toast.variant === "error" && "border-rose-500/35 bg-rose-500/15 text-rose-700 dark:text-rose-200",
              toast.variant === "info" && "border-border/80 bg-card/95 text-foreground",
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
