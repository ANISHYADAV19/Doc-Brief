import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { OEM, createWorker, type Worker } from 'tesseract.js';
import {
  countWords,
  normalizeExtractedText,
  truncateExtractedText,
  withTimeout,
} from './extraction-utils';

if (typeof window !== 'undefined') {
  throw new Error('OCR worker should only be executed on the server side.');
}

export const MIN_OCR_CHARACTERS = 20;
export const OCR_TIMEOUT_MS = 20_000;
export const OCR_CACHE_DIR = path.join(os.tmpdir(), 'docbrief-tesseract-cache');

export class OcrExtractionError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'OcrExtractionError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface OcrExtractionResult {
  text: string;
  characterCount: number;
  wordCount: number;
  confidenceScore: number;
  truncated: boolean;
}

function ensureCacheDir(): void {
  fs.mkdirSync(OCR_CACHE_DIR, { recursive: true });
}

function isImageDecodeError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('attempting to read image') ||
    message.includes('unsupported image') ||
    message.includes('invalid image') ||
    message.includes('pixread')
  );
}

/**
 * Runs Tesseract.js WebAssembly OCR on an in-memory raster image buffer
 * (PNG, JPEG, or WEBP), cleaning whitespace and guarding against blank scans.
 */
export async function extractTextFromImage(
  buffer: Buffer | Uint8Array
): Promise<OcrExtractionResult> {
  ensureCacheDir();

  let worker: Worker | null = null;
  let rejectWorkerError: ((err: Error) => void) | null = null;

  // Tesseract's createWorker swallows non-load init errors unless errorHandler rejects explicitly
  const workerErrorPromise = new Promise<never>((_, reject) => {
    rejectWorkerError = reject;
  });

  const runOcr = async (): Promise<OcrExtractionResult> => {
    worker = await createWorker('eng', OEM.LSTM_ONLY, {
      cachePath: OCR_CACHE_DIR,
      errorHandler: (err) => {
        const normalizedErr =
          err instanceof Error ? err : new Error(String(err ?? 'OCR worker error'));
        rejectWorkerError?.(normalizedErr);
      },
    });

    const imageBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const recognition = await worker.recognize(imageBuffer, { rotateAuto: true });

    const normalized = normalizeExtractedText(recognition.data.text ?? '', {
      collapseInlineSpaces: true,
    });

    if (normalized.length < MIN_OCR_CHARACTERS) {
      throw new OcrExtractionError(
        422,
        'INSUFFICIENT_TEXT',
        'Insufficient legible text detected in image. Please provide a higher-resolution scan.'
      );
    }

    const { text, truncated } = truncateExtractedText(normalized);
    const rawConfidence = Number(recognition.data.confidence ?? 0);
    const confidenceScore = Math.min(
      100,
      Math.max(0, Math.round(rawConfidence * 100) / 100)
    );

    return {
      text,
      characterCount: text.length,
      wordCount: countWords(text),
      confidenceScore,
      truncated,
    };
  };

  try {
    return await withTimeout(
      Promise.race([runOcr(), workerErrorPromise]),
      OCR_TIMEOUT_MS,
      () =>
        new OcrExtractionError(
          504,
          'OCR_TIMEOUT',
          'Image OCR processing timed out. Please try a clearer or smaller image.'
        )
    );
  } catch (error) {
    if (error instanceof OcrExtractionError) {
      throw error;
    }

    if (isImageDecodeError(error)) {
      throw new OcrExtractionError(
        422,
        'UNPROCESSABLE_IMAGE',
        'Unable to decode or read the uploaded image. Please ensure the file is a valid, uncorrupted PNG, JPG, or WEBP image.'
      );
    }

    throw new OcrExtractionError(
      500,
      'OCR_EXTRACTION_FAILED',
      'Failed to run OCR text extraction on the uploaded image.'
    );
  } finally {
    if (worker !== null) {
      const activeWorker: Worker = worker;
      await activeWorker.terminate().catch(() => {});
    }
  }
}
