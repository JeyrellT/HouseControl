"use client";

import { create } from "zustand";

export type ToastTone = "info" | "success" | "warn" | "critical" | "ai";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  body?: string;
  /** lucide icon name (optional) — falls back to tone default */
  icon?:
    | "Sparkles" | "AlertTriangle" | "Shield" | "Zap" | "Check"
    | "Bell" | "Brain" | "Flame" | "Thermometer" | "Wifi"
    | "Radio" | "Info";
  /** duration in ms (0 = sticky until dismissed) */
  duration?: number;
  action?: ToastAction;
  ts: number;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id" | "ts"> & Partial<Pick<Toast, "id">>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  push: (t) => {
    const id = t.id ?? `tst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const toast: Toast = {
      duration: 4500,
      ts: Date.now(),
      ...t,
      id,
    };
    set((s) => ({ toasts: [toast, ...s.toasts].slice(0, 5) }));
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      }, toast.duration);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Convenience helpers. */
export const toast = {
  info:     (title: string, body?: string, extra?: Partial<Toast>) => useToastStore.getState().push({ tone: "info",     title, body, ...extra }),
  success:  (title: string, body?: string, extra?: Partial<Toast>) => useToastStore.getState().push({ tone: "success",  title, body, ...extra }),
  warn:     (title: string, body?: string, extra?: Partial<Toast>) => useToastStore.getState().push({ tone: "warn",     title, body, ...extra }),
  critical: (title: string, body?: string, extra?: Partial<Toast>) => useToastStore.getState().push({ tone: "critical", title, body, ...extra, duration: extra?.duration ?? 7000 }),
  ai:       (title: string, body?: string, extra?: Partial<Toast>) => useToastStore.getState().push({ tone: "ai",       title, body, ...extra }),
};
