export type DocumentCategory = 
  | 'rental' 
  | 'employment' 
  | 'nda' 
  | 'service' 
  | 'insurance' 
  | 'loan' 
  | 'notice' 
  | 'other';

export interface Party {
  name: string;
  role: string; // e.g. "Landlord / Lessor", "Tenant / Lessee", "Employer", "Employee"
}

export interface ExtractedSection {
  id: string;
  sectionNumber: string;
  title: string;
  page?: number | string;
  verbatimQuote: string;
  plainEnglish: string;
  category: 'obligation' | 'termination' | 'financial' | 'liability' | 'ip' | 'dispute' | 'general';
}

export interface Obligation {
  id: string;
  party: 'user' | 'counterparty' | 'mutual';
  partyName: string;
  title: string;
  description: string;
  severity: 'critical' | 'moderate' | 'standard';
  frequency: 'one-time' | 'recurring' | 'conditional';
  sourceSection: string;
  sourceQuote: string;
  completed?: boolean;
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: string; // Date string or relative formula e.g. "2026-11-01" or "60 days prior to expiry"
  isRelative: boolean;
  relativeTrigger?: string;
  actionRequired: string;
  consequenceIfMissed: string;
  urgency: 'urgent' | 'upcoming' | 'distant';
  sourceSection: string;
  sourceQuote: string;
  completed: boolean;
}

export interface FinancialCommitment {
  id: string;
  type: 'payment' | 'deposit' | 'fee' | 'penalty' | 'escalation';
  amount: string;
  schedule: string;
  description: string;
  sourceSection: string;
  sourceQuote: string;
}

export interface AttentionItem {
  id: string;
  category: 'unusual_term' | 'unilateral_right' | 'harsh_penalty' | 'hidden_commitment' | 'ambiguity' | 'renewal_trap';
  priority: 'high' | 'medium' | 'low';
  headline: string;
  whyAttention: string;
  verbatimQuote: string;
  sourceSection: string;
  pageNumber?: string | number;
  suggestedQuestions: string[];
  status: 'unreviewed' | 'reviewed' | 'discuss_with_counsel';
}

export interface Inconsistency {
  id: string;
  title: string;
  description: string;
  conflictingSections: {
    section: string;
    quote: string;
  }[];
  notesForDiscussion: string;
}

export interface DocumentMetadata {
  parties: Party[];
  effectiveDate?: string;
  expirationDate?: string;
  governingLaw?: string;
  jurisdiction?: string;
  termLength?: string;
  summary: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  lastAnalyzed: string;
  rawText: string;
  metadata: DocumentMetadata;
  extractedSections: ExtractedSection[];
  obligations: Obligation[];
  deadlines: Deadline[];
  financialCommitments: FinancialCommitment[];
  attentionItems: AttentionItem[];
  inconsistencies: Inconsistency[];
  status: 'ready' | 'analyzing' | 'error';
  errorMessage?: string;
}

export interface Citation {
  section: string;
  page?: string | number;
  quote: string;
  relevance: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  citations?: Citation[];
  disclaimer?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'uploaded' | 'analyzed' | 'status_changed' | 'obligation_toggled' | 'rag_query' | 'deleted' | 'exported';
  documentId: string;
  documentTitle?: string;
  details: string;
}

export type AuditEvent = AuditLogEntry;

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  roleDescription?: string;
  anonymousMode?: boolean;
  preferences?: {
    alertOnHarshPenalties?: boolean;
    alertOnRenewalTraps?: boolean;
    remindDaysBeforeDeadlines?: number;
  };
}
