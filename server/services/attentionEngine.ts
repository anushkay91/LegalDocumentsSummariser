/**
 * Attention Engine
 * 
 * Application-level deterministic calculation engine.
 * Calculates deadline urgencies, day differences, and attention scores purely in code.
 * (Never relies on LLMs for date arithmetic or subjective legal risk scoring).
 */

export interface DeterministicDeadline {
  id: string;
  title: string;
  dueDate: string; // ISO or relative
  isRelative?: boolean;
  relativeTrigger?: string;
  actionRequired: string;
  consequenceIfMissed?: string;
  urgency: 'urgent' | 'upcoming' | 'distant';
  daysRemaining: number | null;
  completed: boolean;
  sourceSection?: string;
  sourceQuote?: string;
}

export interface DeterministicAttentionItem {
  id: string;
  category: 'unusual_term' | 'unilateral_right' | 'harsh_penalty' | 'hidden_commitment' | 'ambiguity' | 'renewal_trap';
  priority: 'high' | 'medium' | 'low';
  headline: string;
  whyAttention: string;
  verbatimQuote: string;
  sourceSection: string;
  pageNumber?: number;
  suggestedQuestions?: string[];
  status: 'unreviewed' | 'reviewed' | 'addressed';
}

/**
 * Deterministically compute days remaining and urgency level from a target due date.
 */
export function calculateDeadlineUrgency(dueDateStr: string, referenceDate: Date = new Date()): {
  daysRemaining: number | null;
  urgency: 'urgent' | 'upcoming' | 'distant';
} {
  if (!dueDateStr) {
    return { daysRemaining: null, urgency: 'upcoming' };
  }

  // Parse ISO date (YYYY-MM-DD)
  const match = dueDateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    // Relative formula (e.g. "60 days before expiration")
    return { daysRemaining: null, urgency: 'upcoming' };
  }

  const targetDate = new Date(dueDateStr);
  if (isNaN(targetDate.getTime())) {
    return { daysRemaining: null, urgency: 'upcoming' };
  }

  const diffMs = targetDate.getTime() - referenceDate.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let urgency: 'urgent' | 'upcoming' | 'distant' = 'upcoming';
  if (daysRemaining <= 7) {
    urgency = 'urgent';
  } else if (daysRemaining <= 30) {
    urgency = 'upcoming';
  } else {
    urgency = 'distant';
  }

  return { daysRemaining, urgency };
}

/**
 * Calculate overall deterministic Attention Score (0 to 100) based on items requiring review.
 * This is an attention index reflecting document density and items to inspect, NOT a legal prediction or risk score.
 */
export function calculateAttentionScore(
  attentionItems: DeterministicAttentionItem[],
  deadlines: DeterministicDeadline[]
): number {
  let score = 20; // Base baseline

  for (const item of attentionItems) {
    if (item.priority === 'high') score += 18;
    else if (item.priority === 'medium') score += 10;
    else score += 5;
  }

  for (const dl of deadlines) {
    if (dl.urgency === 'urgent') score += 15;
    else if (dl.urgency === 'upcoming') score += 8;
  }

  return Math.min(100, Math.max(10, score));
}
