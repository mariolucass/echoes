import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import prisma from '../../../src/database/prisma.js';
import { signAccessToken } from '../../../src/utils/jwt.js';

vi.mock('../../../src/database/prisma.js', () => ({
  default: {
    decision: { findMany: vi.fn(), count: vi.fn() },
    requestLog: { create: vi.fn().mockResolvedValue(undefined) },
  },
}));

const findMany = vi.mocked(prisma.decision.findMany);
const count = vi.mocked(prisma.decision.count);
const originalSecret = env.JWT_SECRET;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-25T12:00:00.000Z'));
  env.JWT_SECRET = 'test-secret-that-is-at-least-32-bytes-long';
  findMany.mockResolvedValue([]);
  count.mockResolvedValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  env.JWT_SECRET = originalSecret;
  findMany.mockReset();
  count.mockReset();
});

describe('GET /decisions', () => {
  it('lists only the authenticated user decisions with pagination metadata', async () => {
    const decision = {
      id: 'decision-1', title: 'Escolher emprego', description: null, context: null,
      status: 'ACTIVE', decidedAt: null, createdAt: new Date('2026-09-25T10:00:00.000Z'),
      updatedAt: new Date('2026-09-25T10:00:00.000Z'),
    };
    findMany.mockResolvedValue([decision] as never);
    count.mockResolvedValue(25);
    const token = await signAccessToken('user-123');
    const response = await app.request('/decisions?page=2&limit=10', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [{ ...decision, createdAt: decision.createdAt.toISOString(), updatedAt: decision.updatedAt.toISOString() }],
      meta: { totalItems: 25, totalPages: 3 },
      links: {
        self: '/decisions?page=2&limit=10',
        next: '/decisions?page=3&limit=10',
        prev: '/decisions?page=1&limit=10',
      },
    });
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123', deletedAt: null }, skip: 10, take: 10,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true, title: true, description: true, context: true, status: true,
        decidedAt: true, createdAt: true, updatedAt: true,
      },
    });
    expect(count).toHaveBeenCalledWith({ where: { userId: 'user-123', deletedAt: null } });
  });

  it('rejects invalid values and applies defaults to omitted pagination', async () => {
    const token = await signAccessToken('user-123');
    const headers = { Authorization: `Bearer ${token}` };
    const invalid = await app.request('/decisions?page=2abc&limit=0', { headers });
    expect(invalid.status).toBe(422);
    expect(findMany).not.toHaveBeenCalled();

    const defaults = await app.request('/decisions', { headers });
    expect(defaults.status).toBe(200);
    expect((await defaults.json() as { links: { self: string } }).links.self).toBe('/decisions?page=1');
    expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 0, take: 12 }));

    const maximum = await app.request('/decisions?page=3&limit=48', { headers });
    expect(maximum.status).toBe(200);
    expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 96, take: 48 }));
  });

  it('applies search, status, date, and ordering query parameters', async () => {
    const token = await signAccessToken('user-123');
    const response = await app.request(
      '/decisions?search=carreira&status=ACTIVE&decidedAtFrom=2026-09-01T00%3A00%3A00.000Z&sortBy=title&order=asc',
      { headers: { Authorization: `Bearer ${token}` } },
    );

    expect(response.status).toBe(200);
    expect((await response.json() as { links: { self: string } }).links.self).toBe(
      '/decisions?page=1&status=ACTIVE&sortBy=title&order=asc&search=carreira&decidedAtFrom=2026-09-01T00%3A00%3A00.000Z',
    );
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        AND: expect.arrayContaining([
          { userId: 'user-123', deletedAt: null },
          { status: 'ACTIVE' },
          { decidedAt: { gte: new Date('2026-09-01T00:00:00.000Z') } },
          {
            OR: [
              { title: { contains: 'carreira', mode: 'insensitive' } },
              { description: { contains: 'carreira', mode: 'insensitive' } },
              { context: { contains: 'carreira', mode: 'insensitive' } },
            ],
          },
        ]),
      },
      orderBy: [{ title: 'asc' }, { id: 'asc' }],
    }));
    expect(count).toHaveBeenCalledWith({ where: expect.objectContaining({ AND: expect.any(Array) }) });
  });

  it('requires authentication before querying the database', async () => {
    const response = await app.request('/decisions');
    expect(response.status).toBe(401);
    expect(findMany).not.toHaveBeenCalled();
    expect(count).not.toHaveBeenCalled();
  });
});
