'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'error' | 'warning' | 'success' | 'info';

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const VARIANT_STYLES: Record<
  ToastVariant,
  {
    container: string;
    iconWrapper: string;
    title: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  error: {
    container: 'border-rose-500/40 bg-slate-900/95 shadow-rose-950/30',
    iconWrapper: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    title: 'text-rose-200',
    Icon: AlertCircle,
  },
  warning: {
    container: 'border-amber-500/40 bg-slate-900/95 shadow-amber-950/30',
    iconWrapper: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    title: 'text-amber-200',
    Icon: AlertTriangle,
  },
  success: {
    container: 'border-emerald-500/40 bg-slate-900/95 shadow-emerald-950/30',
    iconWrapper: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    title: 'text-emerald-200',
    Icon: CheckCircle2,
  },
  info: {
    container: 'border-sky-500/40 bg-slate-900/95 shadow-sky-950/30',
    iconWrapper: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    title: 'text-sky-200',
    Icon: Info,
  },
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [paused, setPaused] = useState(false);
  const duration = toast.durationMs ?? 6000;

  useEffect(() => {
    if (paused || duration <= 0) return;
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, duration, paused, onDismiss]);

  const style = VARIANT_STYLES[toast.variant];
  const { Icon } = style;
  const isUrgent = toast.variant === 'error' || toast.variant === 'warning';

  return (
    <div
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        'animate-toast-in pointer-events-auto w-full rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all',
        style.container
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
            style.iconWrapper
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold leading-5', style.title)}>
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {toast.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

/**
 * Renders active toast alerts fixed near the top-right viewport edge.
 */
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-4 top-20 z-50 flex flex-col gap-2.5 sm:inset-x-auto sm:right-6 sm:w-96"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
