import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { requireAuth } from './server/middleware/auth';
import { documentProcessLimiter, chatLimiter } from './server/middleware/rateLimiter';
import { validateProcessDocumentRequest, validateChatRequest } from './server/middleware/validation';
import { validateAiAnalysisOutput } from './server/services/aiValidation';
import { indexDocument, retrieveSemanticChunks } from './server/rag/semanticStore';
import { 
  savePrivateFile, 
  getPrivateFile, 
  verifyDocumentOwnership, 
  saveDocumentAndSubcollections, 
  deleteDocumentCascade, 
  getDocumentById 
} from './server/services/documentService';
import { 
  generateContentWithResilience, 
  generateGroundedExcerptFallback 
} from './server/geminiResilience';

dotenv.config();

const app = express();
// Phase 11: Cloud Run dynamic port binding with 3000 fallback, listening on 0.0.0.0
const PORT = Number(process.env.PORT || 3000);

// Phase 12: Safe body size limit (reduced from 25mb to 1mb)
app.use(express.json({ limit: '1mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && apiKey) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const LEGAL_SYSTEM_GUARDRAIL = `
You are the intelligence engine for "LegalLens", an AI-assisted document understanding and review-attention application.

CRITICAL OPERATIONAL & ETHICAL BOUNDARIES:
1. You are an INFORMATION AND DOCUMENT-UNDERSTANDING product, NOT an attorney, law firm, or legal decision-making system.
2. You must NEVER claim that a clause is legally valid/invalid, guarantee an outcome, or tell the user whether they should sign, sue, terminate, settle, or take a specific legal action.
3. Always frame outputs using neutral, observational language such as:
   - "This item may deserve your attention."
   - "This clause contains an obligation."
   - "This deadline was identified from your document."
   - "This information may be useful to discuss with a qualified legal professional."
   - "I found this information in Section X, page Y."
4. Every extracted item, obligation, deadline, and attention warning MUST cite the exact verbatim text and section number from the provided document. NEVER invent or hallucinate clauses not present in the text.
5. Identify areas where standard protective practices, asymmetries, or cross-clause contradictions might warrant a conversation with a qualified attorney.
`;

// Phase 11: Public Health Check (Must NOT disclose API key existence)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'LegalLens Document Intelligence API',
    timestamp: new Date().toISOString(),
  });
});

// Authenticated User Identity Endpoint
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    status: 'authenticated',
    user: req.user,
  });
});

/**
 * Phase 6: DIRECT-TO-STORAGE DOCUMENT PROCESSING ENDPOINT
 * Receives: { documentId, title, category, fileName, fileSize, mimeType, fileContent }
 * The backend verifies Firebase ID token, verifies document ownership, retrieves the private file,
 * processes it with Gemini, indexes semantic chunks, and stores structured results in Firestore subcollections.
 */
app.post(
  '/api/documents/process',
  requireAuth,
  documentProcessLimiter,
  validateProcessDocumentRequest,
  async (req: Request, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { documentId, title, category, fileName, fileSize, mimeType, fileContent } = req.body;

      // If client provides file content directly during upload, store it into private storage first
      if (fileContent && typeof fileContent === 'string') {
        await savePrivateFile(uid, documentId, fileContent, mimeType || 'text/plain');
      }

      // Retrieve from private storage
      const documentRawText = await getPrivateFile(uid, documentId);
      if (!documentRawText || documentRawText.trim().length < 20) {
        return res.status(400).json({ error: 'Document text is missing or unreadable from private storage.' });
      }

      const docTitle = (title && typeof title === 'string') ? title.trim() : 'Legal Document';
      const docCategory = (category && typeof category === 'string') ? category.trim() : 'General Agreement';

      const ai = getAiClient();
      let analysisData: any = null;

      if (ai) {
        const extractionPrompt = `
Analyze the following legal document with extreme precision.
Document Title: ${docTitle}
Document Category: ${docCategory}

FULL DOCUMENT TEXT:
"""
${documentRawText.slice(0, 30000)}
"""

Extract structured legal document intelligence in JSON matching this schema:
{
  "metadata": {
    "parties": [{"name": "string", "role": "string"}],
    "effectiveDate": "YYYY-MM-DD or string",
    "expirationDate": "YYYY-MM-DD or string",
    "governingLaw": "string",
    "jurisdiction": "string",
    "termLength": "string",
    "summary": "2-3 concise sentences summarizing purpose and scope"
  },
  "extractedSections": [
    {
      "id": "sec-1",
      "sectionNumber": "e.g. 1.2 or Section 3",
      "title": "Clear descriptive title",
      "page": 1,
      "verbatimQuote": "Exact short quote from document",
      "plainEnglish": "Simple plain-English explanation of what this means for the user",
      "category": "obligation|termination|financial|liability|ip|dispute|general"
    }
  ],
  "obligations": [
    {
      "id": "ob-1",
      "party": "user|counterparty|mutual",
      "partyName": "Party Name",
      "title": "Short title of obligation",
      "description": "What must be done, when, and under what condition",
      "severity": "critical|moderate|standard",
      "frequency": "one-time|recurring|conditional",
      "sourceSection": "Section X.Y",
      "sourceQuote": "Exact verbatim text"
    }
  ],
  "deadlines": [
    {
      "id": "dl-1",
      "title": "Title of deadline",
      "dueDate": "YYYY-MM-DD or relative formula",
      "isRelative": false,
      "relativeTrigger": "Trigger event if relative",
      "actionRequired": "Specific action required",
      "consequenceIfMissed": "Consequence if deadline is missed",
      "urgency": "urgent|upcoming|distant",
      "sourceSection": "Section X.Y",
      "sourceQuote": "Exact verbatim quote"
    }
  ],
  "financialCommitments": [
    {
      "id": "fin-1",
      "type": "payment|deposit|fee|penalty|escalation",
      "amount": "$0.00",
      "schedule": "Schedule",
      "description": "Description",
      "sourceSection": "Section X.Y",
      "sourceQuote": "Exact quote"
    }
  ],
  "attentionItems": [
    {
      "id": "att-1",
      "category": "unusual_term|unilateral_right|harsh_penalty|hidden_commitment|ambiguity|renewal_trap",
      "priority": "high|medium|low",
      "headline": "Clear headline",
      "whyAttention": "Objective, neutral explanation",
      "verbatimQuote": "Verbatim quote",
      "sourceSection": "Section X.Y",
      "pageNumber": 1,
      "suggestedQuestions": ["Question to ask"]
    }
  ],
  "inconsistencies": []
}
Return ONLY valid JSON. Ensure all quotes are 100% faithful to the text.`;

        try {
          const { text } = await generateContentWithResilience(
            ai,
            extractionPrompt,
            {
              systemInstruction: LEGAL_SYSTEM_GUARDRAIL,
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
            'gemini-3.8-flash'
          );

          let parsedJson;
          try {
            parsedJson = JSON.parse(text);
          } catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) parsedJson = JSON.parse(match[0]);
          }

          // Phase 15: Strict schema validation
          const validation = validateAiAnalysisOutput(parsedJson);
          if (validation.valid && validation.data) {
            analysisData = validation.data;
          } else {
            console.warn('[Validation] AI output failed strict schema validation:', validation.error);
          }
        } catch (genErr) {
          console.error('[Document Processing] Gemini generation error:', (genErr as Error)?.message);
        }
      }

      // Phase 15: If AI fails or returns invalid schema, mark processing_failed without fake fallback legal facts!
      const status = analysisData ? 'ready' : 'processing_failed';

      const finalDocument = {
        id: documentId,
        userId: uid,
        title: docTitle,
        category: docCategory,
        fileName: fileName || `${docTitle.toLowerCase().replace(/\s+/g, '_')}.txt`,
        fileSize: typeof fileSize === 'number' ? fileSize : documentRawText.length,
        storagePath: `users/${uid}/documents/${documentId}/original`,
        uploadDate: new Date().toISOString(),
        lastAnalyzed: new Date().toISOString(),
        rawText: documentRawText,
        status: status as 'ready' | 'processing' | 'processing_failed',
        metadata: analysisData?.metadata || {
          parties: [],
          summary: 'Document uploaded. Automated clause extraction could not be completed.',
        },
        extractedSections: analysisData?.extractedSections || [],
        obligations: analysisData?.obligations || [],
        deadlines: analysisData?.deadlines || [],
        financialCommitments: analysisData?.financialCommitments || [],
        attentionItems: analysisData?.attentionItems || [],
        inconsistencies: analysisData?.inconsistencies || [],
      };

      // Phase 2: Save to Firestore under users/{uid}/documents/{documentId} and subcollections
      await saveDocumentAndSubcollections(uid, finalDocument);

      // Phase 7: Index semantic chunks in managed user-isolated Semantic RAG layer
      await indexDocument(ai, uid, documentId, docTitle, documentRawText);

      res.json({
        success: true,
        documentId,
        status: finalDocument.status,
        document: finalDocument,
      });
    } catch (err: unknown) {
      // Phase 14: Safe public error message
      console.error('[Document Processing Exception]:', err instanceof Error ? err.message : 'Unknown error');
      res.status(500).json({ error: 'Internal server error while processing document.' });
    }
  }
);

// Backward compatibility endpoint for /api/documents/analyze (delegates to process)
app.post(
  '/api/documents/analyze',
  requireAuth,
  documentProcessLimiter,
  async (req: Request, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { title, category, rawText } = req.body;
      const documentId = `doc-${Date.now()}`;

      if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 20) {
        return res.status(400).json({ error: 'Please provide valid document text to analyze.' });
      }

      await savePrivateFile(uid, documentId, rawText, 'text/plain');

      // Forward to process logic
      req.body.documentId = documentId;
      req.body.fileContent = rawText;
      return (app._router.handle as any)(req, res, () => {});
    } catch (err: unknown) {
      res.status(500).json({ error: 'Internal server error while analyzing document.' });
    }
  }
);

/**
 * Phase 8: MINIMIZED DOCUMENT-GROUNDED RAG CHAT ENDPOINT
 * Request pattern: { documentId, query, sessionId }
 * Browser NEVER sends raw documentText!
 * 1. Verify user (requireAuth)
 * 2. Verify document ownership (server-side check)
 * 3. Semantic RAG retrieval (retrieveSemanticChunks)
 * 4. Gemini completion with citations
 */
app.post(
  '/api/documents/rag-chat',
  requireAuth,
  chatLimiter,
  validateChatRequest,
  async (req: Request, res: Response) => {
    try {
      const uid = req.user!.uid;
      const { documentId, query, sessionId } = req.body;

      // Phase 2: Server-side authorization check (user must own this document)
      const isOwner = await verifyDocumentOwnership(uid, documentId);
      if (!isOwner) {
        // Strict boundary: User A cannot query User B's document
        return res.status(403).json({ error: 'Forbidden: You do not have permission to access this document.' });
      }

      const doc = await getDocumentById(uid, documentId);
      const docTitle = doc?.title || 'Legal Document';
      const docCategory = doc?.category || 'Agreement';

      const ai = getAiClient();
      if (!ai) {
        return res.json({
          answer: "I am ready to assist you in understanding this document. To enable AI-grounded retrieval and deep comprehension, please configure your GEMINI_API_KEY in the AI Studio Secrets panel. You can also view all extracted clauses, deadlines, and attention items in the Document Intelligence panels.",
          citations: [],
          disclaimer: "LegalLens is an information and document-understanding assistant, not a lawyer or legal advisor. Please discuss any legal questions with a qualified professional.",
        });
      }

      // Phase 7: Retrieve relevant chunks using isolated semantic vector retrieval
      const searchResults = await retrieveSemanticChunks(ai, uid, documentId, query, 5);
      const excerpts = searchResults.map(r => r.chunk.text);

      if (excerpts.length === 0) {
        // Fallback: If document was not yet indexed in semantic store, try indexing on-demand
        const rawContent = await getPrivateFile(uid, documentId);
        if (rawContent) {
          await indexDocument(ai, uid, documentId, docTitle, rawContent);
          const retried = await retrieveSemanticChunks(ai, uid, documentId, query, 5);
          excerpts.push(...retried.map(r => r.chunk.text));
        }
      }

      const contextBlock = excerpts
        .map((c, i) => `[EXCERPT ${i + 1}]:\n${c}`)
        .join('\n\n');

      const chatPrompt = `
The user is asking a question about their legal document: "${docTitle}" (${docCategory}).

DOCUMENT EXCERPTS RETRIEVED VIA GROUNDED SEMANTIC RAG:
"""
${contextBlock}
"""

USER'S QUESTION:
"${query}"

INSTRUCTIONS:
1. Answer the user's question clearly, objectively, and thoroughly based strictly on the retrieved document excerpts.
2. If the document does not contain the answer, state clearly: "I did not find information regarding this question in the provided document excerpts."
3. Every factual claim must be backed by a specific Section or Page reference from the excerpts.
4. Extract 1 to 3 explicit verbatim citations formatted as:
   - Section: e.g. "Section 1.3"
   - Page: page number if evident, or "N/A"
   - Quote: verbatim quote from excerpt
   - Relevance: one-sentence explanation of why this supports your answer.
5. Tone: "This clause indicates that...", "According to Section X...", "This information may be useful to discuss with a qualified legal professional."
6. NEVER give legal advice, tell the user whether to sign/sue, or make unsupported legal conclusions.

Format your response in JSON:
{
  "answer": "Your detailed, grounded markdown answer with Section references.",
  "citations": [
    {
      "section": "Section X.Y",
      "page": "1",
      "quote": "Exact verbatim quote from excerpt",
      "relevance": "How this relates to user's question"
    }
  ],
  "disclaimer": "LegalLens provides information and document comprehension assistance only and does not provide legal advice or legal representation. For specific legal guidance, consult a qualified attorney in your jurisdiction."
}
`;

      let text = '{}';
      try {
        const { text: generatedText } = await generateContentWithResilience(
          ai,
          chatPrompt,
          {
            systemInstruction: LEGAL_SYSTEM_GUARDRAIL,
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
          'gemini-3.8-flash'
        );
        text = generatedText;
      } catch (modelErr) {
        console.warn('Gemini chat unavailable; generating grounded excerpt fallback:', (modelErr as Error)?.message);
        const groundedFallback = generateGroundedExcerptFallback(query, docTitle, excerpts);
        return res.json(groundedFallback);
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          result = JSON.parse(match[0]);
        } else {
          result = generateGroundedExcerptFallback(query, docTitle, excerpts);
        }
      }

      res.json(result);
    } catch (err: unknown) {
      // Phase 14: Safe public error message
      console.error('[Chat Exception]:', err instanceof Error ? err.message : 'Unknown error');
      res.status(500).json({ error: 'Internal server error while processing chat query.' });
    }
  }
);

/**
 * Phase 9: COMPLETE CASCADING DELETION ENDPOINT
 * Deletes:
 * 1. Firebase Storage file
 * 2. Firestore document
 * 3. Extracted sections subcollection
 * 4. Obligations subcollection
 * 5. Deadlines subcollection
 * 6. Attention items subcollection
 * 7. Gemini Semantic RAG index chunks
 */
app.delete('/api/documents/:documentId', requireAuth, async (req: Request, res: Response) => {
  try {
    const uid = req.user!.uid;
    const { documentId } = req.params;

    if (!documentId || !/^[a-zA-Z0-9_\-]+$/.test(documentId)) {
      return res.status(400).json({ error: 'Invalid documentId format.' });
    }

    // Verify ownership before deleting
    const isOwner = await verifyDocumentOwnership(uid, documentId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Forbidden: You do not own this document.' });
    }

    await deleteDocumentCascade(uid, documentId);

    res.json({
      success: true,
      message: `Document ${documentId} and all associated provisions, storage files, and index entries permanently deleted.`,
    });
  } catch (err: unknown) {
    console.error('[Deletion Exception]:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Internal server error while deleting document.' });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LegalLens Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
