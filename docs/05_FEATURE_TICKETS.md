# Feature Ticket List (Agile Backlog)
## Document Summary Assistant ("DocBrief")

**Document Version:** 1.0.0  
**Methodology:** Agile Kanban / Sprints  
**Target Completion:** 8-Hour Execution Budget  

---

## Sprint Summary & Story Point Distribution

| Epic ID | Epic Name | Priority | Total Tickets | Est. Time (Hours) |
| :--- | :--- | :---: | :---: | :---: |
| **EPIC-1** | Project Setup & Infrastructure | P0 | 3 | 1.0 hr |
| **EPIC-2** | File Ingestion & Document Preview | P0 | 3 | 1.5 hrs |
| **EPIC-3** | Text Extraction Pipeline (PDF + OCR) | P0 | 3 | 1.5 hrs |
| **EPIC-4** | AI Summarization & Improvement Engine | P0 | 3 | 1.5 hrs |
| **EPIC-5** | UI/UX Refinement & Polish | P1 | 3 | 1.5 hrs |
| **EPIC-6** | Deployment & Documentation | P0 | 2 | 1.0 hr |
| **TOTAL** | | | **17 Tickets** | **8.0 Hours** |

---

## Epic 1: Project Setup & Infrastructure

### [DOC-101] Scaffold Next.js 14/15 App Router Project with TypeScript & Tailwind CSS
- **Priority:** P0 (Blocker)
- **Est. Time:** 0.5 hr
- **Description:** Initialize modern Next.js project with TypeScript, Tailwind CSS, Lucide React, and essential utility libraries (`clsx`, `tailwind-merge`).
- **Acceptance Criteria:**
  - Clean directory structure created (`/src/app`, `/src/components`, `/src/lib`, `/src/types`).
  - Strict TypeScript configuration (`tsconfig.json`).
  - Tailwind configured with slate palette, gradients, and typography utilities.
  - Development server runs without warnings (`npm run dev`).

### [DOC-102] Environment Configuration & Gemini API Integration Setup
- **Priority:** P0 (Blocker)
- **Est. Time:** 0.25 hr
- **Description:** Configure environment variable handling for Google Gemini API key (`GEMINI_API_KEY`) and provide `.env.example`.
- **Acceptance Criteria:**
  - Client SDK or fetch client initialized with secure server-only runtime checks.
  - Graceful fallback error message if API key is not configured.
  - `.gitignore` verifies `.env*.local` is never committed.

### [DOC-103] Define Core TypeScript Interfaces & Shared Types
- **Priority:** P0
- **Est. Time:** 0.25 hr
- **Description:** Define unified type contracts for documents, analysis responses, summary lengths, suggestions, and processing states.
- **Acceptance Criteria:**
  - Interfaces created for `AnalysisResult`, `SummaryLength`, `ImprovementSuggestion`, `ProcessingStep`, and `FileMetadata`.

---

## Epic 2: File Ingestion & Document Preview

### [DOC-201] Drag-and-Drop Dropzone Component with File Picker
- **Priority:** P0
- **Est. Time:** 0.5 hr
- **User Story:** *As a user, I want to drag-and-drop or browse for my PDF or image so I can easily initiate the summary process.*
- **Acceptance Criteria:**
  - Supports `.pdf`, `.png`, `.jpg`, `.jpeg`, and `.webp`.
  - Visual drag-over active state (pulsing border and highlight).
  - Triggers native file browser on click.
  - Accessible via keyboard navigation (`Tab` and `Enter/Space`).

### [DOC-202] Client-Side File Validation & Error Toasts
- **Priority:** P0
- **Est. Time:** 0.5 hr
- **User Story:** *As a user, I want immediate feedback if my file is unsupported or too large so that I don't wait for a failed server upload.*
- **Acceptance Criteria:**
  - Enforces size limit: 10MB for PDFs, 5MB for images.
  - Rejects unsupported extensions instantly with clear error message.
  - Displays dismissible warning banner/toast.

### [DOC-203] In-Browser Document Previewer (PDF & Image View)
- **Priority:** P1
- **Est. Time:** 0.5 hr
- **User Story:** *As a user, I want to see a live visual preview of my document beside the summary so that I can cross-reference the original material.*
- **Acceptance Criteria:**
  - Generates secure `URL.createObjectURL` for immediate client-side preview.
  - Renders responsive image viewer for images.
  - Renders embedded viewer for PDFs.
  - Includes file info strip showing file name, size, and format badge.

---

## Epic 3: Text Extraction Pipeline (PDF Parsing & OCR)

### [DOC-301] Server-Side PDF Parsing Service
- **Priority:** P0
- **Est. Time:** 0.5 hr
- **User Story:** *As a user, I want the system to parse text from digital PDFs accurately while retaining structural flow.*
- **Acceptance Criteria:**
  - Integrates `pdf-parse` (or `unpdf`) in serverless route handler.
  - Extracts full body text, page count, and metadata.
  - Handles multi-page documents up to 50 pages.
  - Returns `422` with clear message if PDF is encrypted or corrupted.

