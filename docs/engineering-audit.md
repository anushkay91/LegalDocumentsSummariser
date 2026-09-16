# LegalLens Codebase & Engineering Architecture Audit

**Target System:** LegalLens — Personal Legal Document Intelligence & Attention Assistant  
**Repository:** `anushkay91/LegalDocumentsSummariser`  
**Date:** September 16, 2026  
**Auditor Roles:** Senior Staff Engineer, Security Engineer, GenAI/RAG Engineer, QA Engineer, Accessibility Engineer, Cloud Architect  
**Audit Scope:** Full repository architecture, security, data-flow, RAG retrieval, testing, accessibility, performance, and code quality.

---

## Executive Summary

LegalLens is a prototype web application designed to help individuals understand their personal legal documents (leases, employment contracts, NDAs, loan agreements) by extracting obligations, deadlines, financial commitments, and attention areas, as well as providing a document-grounded conversational interface.

While the current user interface demonstrates strong visual design and domain-appropriate UX paradigms (e.g., dual-pane viewer, plain-English synthesis, explicit disclaimers), the underlying implementation is an **unhardened prototype**. It contains severe architectural, security, and algorithmic deficiencies:
- **Zero authentication or authorization** on backend API endpoints.
- **Client-side storage of sensitive legal documents** in browser `localStorage`.
- **Absence of a true RAG pipeline** (currently uses naive substring keyword matching on paragraph splits).
- **Full-document transmission over the wire** on every chat message.
- **Synthetic fallback generation** that fabricates parties, dates, and terms when the AI key is unavailable.
- **Complete absence of automated testing infrastructure** (no unit, integration, e2e, security, or a11y test suites).
- **Accessibility violations** in modals and interactive controls.

This audit details each deficiency and establishes the technical migration roadmap.

---

## 1. Current Architecture

