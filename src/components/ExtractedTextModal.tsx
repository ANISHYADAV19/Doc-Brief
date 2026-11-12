'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileCode2,
  FileText,
  Hash,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileMetadata } from '@/types';

interface ExtractedTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType: 'pdf' | 'image';
  extractedText?: string;
  meta?: FileMetadata;
  isExtracting?: boolean;
  extractionError?: string | null;
  onRetry?: () => void;
}

function getConfidenceBadgeStyle(score: number): string {
  if (score >= 85) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  }
  if (score >= 60) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }
  return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
}

function renderHighlightedLine(line: string, query: string): React.ReactNode {
  if (!query) return line || ' ';

  const lowerLine = line.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];

  let cursor = 0;
  let matchIndex = lowerLine.indexOf(lowerQuery, cursor);
  let keyIndex = 0;

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push(line.slice(cursor, matchIndex));
    }
    const matchedSegment = line.slice(matchIndex, matchIndex + query.length);
    parts.push(
      <mark
        key={keyIndex}
        className="rounded bg-indigo-500/35 px-0.5 text-indigo-100 ring-1 ring-indigo-400/50"
      >
        {matchedSegment}
      </mark>
    );
    keyIndex += 1;
    cursor = matchIndex + query.length;
    matchIndex = lowerLine.indexOf(lowerQuery, cursor);
  }

  if (cursor < line.length) {
    parts.push(line.slice(cursor));
  }

  return parts.length > 0 ? parts : line || ' ';
}

/**
 * Accessible inspection modal for reviewing raw extracted PDF or OCR text
 * with monospaced formatting, line numbers, search highlighting, copy, and .txt export.
 */
export function ExtractedTextModal({
  isOpen,
  onClose,
  fileName,
  fileType,
  extractedText = '',
  meta,
  isExtracting = false,
  extractionError = null,
  onRetry,
}: ExtractedTextModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [copied, setCopied] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const lines = useMemo(() => {
    if (!extractedText) return [];
    return extractedText.split('\n');
  }, [extractedText]);

  const trimmedQuery = searchQuery.trim();

  const matchCount = useMemo(() => {
    if (!trimmedQuery || !extractedText) return 0;
    const haystack = extractedText.toLowerCase();
    const needle = trimmedQuery.toLowerCase();
    let count = 0;
    let index = haystack.indexOf(needle);
    while (index !== -1) {
      count += 1;
      index = haystack.indexOf(needle, index + needle.length);
    }
    return count;
  }, [extractedText, trimmedQuery]);

  const charCount = meta?.extractedCharacters ?? extractedText.length;
  const wordCount =
    meta?.wordCount ??
    (extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0);

  const handleCopyText = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Clipboard API may be blocked in insecure contexts
    }
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const baseName = fileName.replace(/\.[^/.]+$/, '') || 'document';
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}-extracted.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const isPdf = fileType === 'pdf';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="raw-text-modal-title"
      data-testid="extracted-text-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md sm:p-6"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/60">
        {/* Modal Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-4 py-3.5 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/15 text-indigo-300">
                <FileCode2 className="h-4 w-4" aria-hidden="true" />
              </div>
              <h2
                id="raw-text-modal-title"
                className="text-sm font-semibold text-white sm:text-base"
              >
                Raw Extracted Text
              </h2>
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                  isPdf
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                    : 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                )}
              >
                {isPdf ? 'PDF Stream Parser' : 'Tesseract OCR'}
              </span>
              {meta?.truncated && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  Truncated
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span className="inline-flex max-w-[260px] items-center gap-1.5 truncate text-slate-300">
                <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="truncate">{fileName}</span>
              </span>

              <span className="tabular-nums text-slate-300">
                <strong className="font-semibold text-white">
                  {charCount.toLocaleString()}
                </strong>{' '}
                characters
              </span>

              <span className="tabular-nums text-slate-300">
                <strong className="font-semibold text-white">
                  {wordCount.toLocaleString()}
                </strong>{' '}
                words
              </span>

              <span className="tabular-nums text-slate-400">
                {lines.length.toLocaleString()} lines
              </span>

              {isPdf && meta?.pageCount !== undefined && (
                <span className="tabular-nums text-slate-400">
                  {meta.pageCount} {meta.pageCount === 1 ? 'page' : 'pages'}
                </span>
              )}

              {!isPdf && meta?.confidenceScore !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
                    getConfidenceBadgeStyle(meta.confidenceScore)
                  )}
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {meta.confidenceScore}% OCR confidence
                </span>
              )}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close raw text inspector"
            className="rounded-lg border border-slate-700/80 bg-slate-800/80 p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Inspection Toolbar */}
        {!isExtracting && !extractionError && extractedText && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/60 px-4 py-2.5 sm:px-6">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search extracted text..."
                aria-label="Search within extracted text"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {trimmedQuery && (
              <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
              </span>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowLineNumbers((prev) => !prev)}
                aria-pressed={showLineNumbers}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  showLineNumbers
                    ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                )}
              >
                <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Lines</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-indigo-500/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>.txt</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  copied
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-indigo-500/40 bg-indigo-600 text-white hover:bg-indigo-500'
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy Raw Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Text Body */}
        <div className="min-h-[280px] flex-1 overflow-y-auto bg-slate-950/90 p-4 sm:p-6">
          {isExtracting ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {isPdf
                    ? 'Parsing PDF text streams...'
                    : 'Running Tesseract OCR on image...'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Raw text and character statistics will appear automatically once ready.
                </p>
              </div>
            </div>
          ) : extractionError ? (
            <div className="mx-auto my-8 max-w-md rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
              <AlertCircle
                className="mx-auto mb-2.5 h-6 w-6 text-rose-400"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-rose-200">
                Text extraction could not complete
              </p>
              <p className="mt-1 text-xs leading-relaxed text-rose-200/80">
                {extractionError}
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-100 transition-colors hover:bg-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Retry Extraction</span>
                </button>
              )}
            </div>
          ) : extractedText ? (
            <div
              data-testid="raw-extracted-text-content"
              className="rounded-xl border border-slate-800/90 bg-slate-900/50 p-3 font-mono text-xs leading-relaxed text-slate-200 select-text sm:p-4"
            >
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 rounded px-1 py-0.5 hover:bg-slate-800/40"
                >
                  {showLineNumbers && (
                    <span
                      aria-hidden="true"
                      className="w-8 shrink-0 select-none text-right text-[11px] text-slate-600 tabular-nums"
                    >
                      {idx + 1}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                    {renderHighlightedLine(line, trimmedQuery)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center text-xs text-slate-500">
              No extracted text available for this document yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/95 px-4 py-2.5 text-[11px] text-slate-400 sm:px-6">
          <span>
            Processed in-memory with zero server retention. Press{' '}
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
              Esc
            </kbd>{' '}
            to close.
          </span>
          {meta?.processingTimeMs !== undefined && (
            <span className="tabular-nums text-slate-500">
              Extracted in {meta.processingTimeMs.toLocaleString()} ms
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
