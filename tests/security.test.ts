import { describe, it, expect, beforeEach } from 'vitest';
import express, { Request, Response } from 'express';
import { requireAuth } from '../server/middleware/auth';
import { rateLimiter } from '../server/middleware/rateLimiter';
import { validateProcessDocumentRequest, validateChatRequest } from '../server/middleware/validation';
import { 
  verifyDocumentOwnership, 
  saveDocumentAndSubcollections, 
  deleteDocumentCascade, 
  getDocumentById,
  resetDocumentStoreForTesting 
} from '../server/services/documentService';
import { 
  indexDocument, 
  retrieveSemanticChunks, 
  getUserChunkCount,
  deleteDocumentChunks 
} from '../server/rag/semanticStore';

describe('Phase 18 — Security Test Suite', () => {
  beforeEach(() => {
    resetDocumentStoreForTesting();
  });

  // 1. Unauthenticated request to /api/documents/* is rejected with 401
  it('1. Rejects unauthenticated requests to protected endpoints with 401', async () => {
    let statusCode: number | null = null;
    let responseBody: any = null;

    const req = {
      headers: {},
      ip: '127.0.0.1',
    } as unknown as Request;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    let nextCalled = false;
    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(401);
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toMatch(/unauthorized|authentication required/i);
  });

  // 2. User A cannot access User B document
  it('2. Enforces cross-user isolation: User A cannot access User B document', async () => {
    const userA_id = 'user-alpha-123';
    const userB_id = 'user-bravo-456';
    const docId = 'doc-confidential-789';

    // Save document belonging to User A
    await saveDocumentAndSubcollections(userA_id, {
      id: docId,
      userId: userA_id,
      title: 'Alpha Private Agreement',
      category: 'NDA',
      fileName: 'nda.txt',
      fileSize: 1024,
      storagePath: `users/${userA_id}/documents/${docId}/original`,
      uploadDate: new Date().toISOString(),
      lastAnalyzed: new Date().toISOString(),
      status: 'ready',
      metadata: { parties: [], summary: 'Private NDA' },
      extractedSections: [{ id: 'sec-1', title: 'Confidentiality', verbatimQuote: 'Strict secret', plainEnglish: 'Keep secret', category: 'general' }],
      obligations: [],
      deadlines: [],
      financialCommitments: [],
      attentionItems: [],
      inconsistencies: [],
    });

    // User A should be verified as owner
    const isOwnerA = await verifyDocumentOwnership(userA_id, docId);
    expect(isOwnerA).toBe(true);

    // User B MUST NOT be verified as owner
    const isOwnerB = await verifyDocumentOwnership(userB_id, docId);
    expect(isOwnerB).toBe(false);

    // Retrieve via Semantic RAG for User B should return 0 results
    await indexDocument(null, userA_id, docId, 'Alpha Agreement', 'Confidential financial details and clauses.');
    const userBSearch = await retrieveSemanticChunks(null, userB_id, docId, 'confidential details');
    expect(userBSearch.length).toBe(0);
  });

  // 3. Malformed JSON payload is rejected
  it('3. Rejects malformed or missing JSON fields with 400 Bad Request', async () => {
    let statusCode: number | null = null;
    let responseBody: any = null;

    const req = {
      body: {
        // Missing documentId and query
        dummy: 'invalid',
      },
    } as unknown as Request;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    let nextCalled = false;
    validateChatRequest(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(400);
    expect(responseBody.error).toMatch(/documentId is required/i);
  });

  // 4. Request exceeding rate limit returns 429
  it('4. Enforces rate limits and returns 429 Too Many Requests', () => {
    const strictLimiter = rateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 2,
      message: 'Rate limit exceeded.',
    });

    let lastStatus: number | null = null;
    let lastBody: any = null;

    const mockRes = {
      setHeader: () => {},
      status(code: number) {
        lastStatus = code;
        return this;
      },
      json(body: any) {
        lastBody = body;
        return this;
      },
    } as unknown as Response;

    const req = { ip: '192.168.1.50' } as unknown as Request;

    // Call 1
    strictLimiter(req, mockRes, () => {});
    expect(lastStatus).toBe(null);

    // Call 2
    strictLimiter(req, mockRes, () => {});
    expect(lastStatus).toBe(null);

    // Call 3 (should be blocked)
    strictLimiter(req, mockRes, () => {});
    expect(lastStatus).toBe(429);
    expect(lastBody.error).toBe('Rate limit exceeded.');
  });

  // 5. Document deletion removes references correctly
  it('5. Cascading deletion purges document, subcollections, storage, and RAG index', async () => {
    const uid = 'user-cascade-test';
    const docId = 'doc-delete-123';

    await saveDocumentAndSubcollections(uid, {
      id: docId,
      userId: uid,
      title: 'Temporary Lease',
      category: 'Lease',
      fileName: 'lease.txt',
      fileSize: 500,
      storagePath: `users/${uid}/documents/${docId}/original`,
      uploadDate: new Date().toISOString(),
      lastAnalyzed: new Date().toISOString(),
      status: 'ready',
      metadata: { parties: [], summary: 'Lease agreement' },
      extractedSections: [{ id: 'sec-1', title: 'Rent', verbatimQuote: '$1000/mo', plainEnglish: 'Pay rent', category: 'financial' }],
      obligations: [],
      deadlines: [],
      financialCommitments: [],
      attentionItems: [],
      inconsistencies: [],
    });

    // Index in Semantic Store
    await indexDocument(null, uid, docId, 'Temporary Lease', 'Rent shall be one thousand dollars per month.');
    expect(getUserChunkCount(uid, docId)).toBeGreaterThan(0);

    // Perform complete cascading deletion
    const deleted = await deleteDocumentCascade(uid, docId);
    expect(deleted).toBe(true);

    // Verify document is gone
    const docAfter = await getDocumentById(uid, docId);
    expect(docAfter).toBe(null);

    // Verify Semantic RAG index chunks are purged
    expect(getUserChunkCount(uid, docId)).toBe(0);
  });

  // 6. File larger than limit or invalid document size is rejected
  it('6. Rejects oversized document upload payloads with validation error', () => {
    let statusCode: number | null = null;
    let responseBody: any = null;

    const oversizedText = 'A'.repeat(1024 * 1024 * 25); // 25 MB string

    const req = {
      body: {
        documentId: 'doc-large-1',
        title: 'Huge Document',
        fileContent: oversizedText,
      },
    } as unknown as Request;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    let nextCalled = false;
    validateProcessDocumentRequest(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(statusCode).toBe(400);
    expect(responseBody.error).toMatch(/exceeds maximum allowed size/i);
  });
});