### 1.1 Technology Stack
- **Frontend Framework:** React 19.0.1 with TypeScript 5.8.2
- **Bundler & Tooling:** Vite 6.2.3, `@vitejs/plugin-react` 5.0.4
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` 4.1.14, `@import "tailwindcss";`)
- **Icons & Motion:** `lucide-react` 0.546.0, `motion` 12.23.24
- **Backend Server:** Express 4.21.2 running under `tsx` 4.21.0 on Node.js 22
- **AI SDK:** `@google/genai` 2.4.0 (Gemini 3.8 Flash model)
- **Deployment Strategy:** Cloud Run container binding to `0.0.0.0:3000` with Vite middleware in development and static file serving in production.

### 1.2 Module Organization
- `server.ts`: Monolithic entry point (402 lines) combining Express server setup, Vite dev middleware, Gemini client initialization, prompt engineering templates, naive keyword scoring, and API handlers.
- `src/App.tsx`: Central state container holding `documents`, `currentDocId`, `activeTab`, `userProfile`, and `auditLogs`. Reads from and synchronizes directly to `localStorage`.
- `src/types.ts`: Interface definitions for `LegalDocument`, `ExtractedSection`, `Obligation`, `Deadline`, `FinancialCommitment`, `AttentionItem`, `Inconsistency`, `Citation`, `ChatMessage`, `AuditLogEntry`, and `UserProfile`.
- `src/data/sampleDocuments.ts`: Three pre-configured legal agreements (Residential Lease, Employment Agreement, Mutual NDA) with pre-extracted sections.
- `src/components/`:
  - `Navbar.tsx`: Top bar with persistent legal disclaimer, document switcher, upload launcher, and tab navigation.
  - `OverviewTab.tsx`: Document summary, vital signs grid, metric cards, and extracted clause synthesis.
  - `AttentionTab.tsx`: Review priority items, filter bars, counsel discussion tags, and cross-clause inconsistencies.
  - `ObligationsTab.tsx`: Tabular and checklist view of user vs. counterparty duties and acknowledgement states.
  - `DeadlinesTab.tsx`: Timeline of notice windows, .ics calendar export, and copyable reminders.
  - `FinancialTab.tsx`: Itemized financial commitments (rent, deposits, penalties, escalations).
  - `DocumentDualViewer.tsx`: Paper-styled raw text viewer with search and clause highlighting.
  - `DocumentGroundedChat.tsx`: Conversational interface with suggested questions and citation cards.
  - `DocumentUploadModal.tsx`: File upload, raw text pasting, and sample document selection.
  - `AuditLogModal.tsx`: Session audit history and session wipe utility.

### 1.3 Existing API Endpoints
1. `GET /api/health`: Returns API status and whether `GEMINI_API_KEY` is configured.
2. `POST /api/documents/analyze`: Accepts `{ title, category, rawText }` from client, invokes Gemini 3.8 Flash (or returns mock synthetic data if key missing), returns extracted structure.
3. `POST /api/documents/rag-chat`: Accepts `{ query, documentTitle, documentCategory, documentText, history }`, executes naive keyword scoring against `documentText`, constructs prompt, returns grounded answer and citations.

---

## 2. Security Weaknesses

| ID | Weakness | Severity | Impact | Existing Code Evidence |
|---|---|---|---|---|
| SEC-01 | **No Authentication on APIs** | Critical | Anyone can hit `/api/documents/analyze` and `/api/documents/rag-chat` anonymously, consuming API quotas and computing resources. | `server.ts:88`, `server.ts:286` (No auth middleware) |
| SEC-02 | **No Authorization / Tenancy Check** | Critical | Documents have no server-side owner validation. Any client can pass arbitrary text or document identifiers without UID isolation. | No UID exists in backend models. |
| SEC-03 | **Sensitive Legal Data in localStorage** | High | Complete raw texts of leases, employment agreements, NDAs, and trade secrets are stored in plaintext in browser `localStorage`. Vulnerable to XSS and local session inspection. | `src/App.tsx:18-26`, `src/App.tsx:77-79` (`localStorage.setItem('legallens_documents', ...)`) |
| SEC-04 | **No File Validation / MIME Trust** | High | Client reads arbitrary files via `FileReader.readAsText()` with no server-side MIME type or magic byte validation, file size enforcement, or sanitization. | `DocumentUploadModal.tsx:46-63` |
| SEC-05 | **Unbounded Request Body Size** | High | Express body parser is configured with `limit: '25mb'` with no per-user rate limit, enabling Denial of Wallet attacks against the Gemini API. | `server.ts:12` (`express.json({ limit: '25mb' })`) |
| SEC-06 | **Prompt Injection Vulnerability** | High | Raw text and queries are inserted directly into prompt strings (`"""${rawText.slice(0, 25000)}"""`) without delimiter escaping or instruction isolation. Malicious clauses can hijack model instructions. | `server.ts:157-159`, `server.ts:311-316` |
| SEC-07 | **Information Leakage in Error Responses** | Medium | Internal error messages are sent directly to clients: `res.status(500).json({ error: message })`. Exposes internal stack/paths. | `server.ts:281-282`, `server.ts:376-377` |
| SEC-08 | **Hardcoded User Profile** | Medium | User identity is simulated on the frontend with hardcoded ID `user-default-1` and email `alex.morgan@workspace.local`. | `src/App.tsx:47-56` |

---

## 3. Data-Flow Weaknesses

1. **Client-Side Heavy Processing:**
   - Raw text is read by the browser, sent to the server for analysis, returned to the browser in its entirety, and stored in the browser's `localStorage`.
   - The server retains no state; there is no persistent database record.
2. **Repeated Full-Document Transmissions:**
   - On every question asked in `DocumentGroundedChat.tsx`, the client re-transmits the complete `document.rawText` across the network (`DocumentGroundedChat.tsx:99`).
   - For long contracts, this causes severe latency, token consumption, and network saturation.
3. **Absence of Secure Storage:**
   - Documents are not stored in secure cloud object storage (such as Firebase Cloud Storage).
   - If the browser cache is cleared or session wiped, user documents are permanently lost.
4. **Disjointed Delete Lifecycle:**
   - Deleting or resetting a session (`handleWipeSession`) simply clears `localStorage` and re-injects sample data in the frontend. It executes no server-side cleanup, audit persistence, or chunk deletion.

---

## 4. RAG Weaknesses

1. **Absence of Semantic Embeddings:**
   - Current retrieval (`retrieveRelevantChunks` in `server.ts:49-75`) splits text on double-newlines (`text.split(/\n\s*\n+/)`) and counts keyword occurrences:
     ```typescript
     for (const term of queryTerms) {
       if (lowerPara.includes(term)) score += 3;
     }
     ```
   - This is crude keyword matching, not Retrieval-Augmented Generation. Synonyms, conceptual queries (e.g., "What happens if I get fired?" vs. "Termination for convenience"), and semantic intent are completely missed.
2. **No Page-Aware Chunking:**
   - Chunks do not track page boundaries or section hierarchical IDs. Page numbers are guessed or output as `N/A`.
3. **No Multi-Tenancy in Retrieval:**
   - Since chunks are calculated ad-hoc per request from client-supplied text, there is no vector index. When a vector index is introduced, strict UID filtering is mandatory to prevent cross-tenant information leaks.
4. **Fragmented Context Window:**
   - The top 5–6 arbitrary paragraphs are concatenated into the prompt without semantic reranking or sliding-window overlap, leading to broken clause boundaries.

---

## 5. Testing Gaps

1. **Zero Test Runner:**
   - `package.json` contains no test dependencies (`vitest`, `jest`, `@testing-library/react`, `playwright`, `axe-core`).
   - The only quality script is `"lint": "tsc --noEmit"`.
2. **Missing Test Categories:**
   - **Unit Tests:** None (no tests for attention scoring, date calculation, deadline urgency, chunking, or schema validation).
   - **Integration Tests:** None (no tests for Express API endpoints, token verification, or error handling).
   - **Security Tests:** None (no tests for unauthenticated calls, cross-user document access, token forgery, or prompt injection).
   - **AI Groundedness Tests:** None (no golden dataset to evaluate citation accuracy, hallucination prevention, or unanswerable queries).
   - **Accessibility Tests:** None (no automated axe scans or keyboard navigation testing).
   - **E2E Tests:** None (no browser-level user flow verification).

---

## 6. Accessibility (a11y) Gaps

1. **Non-Compliant Modals:**
   - `DocumentUploadModal.tsx` and `AuditLogModal.tsx` are rendered as generic `fixed inset-0` `div` containers:
     - Missing `role="dialog"` or `role="alertdialog"`.
     - Missing `aria-modal="true"`.
     - Missing `aria-labelledby` and `aria-describedby`.
     - No keyboard focus trap (tabbing leaves the modal).
     - No Escape key listener to close modal.
     - Focus is not restored to the trigger element on close.
2. **Non-Semantic Interactive Elements:**
   - In `DocumentUploadModal.tsx`, preloaded sample agreements are rendered as clickable `<div>` elements without `role="button"`, `tabIndex={0}`, or keyboard `Enter`/`Space` handlers.
   - In `OverviewTab.tsx`, metric cards are clickable `div` elements without keyboard affordances.
3. **Screen Reader Notification (Live Regions):**
   - In `DocumentGroundedChat.tsx`, assistant responses stream or render with no `aria-live="polite"` region, leaving screen-reader users unaware that an answer has arrived.
   - Loading spinners lack `role="status"` and accessible text descriptions.
4. **Form Labels:**
   - Form inputs (e.g., `#chat-query-input`, `#document-selector`, modal title inputs) lack linked `<label htmlFor="...">` elements.

