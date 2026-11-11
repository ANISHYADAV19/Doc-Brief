'use client';

import React from 'react';
import { FileText, Image as ImageIcon, RefreshCw, X } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { getFormatLabel, type DocumentKind } from '@/lib/validation';

export interface ImageDimensions {
  width: number;
  height: number;
}

interface FileInfoBarProps {
  file: File;
  fileType: DocumentKind;
  imageDimensions?: ImageDimensions | null;
  onReplace: () => void;
  onRemove: () => void;
}

/**
 * Displays active document metadata (name, format badge, size, dimensions)
 * along with quick Replace and Remove controls.
 */
export function FileInfoBar({
  file,
  fileType,
  imageDimensions,
  onReplace,
  onRemove,
}: FileInfoBarProps) {
  const formatLabel = getFormatLabel(file);
  const isPdf = fileType === 'pdf';

  return (
    <div
      data-testid="file-info-bar"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
            isPdf
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : 'border-sky-500/30 bg-sky-500/10 text-sky-400'
          )}
        >
          {isPdf ? (
            <FileText className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              title={file.name}
              className="truncate text-sm font-medium text-slate-100"
            >
              {file.name}
            </p>
            <span
              className={cn(
                'shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                isPdf
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border-sky-500/30 bg-sky-500/10 text-sky-300'
              )}
            >
              {formatLabel}
            </span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-400 tabular-nums">
            <span>{formatFileSize(file.size)}</span>
            <span aria-hidden="true" className="text-slate-700">
              •
            </span>
            <span>{isPdf ? 'PDF Document' : 'Image Scan'}</span>
            {!isPdf && imageDimensions && (
              <>
                <span aria-hidden="true" className="text-slate-700">
                  •
                </span>
                <span>
                  {imageDimensions.width} × {imageDimensions.height} px
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onReplace}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title="Choose a different document"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Replace</span>
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          title="Remove document"
          className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
