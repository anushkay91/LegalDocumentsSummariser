import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

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

// Helper for RAG chunking and semantic relevance scoring
function retrieveRelevantChunks(query: string, text: string, maxChunks = 5): string[] {
  // Split document into paragraphs or sections
  const rawParagraphs = text.split(/\n\s*\n+/).map(p => p.trim()).filter(p => p.length > 40);
  if (rawParagraphs.length <= maxChunks) {
    return rawParagraphs;
  }

  const queryTerms = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
  
  const scored = rawParagraphs.map(para => {
    const lowerPara = para.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (lowerPara.includes(term)) {
        score += 3;
      }
    }
    // Boost paragraphs with section headings or legal markers
    if (/(section|article|clause|\d+\.\d+|shall|must|terminate|renew|pay|deposit|damage)/i.test(para)) {
      score += 1;
    }
    return { para, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxChunks).map(s => s.para);
}

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'LegalLens Document Intelligence API',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Analyze Document Endpoint
app.post('/api/documents/analyze', async (req: Request, res: Response) => {
  try {
    const { title, category, rawText } = req.body;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide valid document text to analyze.' });
    }

    const ai = getAiClient();
    if (!ai) {
      // Return structured extraction fallback when API key is not yet configured
      return res.json({
        metadata: {
          parties: [{ name: 'Party A', role: 'Disclosing Party' }, { name: 'Party B', role: 'Receiving Party' }],
          effectiveDate: new Date().toISOString().split('T')[0],
          governingLaw: 'Jurisdiction specified in document',
          termLength: 'As specified in document',
          summary: 'Document uploaded successfully. Configure GEMINI_API_KEY in Secrets for deep AI extraction.',
        },
        extractedSections: [
          {
            id: `sec-${Date.now()}-1`,
            sectionNumber: '1.0',
            title: 'Uploaded Document Content',
            page: 1,
            verbatimQuote: rawText.slice(0, 300) + '...',
            plainEnglish: 'This section contains initial extracted text from your uploaded document.',
            category: 'general',
          }
        ],
        obligations: [
          {
            id: `ob-${Date.now()}-1`,
            party: 'user',
            partyName: 'You',
            title: 'Review Full Text and Verify Terms',
            description: 'Read the complete document and verify terms with a qualified legal professional.',
            severity: 'standard',
            frequency: 'one-time',
            sourceSection: 'General Terms',
            sourceQuote: rawText.slice(0, 150),
          }
        ],
        deadlines: [],
        financialCommitments: [],
        attentionItems: [
          {
            id: `att-${Date.now()}-1`,
            category: 'unusual_term',
            priority: 'medium',
            headline: 'Initial Document Ingestion Complete',
            whyAttention: 'This document has been ingested into your local workspace. Enable Gemini API for comprehensive clause categorization and attention analysis.',
            verbatimQuote: rawText.slice(0, 200),
            sourceSection: 'Document Preamble',
            pageNumber: 1,
            suggestedQuestions: ['What are the termination conditions?', 'Are there automatic renewal clauses?'],
            status: 'unreviewed',
          }
        ],
        inconsistencies: [],
      });
    }

    const extractionPrompt = `
Analyze the following legal document with extreme precision.
Document Title: ${title || 'Legal Document'}
Document Category: ${category || 'General Agreement'}

FULL DOCUMENT TEXT:
"""
${rawText.slice(0, 25000)}
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
      "partyName": "e.g. Alex Morgan (Tenant)",
      "title": "Short title of obligation",
      "description": "What must be done, when, and under what condition",
      "severity": "critical|moderate|standard",
      "frequency": "one-time|recurring|conditional",
      "sourceSection": "e.g. Section 2.1",
      "sourceQuote": "Exact verbatim text"
    }
  ],
  "deadlines": [
    {
      "id": "dl-1",
      "title": "Title of deadline",
      "dueDate": "YYYY-MM-DD or relative formula like '60 days before expiry'",
      "isRelative": false,
      "relativeTrigger": "Trigger event if relative",
      "actionRequired": "Specific action required",
      "consequenceIfMissed": "Consequence if deadline is missed",
      "urgency": "urgent|upcoming|distant",
      "sourceSection": "Section X.Y",
      "sourceQuote": "Exact verbatim quote",
      "completed": false
    }
  ],
  "financialCommitments": [
    {
      "id": "fin-1",
      "type": "payment|deposit|fee|penalty|escalation",
      "amount": "e.g. $3,200.00 or 5% of monthly rent",
      "schedule": "e.g. Monthly on the 1st",
      "description": "Description of the financial obligation",
      "sourceSection": "Section X.Y",
      "sourceQuote": "Exact verbatim quote"
    }
  ],
  "attentionItems": [
    {
      "id": "att-1",
      "category": "unusual_term|unilateral_right|harsh_penalty|hidden_commitment|ambiguity|renewal_trap",
      "priority": "high|medium|low",
      "headline": "Clear, informative headline (e.g. '24-Month Automatic Renewal Lock-In')",
      "whyAttention": "Objective, neutral explanation of why this item may deserve the user's attention (e.g. 'This clause contains an automatic extension...')",
      "verbatimQuote": "Verbatim quote",
      "sourceSection": "Section X.Y",
      "pageNumber": 1,
      "suggestedQuestions": [
        "Constructive question to ask the counterparty or discuss with a qualified legal professional"
      ],
      "status": "unreviewed"
    }
  ],
  "inconsistencies": [
    {
      "id": "inc-1",
      "title": "Title of inconsistency or tension between clauses",
      "description": "Description of why these provisions might conflict or cause ambiguity",
      "conflictingSections": [
        {"section": "Section A", "quote": "Quote A"},
        {"section": "Section B", "quote": "Quote B"}
      ],
      "notesForDiscussion": "Notes to discuss with a qualified legal professional"
    }
  ]
}

Ensure all extracted quotes are 100% faithful to the source text. Do not invent provisions. Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: extractionPrompt,
      config: {
        systemInstruction: LEGAL_SYSTEM_GUARDRAIL,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text || '{}';
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        data = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse extraction output into JSON');
      }
    }

    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown analysis error';
    console.error('Error analyzing document:', message);
    res.status(500).json({ error: message });
  }
});

// Document-Grounded RAG Chat Endpoint
app.post('/api/documents/rag-chat', async (req: Request, res: Response) => {
  try {
    const { query, documentTitle, documentCategory, documentText, history } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        answer: "I am ready to assist you in understanding this document. To enable AI-grounded retrieval and deep comprehension, please configure your `GEMINI_API_KEY` in the AI Studio Secrets panel. You can also view all extracted clauses, deadlines, and attention items in the Document Intelligence panels.",
        citations: [],
        disclaimer: "LegalLens is an information and document-understanding assistant, not a lawyer or legal advisor. Please discuss any legal questions with a qualified professional.",
      });
    }

    // Retrieve relevant chunks for grounded context
    const chunks = retrieveRelevantChunks(query, documentText || '', 6);
    const contextBlock = chunks.map((c, i) => `[EXCERPT ${i + 1}]:\n${c}`).join('\n\n');

    const chatPrompt = `
The user is asking a question about their legal document: "${documentTitle || 'Personal Legal Document'}" (${documentCategory || 'Agreement'}).

DOCUMENT EXCERPTS RETRIEVED VIA GROUNDED RAG:
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatPrompt,
      config: {
        systemInstruction: LEGAL_SYSTEM_GUARDRAIL,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '{}';
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        result = {
          answer: text,
          citations: [],
          disclaimer: "LegalLens is an information and document-understanding assistant, not a lawyer.",
        };
      }
    }

    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown chat error';
    console.error('Error in RAG chat:', message);
    res.status(500).json({ error: message });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
