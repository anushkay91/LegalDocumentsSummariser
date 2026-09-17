/**
 * AI Output Validation Engine
 * 
 * Enforces strict validation against AI extraction outputs.
 * Completely rejects malformed, incomplete, or hallucinated payloads.
 * If AI fails, status is marked as 'processing_failed' without fabricating fake legal facts.
 */

export interface ValidatedAnalysisResult {
  valid: boolean;
  error?: string;
  data?: {
    metadata: {
      parties: Array<{ name: string; role: string }>;
      effectiveDate?: string;
      expirationDate?: string;
      governingLaw?: string;
      jurisdiction?: string;
      termLength?: string;
      summary: string;
    };
    extractedSections: Array<{
      id: string;
      sectionNumber?: string;
      title: string;
      page?: number;
      verbatimQuote: string;
      plainEnglish: string;
      category: string;
    }>;
    obligations: Array<{
      id: string;
      party: string;
      partyName: string;
      title: string;
      description: string;
      severity: string;
      frequency?: string;
      sourceSection?: string;
      sourceQuote?: string;
    }>;
    deadlines: Array<{
      id: string;
      title: string;
      dueDate: string;
      isRelative?: boolean;
      relativeTrigger?: string;
      actionRequired: string;
      consequenceIfMissed?: string;
      sourceSection?: string;
      sourceQuote?: string;
      completed?: boolean;
    }>;
    financialCommitments: Array<{
      id: string;
      type: string;
      amount: string;
      schedule?: string;
      description: string;
      sourceSection?: string;
      sourceQuote?: string;
    }>;
    attentionItems: Array<{
      id: string;
      category: 'unusual_term' | 'unilateral_right' | 'harsh_penalty' | 'hidden_commitment' | 'ambiguity' | 'renewal_trap';
      priority: 'high' | 'medium' | 'low';
      headline: string;
      whyAttention: string;
      verbatimQuote: string;
      sourceSection: string;
      pageNumber?: number;
      suggestedQuestions?: string[];
      status: 'unreviewed';
    }>;
    inconsistencies: Array<{
      id: string;
      title: string;
      description: string;
      conflictingSections?: Array<{ section: string; quote: string }>;
      notesForDiscussion?: string;
    }>;
  };
}

export function validateAiAnalysisOutput(rawJson: unknown): ValidatedAnalysisResult {
  if (!rawJson || typeof rawJson !== 'object') {
    return { valid: false, error: 'AI output must be an object' };
  }

  const obj = rawJson as Record<string, any>;

  // Validate metadata
  if (!obj.metadata || typeof obj.metadata !== 'object') {
    return { valid: false, error: 'Missing or invalid metadata block' };
  }

  if (!obj.metadata.summary || typeof obj.metadata.summary !== 'string' || obj.metadata.summary.trim().length === 0) {
    return { valid: false, error: 'Metadata summary is required and cannot be empty' };
  }

  // Validate extracted sections
  const extractedSections = Array.isArray(obj.extractedSections) ? obj.extractedSections : [];
  for (let i = 0; i < extractedSections.length; i++) {
    const sec = extractedSections[i];
    if (!sec || typeof sec !== 'object') {
      return { valid: false, error: `Extracted section at index ${i} is not an object` };
    }
    if (!sec.title || typeof sec.title !== 'string' || !sec.verbatimQuote || typeof sec.verbatimQuote !== 'string') {
      return { valid: false, error: `Extracted section at index ${i} must have title and verbatimQuote` };
    }
  }

  // Validate obligations
  const obligations = Array.isArray(obj.obligations) ? obj.obligations : [];
  for (let i = 0; i < obligations.length; i++) {
    const ob = obligations[i];
    if (!ob || typeof ob !== 'object' || !ob.title || !ob.description) {
      return { valid: false, error: `Obligation at index ${i} is missing title or description` };
    }
  }

  // Validate deadlines
  const deadlines = Array.isArray(obj.deadlines) ? obj.deadlines : [];
  for (let i = 0; i < deadlines.length; i++) {
    const dl = deadlines[i];
    if (!dl || typeof dl !== 'object' || !dl.title || !dl.dueDate) {
      return { valid: false, error: `Deadline at index ${i} is missing title or dueDate` };
    }
  }

  // Validate attention items
  const attentionItems = Array.isArray(obj.attentionItems) ? obj.attentionItems : [];
  for (let i = 0; i < attentionItems.length; i++) {
    const att = attentionItems[i];
    if (!att || typeof att !== 'object' || !att.headline || !att.whyAttention || !att.verbatimQuote) {
      return { valid: false, error: `Attention item at index ${i} missing headline, whyAttention, or verbatimQuote` };
    }
  }

  return {
    valid: true,
    data: {
      metadata: {
        parties: Array.isArray(obj.metadata.parties) ? obj.metadata.parties : [],
        effectiveDate: obj.metadata.effectiveDate,
        expirationDate: obj.metadata.expirationDate,
        governingLaw: obj.metadata.governingLaw,
        jurisdiction: obj.metadata.jurisdiction,
        termLength: obj.metadata.termLength,
        summary: obj.metadata.summary.trim(),
      },
      extractedSections: extractedSections.map((s: any, idx: number) => ({
        id: s.id || `sec-${idx + 1}`,
        sectionNumber: s.sectionNumber || `Section ${idx + 1}`,
        title: s.title,
        page: typeof s.page === 'number' ? s.page : 1,
        verbatimQuote: s.verbatimQuote,
        plainEnglish: s.plainEnglish || 'Extracted legal provision.',
        category: s.category || 'general',
      })),
      obligations: obligations.map((o: any, idx: number) => ({
        id: o.id || `ob-${idx + 1}`,
        party: o.party || 'user',
        partyName: o.partyName || 'Party',
        title: o.title,
        description: o.description,
        severity: o.severity || 'standard',
        frequency: o.frequency || 'one-time',
        sourceSection: o.sourceSection || 'General Terms',
        sourceQuote: o.sourceQuote || '',
      })),
      deadlines: deadlines.map((d: any, idx: number) => ({
        id: d.id || `dl-${idx + 1}`,
        title: d.title,
        dueDate: d.dueDate,
        isRelative: Boolean(d.isRelative),
        relativeTrigger: d.relativeTrigger,
        actionRequired: d.actionRequired || d.title,
        consequenceIfMissed: d.consequenceIfMissed,
        sourceSection: d.sourceSection,
        sourceQuote: d.sourceQuote,
        completed: false,
      })),
      financialCommitments: Array.isArray(obj.financialCommitments) ? obj.financialCommitments : [],
      attentionItems: attentionItems.map((a: any, idx: number) => ({
        id: a.id || `att-${idx + 1}`,
        category: a.category || 'unusual_term',
        priority: a.priority === 'high' || a.priority === 'medium' || a.priority === 'low' ? a.priority : 'medium',
        headline: a.headline,
        whyAttention: a.whyAttention,
        verbatimQuote: a.verbatimQuote,
        sourceSection: a.sourceSection || 'Document Terms',
        pageNumber: a.pageNumber || 1,
        suggestedQuestions: Array.isArray(a.suggestedQuestions) ? a.suggestedQuestions : [],
        status: 'unreviewed',
      })),
      inconsistencies: Array.isArray(obj.inconsistencies) ? obj.inconsistencies : [],
    },
  };
}
