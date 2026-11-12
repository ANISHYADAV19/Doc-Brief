import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_PDF_SIZE_BYTES,
  SUPPORTED_EXTENSIONS,
  getFileExtension,
  type DocumentKind,
  type SupportedExtension,
} from './validation';
import { formatFileSize } from './utils';

export type MagicFileFormat = 'pdf' | 'png' | 'jpeg' | 'webp';

export interface MagicDetectionResult {
  format: MagicFileFormat;
  kind: DocumentKind;
  mimeType: string;
  label: string;
}

export type ServerFileValidationResult =
  | {
      valid: true;
      detected: MagicDetectionResult;
    }
  | {
      valid: false;
      statusCode: 400 | 413 | 415;
      code: string;
      message: string;
    };

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

const EXTENSION_TO_FORMAT: Record<SupportedExtension, MagicFileFormat> = {
  '.pdf': 'pdf',
  '.png': 'png',
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.webp': 'webp',
};

const FORMAT_ALLOWED_MIMES: Record<MagicFileFormat, readonly string[]> = {
  pdf: ['application/pdf', 'application/x-pdf'],
  png: ['image/png'],
  jpeg: ['image/jpeg', 'image/jpg', 'image/pjpeg'],
  webp: ['image/webp'],
};

function hasPrefixBytes(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

function isPdfSignature(bytes: Uint8Array): boolean {
  // %PDF- -> 0x25 0x50 0x44 0x46 0x2D
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function isPngSignature(bytes: Uint8Array): boolean {
  return hasPrefixBytes(bytes, PNG_SIGNATURE);
}

function isJpegSignature(bytes: Uint8Array): boolean {
  // FF D8 FF
  return (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  );
}

function isWebpSignature(bytes: Uint8Array): boolean {
  // RIFF....WEBP
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

/**
 * Inspects binary file header bytes (Magic Bytes) to determine the true format
 * independently of client-supplied extensions or Content-Type MIME headers.
 */
export function detectMagicFileType(bytes: Uint8Array): MagicDetectionResult | null {
  if (isPdfSignature(bytes)) {
    return {
      format: 'pdf',
      kind: 'pdf',
      mimeType: 'application/pdf',
      label: 'PDF',
    };
  }

  if (isPngSignature(bytes)) {
    return {
      format: 'png',
      kind: 'image',
      mimeType: 'image/png',
      label: 'PNG',
    };
  }

  if (isJpegSignature(bytes)) {
    return {
      format: 'jpeg',
      kind: 'image',
      mimeType: 'image/jpeg',
      label: 'JPEG',
    };
  }

  if (isWebpSignature(bytes)) {
    return {
      format: 'webp',
      kind: 'image',
      mimeType: 'image/webp',
      label: 'WEBP',
    };
  }

  return null;
}

/**
 * Validates an uploaded file's binary buffer using Magic Bytes verification,
 * extension/MIME consistency checks (anti-spoofing), and per-format byte caps.
 */
export function validateUploadedFileBinary(params: {
  buffer: Uint8Array;
  fileName?: string;
  declaredMimeType?: string;
}): ServerFileValidationResult {
  const { buffer, fileName = '', declaredMimeType = '' } = params;

  if (buffer.byteLength === 0) {
    return {
      valid: false,
      statusCode: 400,
      code: 'EMPTY_FILE',
      message: 'The uploaded file is empty (0 bytes) and cannot be processed.',
    };
  }

  const ext = getFileExtension(fileName);
  if (ext && !SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension)) {
    return {
      valid: false,
      statusCode: 415,
      code: 'UNSUPPORTED_FILE_TYPE',
      message: `The provided file format (${ext}) is not supported. Please upload a PDF, PNG, JPG, or WEBP file.`,
    };
  }

  const detected = detectMagicFileType(buffer);
  if (!detected) {
    return {
      valid: false,
      statusCode: 415,
      code: 'UNSUPPORTED_FILE_TYPE',
      message:
        'Unrecognized or invalid binary file signature. Only authentic PDF (%PDF-), PNG, JPEG, and WEBP files are accepted.',
    };
  }

  if (ext) {
    const expectedFormat = EXTENSION_TO_FORMAT[ext as SupportedExtension];
    if (expectedFormat !== detected.format) {
      return {
        valid: false,
        statusCode: 415,
        code: 'MIME_SIGNATURE_MISMATCH',
        message: `File extension (${ext}) does not match the binary file signature (${detected.label}).`,
      };
    }
  }

  const normalizedMime = declaredMimeType.trim().toLowerCase();
  if (normalizedMime !== '' && normalizedMime !== 'application/octet-stream') {
    const allowedMimes = FORMAT_ALLOWED_MIMES[detected.format];
    if (!allowedMimes.includes(normalizedMime)) {
      return {
        valid: false,
        statusCode: 415,
        code: 'MIME_SIGNATURE_MISMATCH',
        message: `Declared Content-Type "${declaredMimeType}" does not match the binary signature (${detected.label}).`,
      };
    }
  }

  const maxSizeBytes =
    detected.kind === 'pdf' ? MAX_PDF_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  const maxLabel = detected.kind === 'pdf' ? '10 MB' : '5 MB';

  if (buffer.byteLength > maxSizeBytes) {
    return {
      valid: false,
      statusCode: 413,
      code: 'FILE_TOO_LARGE',
      message: `File size (${formatFileSize(buffer.byteLength)}) exceeds the ${maxLabel} limit for ${detected.kind === 'pdf' ? 'PDFs' : 'images'}.`,
    };
  }

  return {
    valid: true,
    detected,
  };
}
