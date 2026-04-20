"use client";

import { useSyncExternalStore } from "react";

const noop = () => undefined;

function subscribe() {
  return noop;
}

export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
