import { Request, Response, NextFunction } from 'express';

const DOCUMENT_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const MAX_TITLE_LENGTH = 250;
const MAX_QUERY_LENGTH = 1000;
const MIN_QUERY_LENGTH = 2;
const MAX_FILENAME_LENGTH = 250;
const MAX_CATEGORY_LENGTH = 60;
const MAX_SESSION_ID_LENGTH = 128;
const MAX_INLINE_FILE_CONTENT_BYTES = 10 * 1024 * 1024; // 10MB limit

export function validateProcessDocumentRequest(req: Request, res: Response, next: NextFunction): void {
  const { documentId, title, category, fileName, fileSize, fileContent } = req.body;

  if (!documentId || typeof documentId !== 'string' || !DOCUMENT_ID_REGEX.test(documentId) || documentId.length > 128) {
    res.status(400).json({ error: 'Invalid or missing documentId. Must be alphanumeric with dashes/underscores, max 128 chars.' });
    return;
  }

  if (title && (typeof title !== 'string' || title.length > MAX_TITLE_LENGTH)) {
    res.status(400).json({ error: `Document title must be a string up to ${MAX_TITLE_LENGTH} characters.` });
    return;
  }

  if (category && (typeof category !== 'string' || category.length > MAX_CATEGORY_LENGTH)) {
    res.status(400).json({ error: `Document category must be a string up to ${MAX_CATEGORY_LENGTH} characters.` });
    return;
  }

  if (fileName && (typeof fileName !== 'string' || fileName.length > MAX_FILENAME_LENGTH)) {
    res.status(400).json({ error: `File name must be a string up to ${MAX_FILENAME_LENGTH} characters.` });
    return;
  }

  if (fileSize && (typeof fileSize !== 'number' || fileSize < 0 || fileSize > 25 * 1024 * 1024)) {
    res.status(400).json({ error: 'File size must be a non-negative number under 25MB.' });
    return;
  }

  if (fileContent && typeof fileContent === 'string' && fileContent.length > MAX_INLINE_FILE_CONTENT_BYTES) {
    res.status(400).json({ error: 'File content exceeds maximum allowed size of 10MB.' });
    return;
  }

  next();
}

export function validateChatRequest(req: Request, res: Response, next: NextFunction): void {
  const { documentId, query, sessionId } = req.body;

  if (!documentId || typeof documentId !== 'string' || !DOCUMENT_ID_REGEX.test(documentId) || documentId.length > 128) {
    res.status(400).json({ error: 'documentId is required and must be valid alphanumeric format.' });
    return;
  }

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query string is required.' });
    return;
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length < MIN_QUERY_LENGTH) {
    res.status(400).json({ error: `Query must be at least ${MIN_QUERY_LENGTH} characters long.` });
    return;
  }

  if (trimmedQuery.length > MAX_QUERY_LENGTH) {
    res.status(400).json({ error: `Query exceeds maximum allowed length of ${MAX_QUERY_LENGTH} characters.` });
    return;
  }

  if (sessionId && (typeof sessionId !== 'string' || sessionId.length > MAX_SESSION_ID_LENGTH || !DOCUMENT_ID_REGEX.test(sessionId))) {
    res.status(400).json({ error: 'Invalid sessionId format.' });
    return;
  }

  next();
}
