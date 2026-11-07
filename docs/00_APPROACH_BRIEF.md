# Project Approach Brief (200 Words Max)
## Assessment Deliverable #3: Document Summary Assistant ("DocBrief")

**Word Count:** 188 words (Strictly within the 200-word limit)

---

### Engineering Approach Summary

To deliver a production-grade Document Summary Assistant within the 8-hour timeline, I designed **DocBrief** as a unified full-stack TypeScript application using **Next.js App Router** hosted on **Vercel**. 

The ingestion pipeline employs a dual-engine architecture: digital PDFs are parsed natively via serverless stream extractors preserving document hierarchy, while raster scans and images are processed using a WebAssembly-powered **Tesseract.js OCR** worker, eliminating fragile native OS binary dependencies. 

Extracted text is routed to **Google Gemini 1.5 Flash**, constrained by strict JSON schema system prompts at low temperature (0.2). This guarantees hallucination-resistant, parametric summaries across three calibrated lengths (Short ~100w, Medium ~250w, Long ~500w), alongside extracted key highlights and categorized document improvement suggestions.

To ensure enterprise-grade security and zero data leakage, the architecture adheres to a strict **zero-retention policy**: files reside exclusively in ephemeral memory buffers during extraction and are immediately garbage-collected. The frontend features a responsive, Linear-inspired dual-column workspace with live document previews, a progressive 3-stage loading stepper, instant clipboard/markdown exports, and robust edge-case validation.
