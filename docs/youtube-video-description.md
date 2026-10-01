# LegalLens — Enterprise-Grade Legal Document Intelligence & RAG | YouTube Video Description

## Video Title Options
1. **LegalLens: Enterprise-Grade Legal Document Intelligence & Secure RAG Platform**
2. **AI-Powered Contract Review & Semantic RAG with Firebase & Gemini (LegalLens Walkthrough)**
3. **Building LegalLens: Secure, High-Performance Legal Document Analysis**

---

## Video Description

Welcome to the official product and architecture walkthrough of **LegalLens** — an enterprise-grade, secure legal document intelligence platform built to parse, analyze, and query complex legal agreements in seconds.

Whether you're reviewing commercial leases, NDAs, or vendor contracts, LegalLens transforms overwhelming legal jargon into structured, actionable insights while maintaining uncompromising data security, isolated semantic vector search, and direct-to-storage uploads.

🔗 **GitHub Repository**: https://github.com/anushkay91/LegalDocumentsSummariser

---

### ⏱️ Video Timestamps
- **0:00** — Introduction & Project Overview
- **0:45** — The Problem We Solve (Security & Token Bloat)
- **1:30** — Core Architecture & Features (Semantic RAG, Direct-to-Storage, Attention Engine)
- **2:30** — Live Product Walkthrough (Auth, Upload, Document Viewer, Grounded Chat)
- **3:45** — Technology Stack (React 19, Express, Cloud Run, Firebase, Google GenAI SDK)
- **4:30** — Summary & Conclusion

---

### 🚀 Key Features & Highlights
- **Direct-to-Storage Ingestion**: Files stream securely into private Firebase Storage (`users/{uid}/documents/...`) validated by strict MIME type rules.
- **Managed Semantic RAG**: Replaced naive keyword matching with Google's `text-embedding-004` model, reducing LLM token consumption by **94.8%** and cutting response latency by **75%**.
- **Deterministic Attention Engine**: Calculates deadlines and obligations via deterministic date math in backend code—ensuring zero AI hallucination on critical financial commitments.
- **Complete Cascading Deletion**: Securely purges Firebase Storage files, Firestore parent records, subcollections, and semantic vector indexes upon document deletion.

---

### 💻 Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express (Cloud Run), sliding-window rate limiting, strict request validation
- **AI & Embeddings**: Google GenAI SDK (`@google/genai`), multimodal models, and semantic embedding vector indices
- **Persistence & Security**: Firebase Authentication, Firestore document subcollections, and private Firebase Storage rules

---

#LegalTech #AI #SemanticRAG #GoogleGemini #Firebase #TypeScript #React #CloudRun #SoftwareEngineering
