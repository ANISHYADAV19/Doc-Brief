'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileUp,
  Sparkles,
  Eye,
  FileSearch,
  Layers,
  CheckCircle2,
  UploadCloud,
  ListChecks,
  Lightbulb,
} from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import {
  DROPZONE_ACCEPT,
  getFormatLabel,
  validateDocumentFile,
  type DocumentKind,
} from '@/lib/validation';
import type { ActiveDocument, SummaryLength } from '@/types';
import { Dropzone } from './Dropzone';
import { FileInfoBar, type ImageDimensions } from './FileInfoBar';
import { DocumentViewer } from './DocumentViewer';
import { ToastContainer, type ToastMessage, type ToastVariant } from './Toast';

type MobileTab = 'preview' | 'summary';

const SUMMARY_LENGTH_OPTIONS: {
  value: SummaryLength;
  label: string;
  words: string;
}[] = [
  { value: 'short', label: 'Short', words: '~100w' },
  { value: 'medium', label: 'Medium', words: '~250w' },
  { value: 'long', label: 'Long', words: '~500w' },
];

function createToastId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Main interactive DocBrief dual-column workspace:
 * - Desktop (>= 1024px): 50/50 side-by-side split
 * - Mobile / Tablet (< 1024px): Sticky segmented tabs switching between Document Preview & AI Summary
 */
