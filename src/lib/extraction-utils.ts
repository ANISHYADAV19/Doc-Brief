/**
 * Shared text normalization, truncation, word-counting, and timeout utilities
 * used across PDF parsing and OCR extraction pipelines.
 */

export const MAX_EXTRACTED_CHARACTERS = 500_000;

/**
 * Normalizes raw extracted text by standardizing line endings, removing control bytes,
 * trimming trailing line whitespace, and collapsing excessive blank lines.
 */
export function normalizeExtractedText(
  raw: string,
  options: { collapseInlineSpaces?: boolean } = {}
): string {
  const { collapseInlineSpaces = false } = options;

  let text = raw
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    // Strip ASCII control characters other than \n (0x0A) and \t (0x09)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  const lines = text.split('\n').map((line) => {
    const trimmedRight = line.replace(/[ \t]+$/g, '');
    if (collapseInlineSpaces) {
      return trimmedRight.replace(/^[ \t]+/g, '').replace(/[ \t]{2,}/g, ' ');
    }
    return trimmedRight;
  });

  text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

/**
 * Enforces the maximum character cap by preserving the opening 75% and closing 25%
 * of oversized documents with an explicit truncation marker.
 */
export function truncateExtractedText(
  text: string,
  maxChars: number = MAX_EXTRACTED_CHARACTERS
): { text: string; truncated: boolean } {
  if (text.length <= maxChars) {
    return { text, truncated: false };
  }

  const marker = '\n\n[... Document truncated at 500,000-character processing limit ...]\n\n';
  const available = Math.max(0, maxChars - marker.length);
  const headLength = Math.floor(available * 0.75);
  const tailLength = available - headLength;

  const head = text.slice(0, headLength).trimEnd();
  const tail = text.slice(text.length - tailLength).trimStart();

  return {
    text: `${head}${marker}${tail}`,
    truncated: true,
  };
}

/**
 * Counts whitespace-delimited words in normalized text.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Races an async operation against a hard execution timeout, clearing the timer on settle.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  createTimeoutError: () => Error
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(createTimeoutError());
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