### [DOC-302] OCR Worker Service for Scanned Images
- **Priority:** P0
- **Est. Time:** 0.5 hr
- **User Story:** *As a user, I want to upload photos of documents or scanned receipts and have the text extracted using OCR.*
- **Acceptance Criteria:**
  - Implements `tesseract.js` OCR engine in worker/server environment.
  - Ingests image buffers (`.png`, `.jpg`, `.jpeg`, `.webp`).
  - Cleans up whitespace and returns confidence score + extracted text.
  - Gracefully detects blank/illegible scans (`< 20` characters).

### [DOC-303] Unified Ingestion Router & Server Magic Bytes Validation
- **Priority:** P0
- **Est. Time:** 0.5 hr
- **User Story:** *As a system, I want to inspect file magic bytes on the server to prevent file spoofing and route to the correct extractor.*
- **Acceptance Criteria:**
  - Inspects initial buffer bytes (`%PDF-`, `PNG`, `JPEG`).
  - Dynamically routes to PDF parser or OCR engine.
  - Returns unified text payload to the summarization stage.

---

## Epic 4: AI Summarization & Improvement Suggestions

### [DOC-401] Structured Prompt Engineering & Gemini 1.5 Flash Client
- **Priority:** P0
- **Est. Time:** 0.5 hr
- **User Story:** *As a user, I want smart, factual summaries with key points and actionable document improvement suggestions.*
- **Acceptance Criteria:**
  - Implements system prompt enforcing structured JSON output schema.
  - Enforces temperature 0.2 to maximize factual fidelity and minimize hallucinations.
  - Returns `summary`, `keyPoints[]`, and `improvementSuggestions[]`.

### [DOC-402] Summary Length Calibration Controls (Short, Medium, Long)
- **Priority:** P0
- **Est. Time:** 0.5 hr
- **User Story:** *As a user, I want to toggle between Short, Medium, and Long summaries to match my available reading time.*
- **Acceptance Criteria:**
  - UI segmented control for `Short (~100 words)`, `Medium (~250 words)`, `Long (~500+ words)`.
  - Re-summarizes instantly using cached extracted text without re-uploading file.
  - Short summary emphasizes 3-bullet brevity; long summary delivers section-by-section breakdown.

### [DOC-403] Document Improvement Suggestions Engine
- **Priority:** P0
- **Est. Time:** 0.5 hr
- **User Story:** *As a user, I want feedback on how my uploaded document can be improved in clarity, tone, or completeness.*
- **Acceptance Criteria:**
  - Generates 2 to 4 ranked recommendations.
  - Each suggestion displays a priority badge (`High`, `Medium`, `Low`) and category (`Clarity`, `Completeness`, `Structure`).

---

## Epic 5: UI/UX Refinement, Error Handling & Micro-Interactions

### [DOC-501] Multi-Stage Progress Stepper & Loading Skeletons
- **Priority:** P1
- **Est. Time:** 0.5 hr
- **User Story:** *As a user, I want to see the exact stage of processing (Upload -> Extraction -> AI Synthesis) so that the app feels responsive.*
- **Acceptance Criteria:**
  - Visual 3-stage animated stepper with pulsing status pills.
  - Skeleton screens for summary paragraphs and bullet cards during generation.
  - Zero Cumulative Layout Shift (CLS) when data renders.

### [DOC-502] Action Bar: Copy to Clipboard & File Export (.md / .txt)
- **Priority:** P1
- **Est. Time:** 0.5 hr
- **User Story:** *As a user, I want to copy the summary or download it as Markdown/Text with one click so I can paste it into notes or emails.*
- **Acceptance Criteria:**
  - One-click copy with icon transition to checkmark for 2 seconds.
  - Export button triggers `.md` file download containing title, summary, key points, and suggestions.
  - Reset button to clear session and return to clean dropzone.

### [DOC-503] Raw Extracted Text Inspection Modal
- **Priority:** P1
- **Est. Time:** 0.5 hr
- **User Story:** *As a user, I want to inspect the raw extracted OCR/PDF text so that I can verify extraction accuracy.*
- **Acceptance Criteria:**
  - Secondary button: *"View Raw Extracted Text"*.
  - Opens accessible modal or drawer with scrollable monospaced text and character count.

---

## Epic 6: Deployment, CI/CD & Documentation

### [DOC-601] Cloud Deployment to Vercel
- **Priority:** P0 (Deliverable)
- **Est. Time:** 0.5 hr
- **Description:** Deploy the production Next.js build to Vercel with environment variable configuration and SSL.
- **Acceptance Criteria:**
  - Live public URL accessible worldwide on HTTPS.
  - Serverless function limits and API timeouts properly configured.
  - Zero build errors or client hydration warnings.

### [DOC-602] Comprehensive Repository README & 200-Word Approach Write-Up
- **Priority:** P0 (Deliverable)
- **Est. Time:** 0.5 hr
- **Description:** Produce comprehensive README with architecture overview, local setup steps, API documentation, and the assessment-required 200-word approach brief.
- **Acceptance Criteria:**
  - Clear installation and run commands (`npm install`, `npm run dev`, `npm run build`).
  - Architecture diagram embedded.
  - Exact 200-word approach summary included for the evaluation committee.
