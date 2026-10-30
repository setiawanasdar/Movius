import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

let activeToasts: ToastMessage[] = [];
const listeners = new Set<ToastListener>();

function notify() {
  listeners.forEach((fn) => fn([...activeToasts]));
}

export const toast = {
  show(message: string, type: ToastType = 'info', duration: number = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, message, duration };
    activeToasts = [...activeToasts, newToast];
    notify();

    setTimeout(() => {
      toast.dismiss(id);
    }, duration);
  },
  success(message: string, duration?: number) {
    toast.show(message, 'success', duration);
  },
  error(message: string, duration?: number) {
    toast.show(message, 'error', duration);
  },
  info(message: string, duration?: number) {
    toast.show(message, 'info', duration);
  },
  warning(message: string, duration?: number) {
    toast.show(message, 'warning', duration);
  },
  dismiss(id: string) {
    activeToasts = activeToasts.filter((t) => t.id !== id);
    notify();
  },
};

export function useToastStore() {
  const [toasts, setToasts] = useState<ToastMessage[]>(activeToasts);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return { toasts, dismiss: toast.dismiss };
}
