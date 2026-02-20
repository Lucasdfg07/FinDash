'use server';

import { z } from 'zod';
import crypto from 'crypto';

/**
 * CSRF Token Management
 * Prevents Cross-Site Request Forgery attacks
 */

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-secret-change-in-prod';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CSRFToken {
  token: string;
  createdAt: number;
}

// In-memory store (use Redis in production)
const tokenStore = new Map<string, CSRFToken>();

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex');

  const csrfToken = `${token}.${signature}`;

  // Store with expiry
  tokenStore.set(token, {
    token: csrfToken,
    createdAt: Date.now(),
  });

  return csrfToken;
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string): boolean {
  try {
    const [tokenPart, signaturePart] = token.split('.');

    if (!tokenPart || !signaturePart) {
      return false;
    }

    // Check token exists and not expired
    const stored = tokenStore.get(tokenPart);
    if (!stored) {
      return false;
    }

    if (Date.now() - stored.createdAt > TOKEN_EXPIRY) {
      tokenStore.delete(tokenPart);
      return false;
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', CSRF_SECRET)
      .update(tokenPart)
      .digest('hex');

    return signaturePart === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * Clean expired tokens
 */
export function cleanExpiredTokens(): void {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (now - value.createdAt > TOKEN_EXPIRY) {
      tokenStore.delete(key);
    }
  }
}

/**
 * Zod schema for CSRF token validation
 */
export const csrfTokenSchema = z.object({
  csrfToken: z.string().min(64),
});

export type CSRFTokenRequest = z.infer<typeof csrfTokenSchema>;
