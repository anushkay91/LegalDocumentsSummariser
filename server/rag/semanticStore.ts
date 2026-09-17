import { GoogleGenAI } from '@google/genai';

export interface SemanticChunk {
  id: string;
  uid: string;
  documentId: string;
  documentName: string;
  sectionNumber?: string;
  page: number;
  text: string;
  embedding: number[];
}

export interface RetrievalResult {
  chunk: SemanticChunk;
  similarity: number;
}

// In-memory semantic vector store partitioned by UID
// In production or multi-replica setups, this maps to Gemini File Search Store or a vector database.
const userSemanticStores = new Map<string, SemanticChunk[]>();

/**
 * Calculates cosine similarity between two numeric vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Deterministic semantic hashing fallback for embedding generation
 * when live Gemini embedding API is in offline/test mode.
 */
function generateDeterministicEmbedding(text: string, dimensions = 64): number[] {
  const vector = new Array(dimensions).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;
  }

  // Normalize vector
  let norm = 0;
  for (let v of vector) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vector.map(v => v / norm);
}

/**
 * Generate embedding vector using Gemini API or fallback
 */
export async function getEmbedding(ai: GoogleGenAI | null, text: string): Promise<number[]> {
  if (ai) {
    try {
      // Use text-embedding-004 model
      const response = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text.slice(0, 2048),
      });
      const resAny = response as any;
      if (resAny?.embedding?.values) {
        return resAny.embedding.values;
      }
      if (resAny?.embeddings?.[0]?.values) {
        return resAny.embeddings[0].values;
      }
    } catch {
      // Gracefully fall back to deterministic semantic vectorizer
    }
  }
  return generateDeterministicEmbedding(text);
}

/**
 * Index document chunks into the user's isolated semantic store.
 */
export async function indexDocument(
  ai: GoogleGenAI | null,
  uid: string,
  documentId: string,
  documentName: string,
  rawText: string
): Promise<number> {
  // Purge any existing chunks for this document first
  deleteDocumentChunks(uid, documentId);

  // Split into semantic clauses/paragraphs
  const rawParagraphs = rawText
    .split(/\n\s*\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 30);

  const chunks: SemanticChunk[] = [];
  let page = 1;

  for (let i = 0; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i];
    // Approximate page advance every ~3000 chars
    if (i > 0 && i % 4 === 0) page++;

    // Detect section header or number
    const sectionMatch = p.match(/(?:Section|Article|Clause|\b)\s*(\d+(?:\.\d+)?)/i);
    const sectionNumber = sectionMatch ? `Section ${sectionMatch[1]}` : undefined;

    const embedding = await getEmbedding(ai, p);

    chunks.push({
      id: `chunk-${documentId}-${i}`,
      uid, // Strict UID scoping
      documentId,
      documentName,
      sectionNumber,
      page,
      text: p,
      embedding,
    });
  }

  const existing = userSemanticStores.get(uid) || [];
  userSemanticStores.set(uid, [...existing, ...chunks]);

  return chunks.length;
}

/**
 * Semantic Retrieval scoped strictly to authenticated user and document.
 * Enforces User Isolation: Cross-user searches return empty results.
 */
export async function retrieveSemanticChunks(
  ai: GoogleGenAI | null,
  uid: string,
  documentId: string,
  query: string,
  maxChunks = 5
): Promise<RetrievalResult[]> {
  const userChunks = userSemanticStores.get(uid) || [];

  // Filter strictly by authenticated UID and target documentId
  const docChunks = userChunks.filter(c => c.uid === uid && c.documentId === documentId);
  if (docChunks.length === 0) {
    return [];
  }

  const queryEmbedding = await getEmbedding(ai, query);

  const scored: RetrievalResult[] = docChunks.map(chunk => ({
    chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort descending by semantic similarity
  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, maxChunks);
}

/**
 * Purges all indexed semantic chunks for a document belonging to a user.
 */
export function deleteDocumentChunks(uid: string, documentId: string): boolean {
  const userChunks = userSemanticStores.get(uid);
  if (!userChunks) return false;

  const filtered = userChunks.filter(c => !(c.uid === uid && c.documentId === documentId));
  userSemanticStores.set(uid, filtered);
  return true;
}

/**
 * Get total indexed chunks count for a user
 */
export function getUserChunkCount(uid: string, documentId?: string): number {
  const userChunks = userSemanticStores.get(uid) || [];
  if (!documentId) return userChunks.length;
  return userChunks.filter(c => c.documentId === documentId).length;
}
