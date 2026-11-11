'use client';

import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  X,
  Move,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveDocument } from '@/types';
import type { ImageDimensions } from './FileInfoBar';

interface DocumentViewerProps {
  document: ActiveDocument;
  onImageDimensions?: (dims: ImageDimensions | null) => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

/**
 * In-browser document previewer powered by local URL.createObjectURL.
 * Renders an embedded PDF viewport or an interactive zoom/pan image viewer with lightbox mode.
 */
export function DocumentViewer({
  document,
  onImageDimensions,
}: DocumentViewerProps) {
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

  if (document.fileType === 'pdf') {
    return (
      <div
        data-testid="document-viewer-pdf"
        className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
      >
        {/* PDF Viewer Toolbar */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/80 px-3.5 py-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span className="font-medium">Live PDF Preview</span>
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

        {/* Embedded PDF Iframe */}
        <div className="relative h-[480px] w-full bg-slate-900 lg:h-[calc(100vh-20rem)] lg:min-h-[440px] lg:max-h-[760px]">
          <iframe
            src={`${document.previewUrl}#toolbar=1&navpanes=0`}
            title={`PDF preview of ${document.file.name}`}
            className="h-full w-full border-0 bg-slate-900"
          />
        </div>

        {/* Mobile/Fallback Helper Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/90 px-3.5 py-2 text-[11px] text-slate-400">
          <span>Scroll inside viewer to navigate pages.</span>
          <a
            href={document.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-400 underline-offset-2 hover:text-indigo-300 hover:underline sm:hidden"
          >
            Open fullscreen
          </a>
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
            <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span className="font-medium">Image Preview</span>
            {zoom > 1 && (
              <span className="hidden items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline-flex">
                <Move className="h-2.5 w-2.5" aria-hidden="true" />
                Drag to pan
              </span>
            )}
          </div>

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
        </div>

        {/* Image Viewport */}
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

        <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/90 px-3.5 py-2 text-[11px] text-slate-400">
          <span>Double-click image to toggle 200% zoom.</span>
          <span className="tabular-nums text-slate-500">{zoomPercent}%</span>
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
