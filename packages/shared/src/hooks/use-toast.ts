import type { ReactNode } from "react";


type Toast = {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

const toasts: Toast[] = [];

export function toast(data: Omit<Toast, "id">) {
  toasts.push({
    id: crypto.randomUUID(),
    ...data,
  });
}

export function useToast() {
  return {
    toasts,
    toast,
    dismiss: () => {},
  };
}
