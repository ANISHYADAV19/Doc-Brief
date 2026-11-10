/**
 * Core TypeScript type definitions and shared contracts for DocBrief.
 */

export type SummaryLength = 'short' | 'medium' | 'long';

export type SuggestionPriority = 'high' | 'medium' | 'low';

export interface ImprovementSuggestion {
  category: string;
  priority: SuggestionPriority;
  suggestion: string;
}

export interface FileMetadata {
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  pageCount?: number;
  wordCount: number;
  extractedCharacters: number;
  processingTimeMs?: number;
  modelUsed?: string;
  confidenceScore?: number;
}

export interface AnalysisResult {
  summary: string;
  length: SummaryLength;
  keyPoints: string[];
  improvementSuggestions: ImprovementSuggestion[];
  meta: FileMetadata;
  extractedText?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface AnalyzeApiResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: ApiError;
}

export type ProcessingStepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

export interface ProcessingStep {
  id: number;
  label: string;
  description: string;
  status: ProcessingStepStatus;
}

export type ProcessingStatus = 
  | 'idle' 
  | 'uploading' 
  | 'extracting' 
  | 'synthesizing' 
  | 'completed' 
  | 'error';

export interface ProcessingState {
  status: ProcessingStatus;
  currentStep: number;
  progressPercent?: number;
  errorMessage?: string | null;
}

export interface ActiveDocument {
  file: File;
  previewUrl: string;
  fileType: 'pdf' | 'image';
  extractedText?: string;
}