---

## 7. Performance Gaps

1. **O(N) Payload Bloat:**
   - Chatting with a 50-page agreement transfers the entire document text in the HTTP POST body on every turn.
2. **Regex Parsing Fragility:**
   - In `server.ts:269`, when JSON parsing fails, the code attempts `text.match(/\{[\s\S]*\}/)`. This greedy regular expression on large text can cause catastrophic backtracking or truncated JSON extraction.
3. **No Database Indexing or Caching:**
   - Documents are re-analyzed from scratch with no caching of chunk embeddings or extracted section graphs.

---

## 8. Code-Quality & Architecture Issues

1. **Fabricated Fallback Data Violation (CRITICAL):**
   - When `GEMINI_API_KEY` is not present, `server.ts:98-149` synthesizes artificial parties ("Party A", "Party B"), fake obligations, and generic attention items.
   - In a legal intelligence application, **fabricating contractual terms is unacceptable**. The system must explicitly state that analysis cannot be completed without the requisite AI configuration, never invent terms.
2. **Non-Deterministic "Attention Score":**
   - Currently, attention items and priorities ("high", "medium", "low") are generated directly by Gemini prompt output without deterministic mathematical factors (such as deadline proximity, financial ratio, or unilateral notice disparity).
3. **Monolithic Server:**
   - `server.ts` combines routing, external API integration, heuristics, and Vite dev middleware into a single file with no separation of concerns.

