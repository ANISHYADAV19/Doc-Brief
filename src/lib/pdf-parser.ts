import {
  FormatError,
  InvalidPDFException,
  PDFParse,
  PasswordException,
  VerbosityLevel,
} from 'pdf-parse';
import { getData } from 'pdf-parse/worker';
import {
  countWords,
  normalizeExtractedText,
  truncateExtractedText,
  withTimeout,
} from './extraction-utils';

if (typeof window !== 'undefined') {
  throw new Error('PDF parser should only be executed on the server side.');
}

export const MAX_PDF_PAGES = 50;
export const PDF_PARSE_TIMEOUT_MS = 20_000;

export class PdfParseError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'PdfParseError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  parsedPages: number;
  characterCount: number;
  wordCount: number;
  truncated: boolean;
}

let workerConfigured = false;

function ensurePdfWorkerConfigured(): void {
  if (workerConfigured) return;
  PDFParse.setWorker(getData());
  workerConfigured = true;
}

function isUnprocessablePdfError(error: unknown): boolean {
  if (
    error instanceof PasswordException ||
    error instanceof InvalidPDFException ||
    error instanceof FormatError
  ) {
    return true;
  }

  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    const message = error.message.toLowerCase();
    return (
      name.includes('password') ||
      name.includes('invalidpdf') ||
      name.includes('formaterror') ||
      message.includes('password') ||
      message.includes('encrypted') ||
      message.includes('invalid pdf') ||
      message.includes('malformed') ||
      message.includes('corrupt') ||
      message.includes('no pdf header')
    );
  }

  return false;
}

/**
 * Parses a digital PDF binary buffer in memory and returns normalized text,
 * total page count, and character/word statistics.
 */
export async function parsePdfBuffer(
  buffer: Buffer | Uint8Array
): Promise<PdfExtractionResult> {
  ensurePdfWorkerConfigured();

  // Copy into a dedicated Uint8Array so pdf.js worker transfer cannot mutate caller memory
  const pdfData = new Uint8Array(buffer);
  const parser = new PDFParse({
    data: pdfData,
    verbosity: VerbosityLevel.ERRORS,
    disableFontFace: true,
    useSystemFonts: false,
  });

  try {
    const textResult = await withTimeout(
      parser.getText({
        first: MAX_PDF_PAGES,
        pageJoiner: '',
      }),
      PDF_PARSE_TIMEOUT_MS,
      () =>
        new PdfParseError(
          504,
          'PDF_PARSE_TIMEOUT',
          'PDF text extraction timed out. Please try a smaller or less complex document.'
        )
    );

    const pageCount = textResult.total;
    const parsedPages = textResult.pages.length;
    const rawText = textResult.pages.map((page) => page.text).join('\n\n');
    const normalized = normalizeExtractedText(rawText);

    if (normalized.length === 0) {
      throw new PdfParseError(
        422,
        'EMPTY_PDF_TEXT',
        'No extractable digital text found in this PDF. It appears to be a scanned or image-only PDF—please upload a page image (PNG, JPG, or WEBP) for OCR.'
      );
    }

    const { text, truncated: charTruncated } = truncateExtractedText(normalized);
    const truncated = charTruncated || pageCount > MAX_PDF_PAGES;

    return {
      text,
      pageCount,
      parsedPages,
      characterCount: text.length,
      wordCount: countWords(text),
      truncated,
    };
  } catch (error) {
    if (error instanceof PdfParseError) {
      throw error;
    }

    if (isUnprocessablePdfError(error)) {
      throw new PdfParseError(
        422,
        'UNPROCESSABLE_PDF',
        'Document is password-protected or corrupted.'
      );
    }

    throw new PdfParseError(
      500,
      'PDF_EXTRACTION_FAILED',
      'Failed to extract text from the PDF document.'
    );
  } finally {
    await parser.destroy().catch(() => {});
  }
}
