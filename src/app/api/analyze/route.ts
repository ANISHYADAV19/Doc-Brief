import { NextRequest, NextResponse } from 'next/server';
import { validateUploadedFileBinary } from '@/lib/magic-bytes';
import { OcrExtractionError, extractTextFromImage } from '@/lib/ocr-worker';
import { PdfParseError, parsePdfBuffer } from '@/lib/pdf-parser';
import { MAX_PDF_SIZE_BYTES } from '@/lib/validation';
import type { AnalyzeApiResponse, SummaryLength } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const VALID_SUMMARY_LENGTHS: readonly SummaryLength[] = ['short', 'medium', 'long'];

function errorResponse(
  status: number,
  code: string,
  message: string,
  details: unknown = null
): NextResponse<AnalyzeApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

function parseSummaryLength(rawValue: FormDataEntryValue | null): SummaryLength {
  if (typeof rawValue !== 'string') return 'medium';
  const normalized = rawValue.trim().toLowerCase();
  if (VALID_SUMMARY_LENGTHS.includes(normalized as SummaryLength)) {
    return normalized as SummaryLength;
  }
  return 'medium';
}

function logSanitizedRequest(meta: {
  fileType: string;
  fileSizeKb: number;
  statusCode: number;
  durationMs: number;
  extractedCharacters?: number;
  errorCode?: string;
}): void {
  // Never log raw document text, file contents, or user-identifying data
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route: '/api/analyze',
      ...meta,
    })
  );
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<AnalyzeApiResponse>> {
  const startedAt = Date.now();
  const contentType = request.headers.get('content-type') ?? '';

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return errorResponse(
      400,
      'INVALID_CONTENT_TYPE',
      'Request must use multipart/form-data with a "file" field.'
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(
      400,
      'INVALID_FORM_DATA',
      'Unable to parse multipart form payload.'
    );
  }

  const fileEntry = formData.get('file');
  if (!fileEntry || typeof fileEntry === 'string') {
    return errorResponse(
      400,
      'MISSING_FILE',
      'No document file was provided in the "file" field.'
    );
  }

  const length = parseSummaryLength(formData.get('length'));
  const fileName = fileEntry.name || 'document';
  const declaredMimeType = fileEntry.type || '';
  const fileSizeBytes = fileEntry.size;
  const fileSizeKb = Math.round((fileSizeBytes / 1024) * 100) / 100;

  if (fileSizeBytes === 0) {
    return errorResponse(
      400,
      'EMPTY_FILE',
      'The uploaded file is empty (0 bytes) and cannot be processed.'
    );
  }

  if (fileSizeBytes > MAX_PDF_SIZE_BYTES) {
    return errorResponse(
      413,
      'FILE_TOO_LARGE',
      'File exceeds the maximum allowed upload size of 10 MB.'
    );
  }

  let buffer: Buffer | null = null;

  try {
    const arrayBuffer = await fileEntry.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);

    const validation = validateUploadedFileBinary({
      buffer,
      fileName,
      declaredMimeType,
    });

    if (!validation.valid) {
      logSanitizedRequest({
        fileType: declaredMimeType || 'unknown',
        fileSizeKb,
        statusCode: validation.statusCode,
        durationMs: Date.now() - startedAt,
        errorCode: validation.code,
      });
      return errorResponse(
        validation.statusCode,
        validation.code,
        validation.message
      );
    }

    const { detected } = validation;

    if (detected.kind === 'pdf') {
      const pdfResult = await parsePdfBuffer(buffer);
      const processingTimeMs = Date.now() - startedAt;

      logSanitizedRequest({
        fileType: detected.mimeType,
        fileSizeKb,
        statusCode: 200,
        durationMs: processingTimeMs,
        extractedCharacters: pdfResult.characterCount,
      });

      return NextResponse.json({
        success: true,
        data: {
          summary: '',
          length,
          keyPoints: [],
          improvementSuggestions: [],
          extractedText: pdfResult.text,
          meta: {
            fileName,
            fileType: detected.mimeType,
            fileSizeKb,
            pageCount: pdfResult.pageCount,
            parsedPages: pdfResult.parsedPages,
            truncated: pdfResult.truncated,
            wordCount: pdfResult.wordCount,
            extractedCharacters: pdfResult.characterCount,
            processingTimeMs,
            extractionMethod: 'pdf-parse',
          },
        },
      });
    }

    const ocrResult = await extractTextFromImage(buffer);
    const processingTimeMs = Date.now() - startedAt;

    logSanitizedRequest({
      fileType: detected.mimeType,
      fileSizeKb,
      statusCode: 200,
      durationMs: processingTimeMs,
      extractedCharacters: ocrResult.characterCount,
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: '',
        length,
        keyPoints: [],
        improvementSuggestions: [],
        extractedText: ocrResult.text,
        meta: {
          fileName,
          fileType: detected.mimeType,
          fileSizeKb,
          truncated: ocrResult.truncated,
          wordCount: ocrResult.wordCount,
          extractedCharacters: ocrResult.characterCount,
          processingTimeMs,
          confidenceScore: ocrResult.confidenceScore,
          extractionMethod: 'tesseract-ocr',
        },
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    if (error instanceof PdfParseError || error instanceof OcrExtractionError) {
      logSanitizedRequest({
        fileType: declaredMimeType || 'unknown',
        fileSizeKb,
        statusCode: error.statusCode,
        durationMs,
        errorCode: error.code,
      });
      return errorResponse(error.statusCode, error.code, error.message);
    }

    logSanitizedRequest({
      fileType: declaredMimeType || 'unknown',
      fileSizeKb,
      statusCode: 500,
      durationMs,
      errorCode: 'INTERNAL_SERVER_ERROR',
    });

    return errorResponse(
      500,
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred while extracting text from the document.'
    );
  } finally {
    // Release binary reference immediately for GC (zero-retention memory policy)
    buffer = null;
  }
}
