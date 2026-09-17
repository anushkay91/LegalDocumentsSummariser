# LegalLens — Security & Efficiency Comprehensive Audit

**Repository:** `anushkay91/LegalDocumentsSummariser`  
**Audit Type:** Security & Efficiency Hardening Baseline (Phase 0)  
**Date:** September 17, 2026  
**Auditor:** Principal Security & Cloud Architecture Team  

---

## 1. Executive Summary

A deep, non-assumptive source code inspection of the current LegalLens repository was conducted. While the application presents a sophisticated legal intelligence user interface, the system has critical security, privacy, and efficiency vulnerabilities across authentication, storage, data-flow, and retrieval layers.

The table below outlines the 14 core inspection items with precise file paths, current status, and architectural weaknesses.

---

## 2. Detailed 14-Point Architectural Verification

### 1. Where authentication is actually implemented
* **File Paths:**
  * Frontend: `src/context/AuthContext.tsx`, `src/lib/firebase.ts`
  * Backend: `server/middleware/auth.ts`, `server.ts`
* **Current Status & Weakness:**
  * Frontend authentication relies on a hybrid mechanism. While Google Sign-in exists, if anonymous sign-in is restricted by the Firebase project console, `AuthContext.tsx` falls back to generating a fake `guest-session-*` token in `localStorage` (`getOrCreateGuestSessionToken()`).
  * In `server/middleware/auth.ts`, `requireAuth` explicitly trusts `guest-session-*` and `test-token-*` prefixes without any cryptographic validation, allowing an attacker to supply any arbitrary unverified string header to gain authorization.

### 2. Whether Firebase Authentication is actually connected
* **File Paths:** `src/lib/firebase.ts`, `firebase-applet-config.json`
* **Current Status & Weakness:**
  * Partially connected. `firebase-applet-config.json` is loaded on the client and initializes Firebase App and Auth (`getAuth(app)`).
  * However, users who do not sign in via Google OAuth are assigned pseudo-identities that bypass real Firebase Auth verification. The backend does not enforce real Firebase ID tokens.

### 3. Whether Firebase Admin is installed and used
* **File Paths:** `package.json`, `server/middleware/auth.ts`
* **Current Status & Weakness:**
  * **NOT installed and NOT used.**
  * `package.json` only contains client `firebase: "^12.19.0"`. `firebase-admin` is completely missing.
  * Backend token verification in `server/middleware/auth.ts` uses an unauthenticated HTTP `fetch` to Google Identity Toolkit REST API (`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=...`), which is slower, lacks local cryptographic caching of public keys, and lacks Admin SDK capabilities (like Firestore/Storage admin privileges).

### 4. Whether Firestore is actually used
* **File Paths:** `src/lib/firebase.ts`, `src/lib/firestoreService.ts`, `src/App.tsx`, `firestore.rules`
* **Current Status & Weakness:**
  * Partially implemented but critically incomplete.
  * `src/lib/firestoreService.ts` contains `saveDocumentToFirestore` and `loadUserDocumentsFromFirestore`, but they only write a monolithic JSON dump to `/users/{userId}/documents/{documentId}`.
  * The required subcollections (`sections`, `deadlines`, `obligations`, `attention`, `chatSessions`) are **never written or created**.
  * Furthermore, guest users or users without active Google auth bypass Firestore completely, storing data in the browser.

### 5. Whether Firebase Storage is actually used
* **File Paths:** `src/lib/firebase.ts`, `src/components/DocumentUploadModal.tsx`, `server.ts`
* **Current Status & Weakness:**
  * **NOT used at all.**
  * Files are read entirely in the browser using the JavaScript `FileReader` API (`readAsText`), and the raw text string is either held in React state or sent over HTTP.
  * No file binaries or original legal PDFs/DOCs are uploaded to Firebase Storage at `users/{uid}/documents/{documentId}/original`.

### 6. Whether backend APIs verify user identity
* **File Paths:** `server.ts`, `server/middleware/auth.ts`
* **Current Status & Weakness:**
  * The endpoints `/api/documents/analyze` and `/api/documents/rag-chat` attach `requireAuth`, but they **do not verify document ownership**.
  * `/api/documents/analyze` does not associate the document with the verified UID in a durable database.
  * `/api/documents/rag-chat` accepts the entire document text in the HTTP request body without checking if the requesting user owns or has rights to the document. Any user could query any document text arbitrarily.

