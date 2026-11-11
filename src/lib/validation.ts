import { formatFileSize } from './utils';

export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const SUPPORTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export type DocumentKind = 'pdf' | 'image';

export const DROPZONE_ACCEPT =
  '.pdf,application/pdf,.png,image/png,.jpg,.jpeg,image/jpeg,.webp,image/webp';

const EXTENSION_MIME_MAP: Record<SupportedExtension, readonly string[]> = {
  '.pdf': ['application/pdf', 'application/x-pdf'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg', 'image/jpg', 'image/pjpeg'],
  '.jpeg': ['image/jpeg', 'image/jpg', 'image/pjpeg'],
  '.webp': ['image/webp'],
};

export type ValidationErrorCode =
  | 'EMPTY_FILE'
  | 'UNSUPPORTED_EXTENSION'
  | 'INVALID_MIME_TYPE'
  | 'FILE_TOO_LARGE';

export type FileValidationResult =
  | {
      valid: true;
      fileType: DocumentKind;
      extension: SupportedExtension;
      formatLabel: string;
    }
  | {
      valid: false;
      errorCode: ValidationErrorCode;
      errorTitle: string;
      errorMessage: string;
    };

/**
 * Extracts the lowercase file extension including the leading dot (e.g. ".pdf").
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === fileName.length - 1) {
    return '';
  }
  return fileName.slice(lastDot).toLowerCase();
}

/**
 * Returns a clean uppercase badge label for a file (e.g. "PDF", "PNG", "JPG", "WEBP").
 */
export function getFormatLabel(file: Pick<File, 'name' | 'type'>): string {
  const ext = getFileExtension(file.name);
  if (ext === '.jpeg' || ext === '.jpg') return 'JPG';
  if (ext.startsWith('.')) return ext.slice(1).toUpperCase();
  if (file.type === 'application/pdf') return 'PDF';
  if (file.type.startsWith('image/')) return file.type.slice(6).toUpperCase();
  return 'FILE';
}

/**
 * Validates an uploaded document against DocBrief's supported formats, MIME types,
 * and size guardrails (<= 10 MB for PDFs, <= 5 MB for images).
 */
export function validateDocumentFile(file: File): FileValidationResult {
  const ext = getFileExtension(file.name);

  if (!SUPPORTED_EXTENSIONS.includes(ext as SupportedExtension)) {
    const extLabel = ext ? `"${ext}"` : 'this file type';
    return {
      valid: false,
      errorCode: 'UNSUPPORTED_EXTENSION',
      errorTitle: 'Unsupported file format',
      errorMessage: `Cannot upload ${extLabel}. Please select a PDF, PNG, JPG, or WEBP file.`,
    };
  }

  const supportedExt = ext as SupportedExtension;
  const normalizedMime = file.type.trim().toLowerCase();

  if (normalizedMime !== '') {
    const allowedMimes = EXTENSION_MIME_MAP[supportedExt];
    if (!allowedMimes.includes(normalizedMime)) {
      return {
        valid: false,
        errorCode: 'INVALID_MIME_TYPE',
        errorTitle: 'Invalid file type',
        errorMessage: `"${file.name}" has MIME type "${file.type}", which does not match ${supportedExt.toUpperCase()} files.`,
      };
    }
  }

  if (file.size === 0) {
    return {
      valid: false,
      errorCode: 'EMPTY_FILE',
      errorTitle: 'Empty file detected',
      errorMessage: `"${file.name}" is 0 bytes and cannot be processed. Please select a valid document.`,
    };
  }

  const fileType: DocumentKind = supportedExt === '.pdf' ? 'pdf' : 'image';
  const maxBytes = fileType === 'pdf' ? MAX_PDF_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  const maxLabel = fileType === 'pdf' ? '10 MB' : '5 MB';

  if (file.size > maxBytes) {
    return {
      valid: false,
      errorCode: 'FILE_TOO_LARGE',
      errorTitle: fileType === 'pdf' ? 'PDF exceeds 10 MB limit' : 'Image exceeds 5 MB limit',
      errorMessage: `"${file.name}" is ${formatFileSize(file.size)}. Maximum allowed size for ${
        fileType === 'pdf' ? 'PDFs' : 'images'
      } is ${maxLabel}.`,
    };
  }

  return {
    valid: true,
    fileType,
    extension: supportedExt,
    formatLabel: getFormatLabel(file),
  };
}
