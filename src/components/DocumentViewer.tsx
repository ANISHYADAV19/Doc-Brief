'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  FileCode2,
  Loader2,
  Maximize2,
  Minimize2,
  Move,
  RefreshCw,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveDocument } from '@/types';
import type { ImageDimensions } from './FileInfoBar';

type ViewerTab = 'preview' | 'raw_text';

interface DocumentViewerProps {
  document: ActiveDocument;
  onImageDimensions?: (dims: ImageDimensions | null) => void;
  isExtracting?: boolean;
  extractionError?: string | null;
  onOpenRawTextModal?: () => void;
  onRetryExtraction?: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

function formatCompactCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

interface ViewerTabSwitcherProps {
  activeTab: ViewerTab;
  onChangeTab: (tab: ViewerTab) => void;
  isExtracting: boolean;
  hasError: boolean;
  charCount?: number;
}

function ViewerTabSwitcher({
  activeTab,
  onChangeTab,
  isExtracting,
  hasError,
  charCount,
}: ViewerTabSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Document view mode"
      className="inline-flex rounded-lg border border-slate-800 bg-slate-950/90 p-0.5"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'preview'}
        onClick={() => onChangeTab('preview')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          activeTab === 'preview'
            ? 'bg-slate-800 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        )}
      >
        <Eye className="h-3 w-3" aria-hidden="true" />
        <span>Preview</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'raw_text'}
        onClick={() => onChangeTab('raw_text')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
          activeTab === 'raw_text'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        )}
      >
        {isExtracting ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        ) : (
          <FileCode2 className="h-3 w-3" aria-hidden="true" />
        )}
        <span>Raw Text</span>
        {!isExtracting && !hasError && charCount !== undefined && charCount > 0 && (
          <span
            className={cn(
              'rounded px-1 py-0.2 text-[10px] font-semibold tabular-nums',
              activeTab === 'raw_text'
                ? 'bg-indigo-500/40 text-indigo-100'
                : 'bg-slate-800 text-slate-300'
            )}
          >
            {formatCompactCount(charCount)}
          </span>
        )}
      </button>
    </div>
  );
}

interface InlineRawTextPaneProps {
  fileType: 'pdf' | 'image';
  extractedText?: string;
  charCount?: number;
  wordCount?: number;
  pageCount?: number;
  confidenceScore?: number;
  isExtracting: boolean;
  extractionError?: string | null;
  onOpenRawTextModal?: () => void;
  onRetryExtraction?: () => void;
}

function InlineRawTextPane({
  fileType,
  extractedText,
  charCount,
  wordCount,
  pageCount,
  confidenceScore,
  isExtracting,
  extractionError,
  onOpenRawTextModal,
  onRetryExtraction,
}: InlineRawTextPaneProps) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div
      data-testid="inline-raw-text-tab"
      className="flex h-[480px] flex-col bg-slate-950 lg:h-[calc(100vh-20rem)] lg:min-h-[440px] lg:max-h-[760px]"
    >
      {isExtracting ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-slate-200">
              {fileType === 'pdf'
                ? 'Extracting PDF text streams...'
                : 'Running Tesseract OCR on image...'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Validating accuracy and computing character counts.
            </p>
          </div>
        </div>
      ) : extractionError ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-sm rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-center">
            <AlertCircle className="mx-auto mb-2 h-6 w-6 text-rose-400" aria-hidden="true" />
            <p className="text-sm font-semibold text-rose-200">Extraction Error</p>
            <p className="mt-1 text-xs leading-relaxed text-rose-200/80">
              {extractionError}
            </p>
            {onRetryExtraction && (
              <button
                type="button"
                onClick={onRetryExtraction}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-500/30"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      ) : extractedText ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/60 px-3.5 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 tabular-nums">
              <span>
                <strong className="font-semibold text-slate-100">
                  {(charCount ?? extractedText.length).toLocaleString()}
                </strong>{' '}
                chars
              </span>
              {wordCount !== undefined && (
                <span>
                  <strong className="font-semibold text-slate-100">
                    {wordCount.toLocaleString()}
                  </strong>{' '}
                  words
                </span>
              )}
              {pageCount !== undefined && (
                <span>
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                </span>
              )}
              {confidenceScore !== undefined && (
                <span className="text-emerald-300">{confidenceScore}% confidence</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
                  copied
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:text-white'
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" aria-hidden="true" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {onOpenRawTextModal && (
                <button
                  type="button"
                  onClick={onOpenRawTextModal}
                  className="inline-flex items-center gap-1 rounded-md border border-indigo-500/40 bg-indigo-500/15 px-2 py-1 text-[11px] font-medium text-indigo-200 transition-colors hover:bg-indigo-500/25"
                >
                  <Maximize2 className="h-3 w-3" aria-hidden="true" />
                  <span>Inspect Modal</span>
                </button>
              )}
            </div>
          </div>

          <pre className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap break-words select-text">
            {extractedText}
          </pre>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center p-6 text-xs text-slate-500">
          Waiting for text extraction...
        </div>
      )}
    </div>
  );
}

