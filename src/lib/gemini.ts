import { GoogleGenAI } from '@google/genai';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Server-only guard to ensure API keys are never leaked to client bundles.
 */
if (typeof window !== 'undefined') {
  throw new Error('Gemini client should only be executed on the server side.');
}

/**
 * Validates and retrieves the Gemini API key from environment variables.
 * Throws a descriptive error if the key is missing or blank.
 */
export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env.local file.'
    );
  }
  return apiKey;
}

/**
 * Returns an instance of the modern @google/genai SDK client.
 */
export function getGoogleGenAIClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  return new GoogleGenAI({ apiKey });
}

/**
 * Returns an instance of the @google/generative-ai SDK client.
 */
export function getGenerativeAIClient(): GoogleGenerativeAI {
  const apiKey = getGeminiApiKey();
  return new GoogleGenerativeAI(apiKey);
}