### 7. Whether document data is still stored in localStorage
* **File Paths:** `src/App.tsx` (lines 28–36, lines 113–115)
* **Current Status & Weakness:**
  * **YES. Critical Privacy Weakness.**
  * `src/App.tsx` actively synchronizes the entire `documents` array (including complete verbatim contract text, analysis, obligations, and party names) to browser `localStorage` under `legallens_documents`.
  * This exposes highly sensitive legal contracts (e.g., salaries, NDA trade secrets, lease provisions) to any script running in the browser and across shared workstations.

### 8. Whether rawText is sent from the browser
* **File Paths:**
  * Upload: `src/components/DocumentUploadModal.tsx` (lines 95–100)
  * Chat: `src/components/DocumentGroundedChat.tsx` (lines 96–102)
  * Server: `server.ts` (lines 157, 315)
* **Current Status & Weakness:**
  * **YES.** Both document upload and every single chat question transmit the entire raw legal document text from the client to the server over the wire.
  * For a 50-page legal agreement (~200 KB), a 10-message chat session re-transmits 2 MB of redundant unencrypted payload data over the wire, causing extreme network inefficiency, latency spikes, and payload exposure.

### 9. How RAG currently works
* **File Paths:** `server.ts` (lines 54–80, `retrieveRelevantChunks`)
* **Current Status & Weakness:**
  * RAG is implemented via naive paragraph splitting (`text.split(/\n\s*\n+/)`) followed by basic substring keyword matching (`lowerPara.includes(term)`) with a regex multiplier for legal terms like "shall" or "section".
  * It has no understanding of legal semantics, synonyms, multi-clause dependencies, cross-references, or vector similarity.

### 10. Whether a real semantic/vector retrieval system exists
* **File Paths:** Entire repository
* **Current Status & Weakness:**
  * **NO.** There are no vector embeddings, no vector search store, and no managed semantic retrieval integration (e.g. Gemini File Search / Semantic Store).

### 11. Whether Gemini API secrets can reach the browser
* **File Paths:** `server.ts` (lines 20, 83–90), `.env.example`
* **Current Status & Weakness:**
  * `GEMINI_API_KEY` is loaded in `server.ts` and is not exposed as a `VITE_` client variable.
  * However, `GET /api/health` currently leaks metadata: `{ hasApiKey: Boolean(process.env.GEMINI_API_KEY) }`, violating the requirement that health endpoints must never disclose secret presence or configuration state.

### 12. How Cloud Run receives its port
* **File Paths:** `server.ts` (line 15)
* **Current Status & Weakness:**
  * `server.ts` hardcodes: `const PORT = 3000;`.
  * While port 3000 works in container previews, Cloud Run dynamically injects `process.env.PORT` (often 8080 or an ephemeral port). Hardcoding 3000 breaks container boot in standard Cloud Run environments. It must be `Number(process.env.PORT || 3000)`.

### 13. Whether rate limiting exists
* **File Paths:** `server.ts`
* **Current Status & Weakness:**
  * **NO rate limiting exists.**
  * Malicious users or runaway loops can issue thousands of expensive Gemini analysis calls or chat queries, incurring massive API billing costs or denial-of-service.

### 14. Whether request validation exists
* **File Paths:** `server.ts` (lines 159, 317)
* **Current Status & Weakness:**
  * Minimal and insufficient. Only checks `rawText.trim().length < 20` and `typeof query !== 'string'`.
  * There are no limits on title length, metadata length, query length (e.g., buffer overflow or denial-of-service via massive strings), or schema validation for AI outputs.
  * Express `json({ limit: '25mb' })` accepts dangerously large payloads without schema bounds.

---

## 3. Plan of Execution

The roadmap to resolve every weakness identified above is broken down into sequential phases:
1. **Phase 1:** Real Firebase Authentication with `firebase-admin` and strict ID token verification.
2. **Phase 2:** True Firestore Ownership Model with structured subcollections (`users/{uid}/documents/{documentId}/...`).
3. **Phase 3:** Production-Grade `firestore.rules` with cross-user boundary tests.
4. **Phase 4:** Private Firebase Storage upload path with security rules and metadata validation.
5. **Phase 5:** Complete eradication of `localStorage` document persistence; real-time Firestore listeners.
6. **Phase 6:** Direct-to-Storage upload architecture; backend receives `documentId` and loads privately.
7. **Phase 7 & 8:** Managed Gemini Semantic RAG layer scoped by authenticated user UID; chat payload minimization.
8. **Phase 9:** Comprehensive cascading deletion across Storage, Firestore subcollections, and RAG index.
9. **Phase 10–16:** Secret shielding, Cloud Run port resilience, per-user rate limiting, safe error sanitization, strict AI schema validation, and deterministic attention engine.
10. **Phase 17–19:** Performance measurements report, security integration test suite, and final verification report.
