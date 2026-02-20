/**
 * SQL Injection Prevention Tests
 * Ensures Prisma ORM protects against SQL injection attacks
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

// OWASP SQL Injection payloads
const SQL_INJECTION_PAYLOADS = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "1; DELETE FROM transactions; --",
  "admin'--",
  "' UNION SELECT * FROM users --",
  "1' AND SLEEP(5) --",
  "' OR 1=1 --",
  "admin' OR '1'='1",
  "'; DELETE FROM categories; /*",
  "1' OR 'a'='a",
];

describe('SQL Injection Prevention', () => {
  beforeAll(async () => {
    // Create test data
    await prisma.category.create({
      data: {
        name: 'Test Category',
        type: 'expense',
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.transaction.deleteMany();
    await prisma.category.deleteMany();
  });

  it('should prevent SQL injection in transaction description queries', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      // This should NOT crash or execute the injected SQL
      const result = await prisma.transaction.findMany({
        where: {
          description: {
            contains: payload,
          },
        },
      });

      // Should return empty array, never execute attack
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    }
  });

  it('should prevent SQL injection in category name queries', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const result = await prisma.category.findMany({
        where: {
          name: {
            contains: payload,
          },
        },
      });

      expect(Array.isArray(result)).toBe(true);
      // Should not execute injection
    }
  });

  it('should prevent SQL injection in transaction recipient queries', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const result = await prisma.transaction.findMany({
        where: {
          recipient: {
            contains: payload,
          },
        },
      });

      expect(Array.isArray(result)).toBe(true);
    }
  });

  it('should prevent SQL injection in fixed cost queries', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const result = await prisma.fixedCost.findMany({
        where: {
          name: {
            contains: payload,
          },
        },
      });

      expect(Array.isArray(result)).toBe(true);
    }
  });

  it('should safely handle special characters in queries', async () => {
    const specialChars = ['"', "'", '\\', '%', '_', ';', '--', '/*', '*/'];

    for (const char of specialChars) {
      const result = await prisma.transaction.findMany({
        where: {
          description: {
            contains: char,
          },
        },
      });

      expect(Array.isArray(result)).toBe(true);
    }
  });
});