/**
 * In-browser document previewer powered by local URL.createObjectURL,
 * featuring an inline Preview / Raw Text tab switcher and a "View Raw Extracted Text" modal trigger.
 */
export function DocumentViewer({
  document,
  onImageDimensions,
  isExtracting = false,
  extractionError = null,
  onOpenRawTextModal,
  onRetryExtraction,
}: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState<ViewerTab>('preview');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Close lightbox on Escape
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2)));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDoubleClickImage = () => {
    if (zoom > 1) {
      handleResetView();
    } else {
      setZoom(2);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingPan(true);
    setDragOrigin({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPan) return;
    setPan({
      x: e.clientX - dragOrigin.x,
      y: e.clientY - dragOrigin.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPan) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDraggingPan(false);
  };

  const extractedCharCount =
    document.extractionMeta?.extractedCharacters ??
    document.extractedText?.length;

  const renderRawTextFooterButton = () =>
    onOpenRawTextModal ? (
      <button
        type="button"
        onClick={onOpenRawTextModal}
        data-testid="view-raw-text-button"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition-colors hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {isExtracting ? (
          <Loader2 className="h-3 w-3 animate-spin text-indigo-400" aria-hidden="true" />
        ) : (
          <FileCode2 className="h-3 w-3 text-indigo-400" aria-hidden="true" />
        )}
        <span>View Raw Extracted Text</span>
        {!isExtracting && extractedCharCount !== undefined && extractedCharCount > 0 && (
          <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300 tabular-nums">
            {extractedCharCount.toLocaleString()}
          </span>
        )}
      </button>
    ) : null;

  if (document.fileType === 'pdf') {
    return (
      <div
        data-testid="document-viewer-pdf"
        className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
      >
        {/* PDF Viewer Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/80 px-3.5 py-2">
          <div className="flex items-center gap-2.5">
            <ViewerTabSwitcher
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              isExtracting={isExtracting}
              hasError={Boolean(extractionError)}
              charCount={extractedCharCount}
            />
          </div>

          <a
            href={document.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-indigo-500/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span>Open in new tab</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>

        {/* Active Tab Viewport */}
        {activeTab === 'raw_text' ? (
          <InlineRawTextPane
            fileType="pdf"
            extractedText={document.extractedText}
            charCount={document.extractionMeta?.extractedCharacters}
            wordCount={document.extractionMeta?.wordCount}
            pageCount={document.extractionMeta?.pageCount}
            isExtracting={isExtracting}
            extractionError={extractionError}
            onOpenRawTextModal={onOpenRawTextModal}
            onRetryExtraction={onRetryExtraction}
          />
        ) : (
          <div className="relative h-[480px] w-full bg-slate-900 lg:h-[calc(100vh-20rem)] lg:min-h-[440px] lg:max-h-[760px]">
            <iframe
              src={`${document.previewUrl}#toolbar=1&navpanes=0`}
              title={`PDF preview of ${document.file.name}`}
              className="h-full w-full border-0 bg-slate-900"
            />
          </div>
        )}

        {/* Footer with Secondary Raw Text Modal Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 bg-slate-950/90 px-3.5 py-2 text-[11px] text-slate-400">
          <span>
            {activeTab === 'preview'
              ? 'Scroll inside viewer to navigate pages.'
              : 'Monospaced stream output from PDF parser.'}
          </span>
          <div className="flex items-center gap-2">
            {renderRawTextFooterButton()}
            <a
              href={document.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-400 underline-offset-2 hover:text-indigo-300 hover:underline sm:hidden"
            >
              Fullscreen
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Image Viewer
  const zoomPercent = Math.round(zoom * 100);

  return (
    <>
      <div
        data-testid="document-viewer-image"
        className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
      >
        {/* Image Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/80 px-3.5 py-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ViewerTabSwitcher
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              isExtracting={isExtracting}
              hasError={Boolean(extractionError)}
              charCount={extractedCharCount}
            />
            {activeTab === 'preview' && zoom > 1 && (
              <span className="hidden items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline-flex">
                <Move className="h-2.5 w-2.5" aria-hidden="true" />
                Drag to pan
              </span>
            )}
          </div>

          {activeTab === 'preview' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out"
                title="Zoom out"
                className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <span className="min-w-[3.25rem] text-center text-xs font-medium text-slate-300 tabular-nums">
                {zoomPercent}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in"
                title="Zoom in"
                className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleResetView}
                disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                aria-label="Reset zoom"
                title="Reset zoom (100%)"
                className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <div className="mx-1 h-4 w-px bg-slate-800" aria-hidden="true" />

              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                aria-label="Open fullscreen lightbox"
                title="Expand lightbox view"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-indigo-500/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Maximize2 className="h-3 w-3" aria-hidden="true" />
                <span className="hidden sm:inline">Expand</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Tab Viewport */}
        {activeTab === 'raw_text' ? (
          <InlineRawTextPane
            fileType="image"
            extractedText={document.extractedText}
            charCount={document.extractionMeta?.extractedCharacters}
            wordCount={document.extractionMeta?.wordCount}
            confidenceScore={document.extractionMeta?.confidenceScore}
            isExtracting={isExtracting}
            extractionError={extractionError}
            onOpenRawTextModal={onOpenRawTextModal}
            onRetryExtraction={onRetryExtraction}
          />
        ) : (
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={handleDoubleClickImage}
            className={cn(
              'bg-preview-grid relative flex h-[440px] w-full items-center justify-center overflow-hidden p-4 select-none lg:h-[calc(100vh-20rem)] lg:min-h-[400px] lg:max-h-[760px]',
              zoom > 1
                ? isDraggingPan
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-zoom-in'
            )}
          >
            {imageError ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-xs text-rose-200">
                Unable to render image preview. The file may be corrupted.
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={document.previewUrl}
                alt={`Preview of ${document.file.name}`}
                draggable={false}
                onLoad={(e) => {
                  setImageError(false);
                  onImageDimensions?.({
                    width: e.currentTarget.naturalWidth,
                    height: e.currentTarget.naturalHeight,
                  });
                }}
                onError={() => {
                  setImageError(true);
                  onImageDimensions?.(null);
                }}
                style={{
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                }}
                className={cn(
                  'max-h-full max-w-full rounded-lg object-contain shadow-2xl ring-1 ring-white/10',
                  !isDraggingPan && 'transition-transform duration-150 ease-out'
                )}
              />
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 bg-slate-950/90 px-3.5 py-2 text-[11px] text-slate-400">
          <span>
            {activeTab === 'preview'
              ? `Double-click image to toggle 200% zoom (${zoomPercent}%).`
              : 'Monospaced OCR text extracted via Tesseract.js.'}
          </span>
          {renderRawTextFooterButton()}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fullscreen preview of ${document.file.name}`}
          className="fixed inset-0 z-[60] flex flex-col bg-slate-950/95 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-6">
            <p className="truncate text-sm font-medium text-slate-100">
              {document.file.name}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out in lightbox"
                className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ZoomOut className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-[3.5rem] text-center text-xs font-medium text-slate-300 tabular-nums">
                {zoomPercent}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in in lightbox"
                className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ZoomIn className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleResetView}
                aria-label="Reset zoom in lightbox"
                className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:text-white"
              >
                <Minimize2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Close fullscreen preview"
                className="ml-2 rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-200 hover:bg-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsLightboxOpen(false);
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="bg-preview-grid flex flex-1 items-center justify-center overflow-hidden p-6 select-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={document.previewUrl}
              alt={`Fullscreen preview of ${document.file.name}`}
              draggable={false}
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              }}
              className={cn(
                'max-h-full max-w-full rounded-lg object-contain shadow-2xl',
                !isDraggingPan && 'transition-transform duration-150 ease-out'
              )}
            />
          </div>
        </div>
      )}
    </>
  );
}
