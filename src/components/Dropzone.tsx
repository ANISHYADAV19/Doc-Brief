'use client';

import React, { useRef, useState } from 'react';
import { FileUp, UploadCloud, ShieldCheck, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DROPZONE_ACCEPT,
  validateDocumentFile,
  type DocumentKind,
} from '@/lib/validation';

interface DropzoneProps {
  onFileAccepted: (file: File, fileType: DocumentKind) => void;
  onValidationError: (title: string, message: string) => void;
  onMultipleFiles?: (acceptedFileName: string, totalCount: number) => void;
  disabled?: boolean;
}

const FORMAT_SPECS = [
  { label: 'PDF', detail: 'Max 10 MB', kind: 'pdf' as const },
  { label: 'PNG', detail: 'Max 5 MB', kind: 'image' as const },
  { label: 'JPG', detail: 'Max 5 MB', kind: 'image' as const },
  { label: 'WEBP', detail: 'Max 5 MB', kind: 'image' as const },
];

/**
 * Interactive drag-and-drop file ingestion zone with keyboard accessibility,
 * active drag animations, and immediate client-side validation.
 */
export function Dropzone({
  onFileAccepted,
  onValidationError,
  onMultipleFiles,
  disabled = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [recentError, setRecentError] = useState(false);

  const triggerRejectionHighlight = () => {
    setRecentError(true);
    window.setTimeout(() => setRecentError(false), 1600);
  };

  const processFileList = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const firstFile = fileList[0];
    const result = validateDocumentFile(firstFile);

    if (!result.valid) {
      triggerRejectionHighlight();
      onValidationError(result.errorTitle, result.errorMessage);
      return;
    }

    if (fileList.length > 1 && onMultipleFiles) {
      onMultipleFiles(firstFile.name, fileList.length);
    }

    onFileAccepted(firstFile, result.fileType);
  };

  const openFilePicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFileList(e.target.files);
    // Reset input value so picking the same file again triggers onChange cleanly
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (!e.dataTransfer.types.includes('Files')) return;
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);

    if (disabled) return;
    processFileList(e.dataTransfer.files);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Upload document. Drag and drop or press Enter to browse. Accepts PDF up to 10 MB, and PNG, JPG, or WEBP images up to 5 MB."
        onClick={openFilePicker}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'group relative overflow-hidden rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
          disabled
            ? 'cursor-not-allowed border-slate-800 bg-slate-950/30 opacity-60'
            : 'cursor-pointer',
          !disabled && !isDragging && !recentError &&
            'border-slate-700/80 bg-slate-950/50 hover:border-indigo-500/60 hover:bg-slate-900/60',
          isDragging &&
            'scale-[1.01] border-indigo-400 bg-indigo-500/10 ring-4 ring-indigo-500/20 shadow-lg shadow-indigo-500/10',
          recentError &&
            !isDragging &&
            'border-rose-500/70 bg-rose-500/5 ring-4 ring-rose-500/15'
        )}
      >
        {/* Subtle radial glow when dragging */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 opacity-0 transition-opacity duration-200',
            (isDragging || !disabled) && 'group-hover:opacity-60',
            isDragging && 'opacity-100'
          )}
        />

        <input
          ref={inputRef}
          type="file"
          accept={DROPZONE_ACCEPT}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col items-center">
          {/* Icon circle */}
          <div
            className={cn(
              'mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-200',
              isDragging
                ? 'animate-gentle-float border-indigo-400/50 bg-indigo-500/20 text-indigo-300 shadow-lg shadow-indigo-500/25'
                : recentError
                  ? 'border-rose-500/40 bg-rose-500/15 text-rose-400'
                  : 'border-slate-700/80 bg-slate-900 text-indigo-400 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10 group-hover:text-indigo-300'
            )}
          >
            {isDragging ? (
              <UploadCloud className="h-7 w-7" aria-hidden="true" />
            ) : (
              <FileUp className="h-6 w-6" aria-hidden="true" />
            )}
          </div>

          {/* Primary Heading */}
          <p className="text-base font-semibold text-slate-100">
            {isDragging
              ? 'Release file to upload'
              : 'Drag & drop your document here'}
          </p>

          <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-400">
            {isDragging
              ? 'Your document will open immediately in the live previewer.'
              : 'Digital PDFs up to 10 MB, or scanned PNG, JPG, and WEBP images up to 5 MB.'}
          </p>

          {/* Browse Button Cue */}
          <span
            className={cn(
              'mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150',
              isDragging
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                : 'border border-slate-700 bg-slate-800/90 text-slate-200 group-hover:border-indigo-500/50 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-indigo-500/20'
            )}
          >
            <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isDragging ? 'Drop to preview' : 'Browse local files'}</span>
          </span>

          {/* Format Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {FORMAT_SPECS.map((fmt) => (
              <span
                key={fmt.label}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-[11px] font-medium text-slate-300"
              >
                {fmt.kind === 'pdf' ? (
                  <FileText className="h-3 w-3 text-rose-400" aria-hidden="true" />
                ) : (
                  <ImageIcon className="h-3 w-3 text-sky-400" aria-hidden="true" />
                )}
                <span>{fmt.label}</span>
                <span className="text-slate-500">• {fmt.detail}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Ephemeral Client Privacy Strip */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 px-3.5 py-2.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>Instant client-side preview with zero persistent storage.</span>
        </div>
        <span className="hidden font-mono text-[10px] text-slate-500 sm:inline">
          TAB + ENTER
        </span>
      </div>
    </div>
  );
}
