"use client";

import { useCallback } from "react";

import { useToast } from "@/components/ui/toast-provider";

export function useCopy() {
  const { notify } = useToast();

  return useCallback(
    async (value: string, successMessage: string, errorMessage: string) => {
      try {
        await navigator.clipboard.writeText(value);
        notify({
          message: successMessage,
          variant: "success",
        });
        return true;
      } catch {
        notify({
          message: errorMessage,
          variant: "error",
        });
        return false;
      }
    },
    [notify],
  );
}