export function Workspace() {
  const [selectedDoc, setSelectedDoc] = useState<{
    file: File;
    fileType: DocumentKind;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isReplacingViaDrag, setIsReplacingViaDrag] = useState(false);

  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const replaceDragDepthRef = useRef(0);

  // Manage local Object URL lifecycle cleanly (React 19 Strict Mode safe)
  useEffect(() => {
    const file = selectedDoc?.file;
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedDoc]);

  const activeDocument: ActiveDocument | null = useMemo(() => {
    if (!selectedDoc || !previewUrl) return null;
    return {
      file: selectedDoc.file,
      previewUrl,
      fileType: selectedDoc.fileType,
    };
  }, [selectedDoc, previewUrl]);

  const addToast = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const id = createToastId();
      setToasts((prev) => [
        ...prev.slice(-3),
        { id, variant, title, description },
      ]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleFileAccepted = useCallback((file: File, fileType: DocumentKind) => {
    setImageDimensions(null);
    setSelectedDoc({ file, fileType });
    setMobileTab('preview');
  }, []);

  const handleValidationError = useCallback(
    (title: string, message: string) => {
      addToast('error', title, message);
    },
    [addToast]
  );

  const handleMultipleFiles = useCallback(
    (acceptedFileName: string, totalCount: number) => {
      addToast(
        'warning',
        'Single document mode',
        `${totalCount} files detected. Loaded "${acceptedFileName}" for preview.`
      );
    },
    [addToast]
  );

  const handleRemoveDocument = useCallback(() => {
    setSelectedDoc(null);
    setImageDimensions(null);
  }, []);

  const handleTriggerReplace = useCallback(() => {
    replaceInputRef.current?.click();
  }, []);

  const handleReplaceFileList = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const firstFile = fileList[0];
      const result = validateDocumentFile(firstFile);

      if (!result.valid) {
        addToast('error', result.errorTitle, result.errorMessage);
        return;
      }

      if (fileList.length > 1) {
        handleMultipleFiles(firstFile.name, fileList.length);
      }

      handleFileAccepted(firstFile, result.fileType);
    },
    [addToast, handleFileAccepted, handleMultipleFiles]
  );

  const handleReplaceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleReplaceFileList(e.target.files);
    e.target.value = '';
  };

  // Drag-to-replace handlers when a document is already loaded in the left panel
  const handleActivePanelDragEnter = (e: React.DragEvent<HTMLElement>) => {
    if (!activeDocument) return;
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    e.stopPropagation();
    replaceDragDepthRef.current += 1;
    setIsReplacingViaDrag(true);
  };

  const handleActivePanelDragOver = (e: React.DragEvent<HTMLElement>) => {
    if (!activeDocument) return;
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleActivePanelDragLeave = (e: React.DragEvent<HTMLElement>) => {
    if (!activeDocument) return;
    e.preventDefault();
    e.stopPropagation();
    replaceDragDepthRef.current = Math.max(0, replaceDragDepthRef.current - 1);
    if (replaceDragDepthRef.current === 0) {
      setIsReplacingViaDrag(false);
    }
  };

  const handleActivePanelDrop = (e: React.DragEvent<HTMLElement>) => {
    if (!activeDocument) return;
    e.preventDefault();
    e.stopPropagation();
    replaceDragDepthRef.current = 0;
    setIsReplacingViaDrag(false);
    handleReplaceFileList(e.dataTransfer.files);
  };

  const selectedLengthOption = SUMMARY_LENGTH_OPTIONS.find(
    (opt) => opt.value === summaryLength
  );

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-0 sm:px-6 lg:px-8 lg:pt-8">
        {/* Hidden input for Replace button when a file is already active */}
        <input
          ref={replaceInputRef}
          type="file"
          accept={DROPZONE_ACCEPT}
          onChange={handleReplaceInputChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Mobile & Tablet (< 1024px) Sticky Segmented View Switcher */}
        <div className="sticky top-16 z-30 -mx-4 mb-5 border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
          <div
            role="tablist"
            aria-label="Workspace views"
            className="grid grid-cols-2 gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1"
          >
            <button
              type="button"
              role="tab"
              id="tab-preview"
              aria-selected={mobileTab === 'preview'}
              aria-controls="panel-preview"
              onClick={() => setMobileTab('preview')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                mobileTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Document Preview</span>
              {activeDocument && (
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    mobileTab === 'preview' ? 'bg-emerald-300' : 'bg-emerald-400'
                  )}
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              type="button"
              role="tab"
              id="tab-summary"
              aria-selected={mobileTab === 'summary'}
              aria-controls="panel-summary"
              onClick={() => setMobileTab('summary')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                mobileTab === 'summary'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>AI Summary & Insights</span>
            </button>
          </div>
        </div>

        {/* Desktop 50/50 Dual-Column Grid / Mobile Stacked Tab Panels */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          {/* LEFT PANEL: Document Ingestion & Live Preview */}
          <section
            id="panel-preview"
            aria-labelledby="heading-ingestion"
            onDragEnter={handleActivePanelDragEnter}
            onDragOver={handleActivePanelDragOver}
            onDragLeave={handleActivePanelDragLeave}
            onDrop={handleActivePanelDrop}
            className={cn(
              'relative min-w-0 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm sm:p-6',
              mobileTab === 'preview' ? 'block' : 'hidden lg:block'
            )}
          >
            {/* Drag-to-replace overlay when document is already loaded */}
            {activeDocument && isReplacingViaDrag && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400 bg-slate-950/90 p-6 text-center backdrop-blur-sm">
                <div className="animate-gentle-float mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/20 text-indigo-300">
                  <UploadCloud className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-white">
                  Release to replace current document
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  PDF up to 10 MB • PNG, JPG, WEBP up to 5 MB
                </p>
              </div>
            )}

            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                <h2
                  id="heading-ingestion"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-200 sm:text-sm"
                >
                  Document Ingestion & Preview
                </h2>
              </div>
              <span className="rounded-md border border-slate-800 bg-slate-950/80 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                {activeDocument
                  ? `${getFormatLabel(activeDocument.file)} Loaded`
                  : 'PDF, PNG, JPG, WEBP'}
              </span>
            </div>

            {activeDocument ? (
              <div className="space-y-4">
                <FileInfoBar
                  file={activeDocument.file}
                  fileType={activeDocument.fileType}
                  imageDimensions={imageDimensions}
                  onReplace={handleTriggerReplace}
                  onRemove={handleRemoveDocument}
                />
                <DocumentViewer
                  key={activeDocument.previewUrl}
                  document={activeDocument}
                  onImageDimensions={setImageDimensions}
                />
              </div>
            ) : (
              <Dropzone
                onFileAccepted={handleFileAccepted}
                onValidationError={handleValidationError}
                onMultipleFiles={handleMultipleFiles}
              />
            )}
          </section>

          {/* RIGHT PANEL: Executive Intelligence & Summary */}
          <section
            id="panel-summary"
            aria-labelledby="heading-intelligence"
            className={cn(
              'min-w-0 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm sm:p-6',
              mobileTab === 'summary' ? 'block' : 'hidden lg:block'
            )}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" aria-hidden="true" />
                <h2
                  id="heading-intelligence"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-200 sm:text-sm"
                >
                  Executive Intelligence & Summary
                </h2>
              </div>

              {/* Calibrated Summary Length Selector */}
              <div
                role="group"
                aria-label="Summary length"
                className="inline-flex rounded-xl border border-slate-800 bg-slate-950/80 p-1"
              >
                {SUMMARY_LENGTH_OPTIONS.map((option) => {
                  const isActive = summaryLength === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSummaryLength(option.value)}
                      aria-pressed={isActive}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeDocument ? (
              <div className="space-y-4">
                {/* Active Document Ready Banner */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-emerald-200">
                          Document Validated & Preview Ready
                        </h3>
                        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300">
                          {selectedLengthOption?.label} ({selectedLengthOption?.words})
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-300">
                        <span className="font-medium text-slate-100">
                          {activeDocument.file.name}
                        </span>{' '}
                        ({formatFileSize(activeDocument.file.size)}) is loaded locally via
                        browser Object URL.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Output Structure Preview Cards (Ready for Phase 3/4 Pipeline) */}
                <div className="grid gap-3">
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                      <Layers className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
                      <span>Executive Summary ({selectedLengthOption?.label})</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Text extraction ({activeDocument.fileType === 'pdf' ? 'PDF stream parser' : 'Tesseract OCR'}) and Gemini AI synthesis will stream structured output into this card once the extraction API is connected in Phase 3 &amp; 4.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                      <ListChecks className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                      <span>Key Takeaways</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                      4–6 high-signal highlights capturing factual metrics, claims, and core conclusions.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                      <span>Document Improvement Suggestions</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                      Ranked clarity, structure, and completeness recommendations with priority tags.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/40 p-6 text-center sm:p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-violet-400">
                  <FileSearch className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-100">
                  Awaiting Document Upload
                </h3>
                <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-400">
                  Drop a PDF or scanned image on the left to inspect a live preview and prepare an executive summary calibrated to{' '}
                  <span className="font-medium text-slate-200">
                    {selectedLengthOption?.label} ({selectedLengthOption?.words})
                  </span>
                  .
                </p>

                <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2.5 text-left sm:grid-cols-3">
                  {[
                    {
                      step: '01',
                      title: 'Ingest',
                      desc: 'Validate & preview locally',
                    },
                    {
                      step: '02',
                      title: 'Extract',
                      desc: 'PDF parser & image OCR',
                    },
                    {
                      step: '03',
                      title: 'Synthesize',
                      desc: 'Summary & critique',
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3"
                    >
                      <span className="font-mono text-[10px] font-semibold text-indigo-400">
                        STEP {item.step}
                      </span>
                      <p className="mt-0.5 text-xs font-semibold text-slate-200">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
