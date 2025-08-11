import { toast as sonnerToast, Toaster } from 'sonner';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'destructive';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastType;
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', duration }: ToastOptions) => {
    const toastFn = (() => {
      if (variant === 'success') return sonnerToast.success;
      if (variant === 'error' || variant === 'destructive') return sonnerToast.error;
      if (variant === 'warning') return sonnerToast.warning;
      if (variant === 'info') return sonnerToast.info;
      return sonnerToast; // default
    })();

    toastFn(title ?? '', {
      description,
      duration,
    });
  };

  return { toast };
}

export const ToastViewport = () => <Toaster richColors position="top-right" />;
