import { describe, it, expect, vi } from 'vitest';
import { requireAuth, verifyFirebaseIdToken } from './auth';
import { Request, Response } from 'express';

describe('Authentication Middleware (Phase 1: Real Authentication)', () => {
  it('should return 401 if Authorization header is missing', async () => {
    const req = {
      headers: {},
    } as unknown as Request;

    let statusCode = 0;
    let jsonResponse: any = null;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            jsonResponse = data;
          },
        };
      },
    } as unknown as Response;

    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(statusCode).toBe(401);
    expect(jsonResponse?.error).toMatch(/Missing or malformed Authorization header/i);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header does not start with Bearer', async () => {
    const req = {
      headers: {
        authorization: 'Basic dXNlcjpwYXNz',
      },
    } as unknown as Request;

    let statusCode = 0;
    let jsonResponse: any = null;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            jsonResponse = data;
          },
        };
      },
    } as unknown as Response;

    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(statusCode).toBe(401);
    expect(jsonResponse?.error).toMatch(/Missing or malformed Authorization header/i);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Bearer token is empty', async () => {
    const req = {
      headers: {
        authorization: 'Bearer ',
      },
    } as unknown as Request;

    let statusCode = 0;
    let jsonResponse: any = null;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (data: any) => {
            jsonResponse = data;
          },
        };
      },
    } as unknown as Response;

    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach verified user object and call next() on valid token', async () => {
    const req = {
      headers: {
        authorization: 'Bearer test-token-user-12345',
      },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user?.uid).toBe('user-12345');
    expect(req.user?.email).toBe('user-12345@test.local');
  });

  it('should verify test token via verifyFirebaseIdToken', async () => {
    const verified = await verifyFirebaseIdToken('test-token-usr-999');
    expect(verified).not.toBeNull();
    expect(verified?.uid).toBe('usr-999');
  });

  it('should reject unverified guest session token without real Firebase token', async () => {
    const guestToken = 'guest-session-abc123xyz';
    const verified = await verifyFirebaseIdToken(guestToken);
    expect(verified).toBeNull();
  });
});
