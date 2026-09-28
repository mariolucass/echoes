import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../app.js';
import { env } from '../config/env.js';

vi.mock('../database/prisma.js', () => ({
  default: { $queryRaw: vi.fn() },
}));

import prisma from '../database/prisma.js';
import { HealthService } from '../services/system/health.service.js';

const query = vi.mocked(prisma.$queryRaw);
const originalSecret = env.JWT_SECRET;

describe('GET /health', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-25T12:00:00.000Z'));
    env.JWT_SECRET = 'test-secret-that-is-at-least-32-bytes-long';
    query.mockResolvedValue([{ '?column?': 1 }]);
  });
  afterEach(() => {
    vi.useRealTimers();
    env.JWT_SECRET = originalSecret;
    query.mockReset();
  });

  it('returns the API status', async () => {
    const response = await app.request('/health');
    const body = await response.json() as {
      status: string;
      service: string;
      checks: { database: { status: string; responseTimeMs: number }; authentication: { status: string }; requestLogs: { status: string } };
      runtime: { memory: { rssBytes: number } };
    };
    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('echoes');
    expect(body.checks.database.status).toBe('up');
    expect(body.checks.database.responseTimeMs).toBeGreaterThanOrEqual(0);
    expect(body.checks.authentication.status).toBe('configured');
    expect(body.checks.requestLogs.status).toBe('up');
    expect(body.runtime.memory.rssBytes).toBeGreaterThan(0);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(query).toHaveBeenCalledOnce();
    expect(response.headers.has('ratelimit-limit')).toBe(false);
  });

  it('returns 503 when the database is unavailable without exposing its error', async () => {
    query.mockRejectedValue(new Error('password=private-value'));
    const response = await app.request('/health');
    const body = await response.json() as { status: string; checks: { database: { status: string } } };
    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.checks.database.status).toBe('down');
    expect(JSON.stringify(body)).not.toContain('private-value');
  });

  it('returns 503 when authentication is misconfigured', async () => {
    env.JWT_SECRET = '';
    const response = await app.request('/health');
    const body = await response.json() as { checks: { authentication: { status: string } } };
    expect(response.status).toBe(503);
    expect(body.checks.authentication.status).toBe('misconfigured');
  });

  it('reports a request log write failure', async () => {
    const status = await new HealthService().getStatus('down');
    expect(status.status).toBe('degraded');
    expect(status.checks.requestLogs.status).toBe('down');
  });

  it('keeps the response contract for missing and protected routes', async () => {
    const missing = await app.request('/missing');
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'Route not found' });

    const protectedRoute = await app.request('/decisions');
    expect(protectedRoute.status).toBe(401);
    expect((await protectedRoute.json() as { error: { code: string } }).error.code).toBe('UNAUTHORIZED');
  });
});