---

## 9. Migration Plan & Sequence

We will implement the required fixes strictly following the phases mandated by the project instructions:

```
Phase 0: Codebase Audit (Current Phase - Completed via docs/engineering-audit.md)
   ↓
Phase 1: Real Authentication (Firebase Auth, AuthProvider, Bearer token verification middleware)
   ↓
Phase 2: Firestore Data Model (Schema blueprint, users/{uid}/documents subcollections)
   ↓
Phase 3: Firebase Security Rules (Draft & hardened firestore.rules, storage rules)
   ↓
Phase 4: Secure Document Storage (Firebase Cloud Storage, MIME/byte validation)
   ↓
Phase 5: Secure Document API (Authenticated endpoints: POST /api/documents, GET, DELETE)
   ↓
Phase 6: Remove localStorage Persistence (Eliminate legallens_documents, client-only UI state)
   ↓
Phase 7: Real RAG Pipeline (Page-aware extraction, chunking, embeddings, vector indexing, UID filter)
   ↓
Phase 8: Token & Network Optimization (Eliminate rawText resend in chat, query by docId)
   ↓
Phase 9: Page-Aware Citations (Section, page, verbatim quote, chunk verification)
   ↓
Phase 10: Remove Fake AI Fallback Data (Clear processing error when AI unavailable, no hallucinations)
   ↓
Phase 11: Structured AI Output (Schema validation, enum verification, robust parse error recovery)
   ↓
Phase 12: Deterministic Attention Engine (Mathematical scoring based on deadline proximity, penalties, notice disparity)
   ↓
Phase 13: Real-Time Dashboard (Firestore onSnapshot listeners, live state synchronization)
   ↓
Phase 14: Complete Delete Lifecycle (Storage, metadata, sections, chunks, chat cascade delete)
   ↓
Phase 15: Input Validation & Runtime Guards (Zod/validation schemas for all requests)
   ↓
Phase 16: Rate Limiting & Abuse Protection (Express rate-limiters, per-user quotas)
   ↓
Phase 17: Safe Error Handling (Sanitized user errors, separated diagnostic logging)
   ↓
Phase 18: Backend Architecture Refactor (server/ routes, services, middleware, rag, auth, validation)
   ↓
Phase 19: Testing Infrastructure (Vitest, React Testing Library, axe-core setup & test runner scripts)
   ↓
Phase 20: Unit Testing Suite (Attention engine, date calculations, chunking, validation)
   ↓
Phase 21: Security Testing Suite (Auth guards, multi-tenant isolation, prompt injection, token checks)
   ↓
Phase 22 & 23: AI Golden Dataset & Hallucination Testing (Synthetic test contracts, unanswerable queries)
   ↓
Phase 24, 25 & 26: Accessibility Hardening (axe-core verification, modal dialog roles, aria-live chat)
   ↓
Phase 27 & 28: Efficiency & Performance Verification (Payload benchmarks, lazy loading)
   ↓
Phase 29 & 30: Secrets Security & Cloud Run Hardening (Secret Manager, 0.0.0.0 binding, healthcheck)
   ↓
Phase 31 & 32: CI Quality Gate & Final Quality Report (docs/quality-report.md)
```

---

## 10. Verification of Phase 0 Audit

- All target files (`package.json`, `server.ts`, `src/App.tsx`, `src/types.ts`, upload modal, grounded chat, tabs, configuration files) have been inspected in detail.
- No functional code modifications have been made during this turn, strictly adhering to the **Phase 0 Audit** constraint.
- The next step is **Phase 1: Real Authentication**, which will establish verified Firebase Authentication and backend Bearer token verification.
