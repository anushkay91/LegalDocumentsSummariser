import { describe, it, expect } from 'vitest';
import express, { Request, Response } from 'express';
import { requireAuth } from './middleware/auth';

function createTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
    res.json({
      status: 'authenticated',
      user: req.user,
    });
  });

  app.post('/api/documents/analyze', requireAuth, (req: Request, res: Response) => {
    res.json({ analyzed: true, userId: req.user?.uid });
  });

  app.post('/api/documents/rag-chat', requireAuth, (req: Request, res: Response) => {
    res.json({ answered: true, userId: req.user?.uid });
  });

  return app;
}

describe('Server API & Auth Guard Integration (Phase 1)', () => {
  const app = createTestApp();

  it('allows public health check without auth', async () => {
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/health`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
    } finally {
      server.close();
    }
  });

  it('blocks unauthenticated requests to /api/auth/me with 401', async () => {
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/auth/me`);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('Authorization header');
    } finally {
      server.close();
    }
  });

  it('blocks unauthenticated requests to /api/documents/analyze with 401', async () => {
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/documents/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: 'Sample legal text' }),
      });
      expect(res.status).toBe(401);
    } finally {
      server.close();
    }
  });

  it('blocks unauthenticated requests to /api/documents/rag-chat with 401', async () => {
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/documents/rag-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'What are my obligations?' }),
      });
      expect(res.status).toBe(401);
    } finally {
      server.close();
    }
  });

  it('allows authenticated requests with valid bearer token and injects req.user', async () => {
    const server = app.listen(0);
    const address = server.address() as any;
    const port = address.port;

    try {
      const res = await fetch(`http://localhost:${port}/api/auth/me`, {
        headers: {
          Authorization: 'Bearer test-token-tenant-42',
        },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('authenticated');
      expect(body.user.uid).toBe('tenant-42');
      expect(body.user.email).toBe('tenant-42@test.local');
    } finally {
      server.close();
    }
  });
});
