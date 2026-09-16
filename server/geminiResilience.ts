import { GoogleGenAI } from '@google/genai';

export class GeminiCapacityExceededError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'GeminiCapacityExceededError';
  }
}

// Model hierarchy in order of preference according to gemini-api guidelines
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

function isTransientError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes('503') ||
    message.includes('high demand') ||
    message.includes('UNAVAILABLE') ||
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('Quota exceeded') ||
    message.includes('504') ||
    message.includes('Gateway Timeout') ||
    message.includes('fetch failed') ||
    message.includes('ECONNRESET')
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute Gemini generateContent with automatic retry, exponential backoff,
 * and fallback model cascading.
 */
export async function generateContentWithResilience(
  ai: GoogleGenAI,
  contents: string,
  config: {
    systemInstruction?: string;
    responseMimeType?: string;
    temperature?: number;
  },
  preferredModel = 'gemini-3.8-flash'
): Promise<{ text: string; modelUsed: string }> {
  // Ensure preferred model is first in the list
  const modelsToTry = [
    preferredModel,
    ...CANDIDATE_MODELS.filter((m) => m !== preferredModel),
  ];

  let lastError: unknown = null;

  for (const model of modelsToTry) {
    // Up to 2 attempts per candidate model
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        const text = response.text || '';
        return { text, modelUsed: model };
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);

        if (isTransientError(err)) {
          const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
          const baseDelay = isTestEnv ? 5 : 500;
          const jitter = isTestEnv ? 0 : Math.floor(Math.random() * 250);
          const backoff = attempt * baseDelay + jitter;
          console.warn(
            `[Gemini Resilience] Transient issue on ${model} (attempt ${attempt}/2): ${errMsg.slice(0, 120)}... Waiting ${backoff}ms`
          );
          await delay(backoff);
          // If attempt 2 failed on this model, loop will advance to next model in cascade
        } else {
          // Non-transient error (e.g. invalid syntax); rethrow directly
          throw err;
        }
      }
    }
  }

  throw new GeminiCapacityExceededError(
    'Upstream Gemini model cluster is currently experiencing peak capacity across all candidate models.',
    lastError
  );
}

/**
 * High-quality deterministic grounded fallback when the model cluster is at capacity.
 * Synthesizes exact citations and verbatim text from the retrieved RAG chunks.
 */
export function generateGroundedExcerptFallback(
  query: string,
  documentTitle: string,
  chunks: string[]
): {
  answer: string;
  citations: Array<{
    section: string;
    page: string;
    quote: string;
    relevance: string;
  }>;
  disclaimer: string;
} {
  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['what', 'when', 'where', 'which', 'about', 'their', 'there'].includes(w));

  // Rank retrieved chunks by keyword overlap
  const ranked = chunks.map((chunk) => {
    const lower = chunk.toLowerCase();
    let score = 0;
    queryWords.forEach((word) => {
      if (lower.includes(word)) score += 1;
    });
    return { chunk, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  const bestChunks = ranked.slice(0, 3).map((r) => r.chunk);

  const citations: Array<{
    section: string;
    page: string;
    quote: string;
    relevance: string;
  }> = [];

  bestChunks.forEach((chunk, i) => {
    // Extract section heading if present
    const sectionMatch = chunk.match(/(?:Section|Clause|Article|Paragraph)\s*(\d+[\.\d]*)/i);
    const sectionName = sectionMatch ? `Section ${sectionMatch[1]}` : `Excerpt ${i + 1}`;

    const cleanLines = chunk
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 20);

    const quote = cleanLines[0]?.slice(0, 200) || chunk.slice(0, 160);

    citations.push({
      section: sectionName,
      page: '1',
      quote: quote.replace(/\s+/g, ' '),
      relevance: `Direct provision retrieved from ${documentTitle} matching terms: ${queryWords.slice(0, 3).join(', ')}`,
    });
  });

  const excerptBullets = bestChunks
    .map((c, idx) => {
      const firstLines = c.split('\n').filter((l) => l.trim()).slice(0, 4).join(' ');
      return `**${citations[idx]?.section || `Clause ${idx + 1}`}**: "${firstLines.slice(0, 220)}..."`;
    })
    .join('\n\n');

  const answer = `### Relevant Document Provisions\n\n*Note: The primary AI generative service is currently experiencing peak demand. Here are the directly retrieved, verbatim provisions from **"${documentTitle}"** addressing your query:*\n\n${excerptBullets}\n\nReview the exact terms in the **Document Viewer** tab or consult a legal professional to evaluate the implications of these clauses.`;

  return {
    answer,
    citations,
    disclaimer:
      'LegalLens provides document comprehension assistance only and does not provide legal advice or legal representation. For specific legal guidance, consult a qualified attorney in your jurisdiction.',
  };
}
