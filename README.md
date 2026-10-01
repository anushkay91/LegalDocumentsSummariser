# LegalLens — Enterprise-Grade Legal Document Intelligence & Secure RAG Platform

[![Security Audit](https://img.shields.io/badge/Security-Hardened-success?style=flat-square)](docs/security-efficiency-audit.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-orange?style=flat-square)](https://firebase.google.com/)
[![Google Gemini API](https://img.shields.io/badge/Google%20Gemini-SDK%20%40google%2Fgenai-purple?style=flat-square)](https://ai.google.dev/)

**LegalLens** is an enterprise-grade, zero-trust legal document intelligence and Retrieval-Augmented Generation (RAG) platform. It is engineered to parse, analyze, and query complex legal contracts (leases, NDAs, vendor agreements) with uncompromising data security, isolated semantic vector search, direct-to-storage uploads, and deterministic attention scoring.

---

## 🏛️ Architecture & Security Hardening Overview

LegalLens underwent a rigorous **Security & Efficiency Hardening Pass** to transition from a prototype to a production-grade secure application:

1. **Cryptographic Authentication**: Real Firebase Authentication on the frontend with backend Bearer token verification (`requireAuth` middleware).
2. **User-Isolated Firestore Ownership**: Strict data hierarchy under `users/{uid}/documents/{documentId}/...` enforced by robust `firestore.rules`.
3. **Private Firebase Storage**: Direct-to-storage uploads bypassing the application server for raw multi-megabyte files, validated by MIME type, file size, and extension rules.
4. **Managed Semantic RAG**: Replaced naive keyword matching with Google's `text-embedding-004` semantic vector search, reducing token consumption by **94.8%** and chat latency by **75%**.
5. **Deterministic Attention Engine**: Backend date math and obligation urgency scoring—ensuring zero AI hallucinations on critical financial commitments or deadlines.
6. **Complete Cascading Deletion**: Atomic deletion purging Firebase Storage files, Firestore parent/subcollection records, and semantic vector indexes simultaneously.

---

## 🚀 Key Features

- **Secure Document Ingestion**: Drag-and-drop file upload streaming directly to private Firebase Storage with server-side ownership verification.
- **AI-Powered Extraction**: Automatic parsing of parties, effective dates, governing laws, financial obligations, and clause summaries.
- **Grounded Semantic Chat**: Ask questions about your contracts and receive precise answers with verbatim clause citations without exposing raw document text in chat prompts.
- **Attention Score & Deadline Tracking**: Deterministic calculation of urgent deadlines and obligations.
- **Real-Time Dashboard**: Live Firestore listeners providing instant status updates across document processing states.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide icons.
- **Backend**: Node.js, Express running on Cloud Run with sliding-window rate limiting and strict request payload validation.
- **AI & Embeddings**: Google GenAI SDK (`@google/genai`) using multimodal models and semantic embedding vector indices.
- **Database & Auth**: Firebase Authentication, Cloud Firestore, and private Firebase Storage.
- **Testing**: Vitest automated test suite covering authentication boundaries, rate limits, schema validation, and security rules.

---

## 📋 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun
- Firebase project with Authentication, Firestore, and Storage enabled.

### Installation & Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/anushkay91/LegalDocumentsSummariser.git
   cd LegalDocumentsSummariser
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Copy `.env.example` to `.env` and configure your Firebase and Gemini API keys (server-side only).

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Run test suite**:
   ```bash
   npm test
   ```

---

## 📚 Documentation & Reports

- [Security & Efficiency Audit](docs/security-efficiency-audit.md)
- [Performance Report](docs/performance-report.md)
- [Comprehensive Security & Efficiency Report](docs/security-efficiency-report.md)
- [Video Transcript](docs/video-transcript-5min.md)
- [YouTube Video Description](docs/youtube-video-description.md)

---

## 📄 License

This project is licensed under the MIT License.
