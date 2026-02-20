# 🔐 Security Hardening Plan - Semana 6

**Status:** Planning | **Priority:** HIGH | **Timeline:** Week 6

---

## Executive Summary

Current Findash security: **95% (Semana 1-3 implementation)**. Semana 6 focuses on **Defense-in-Depth** - hardening remaining attack vectors:

1. **Input Sanitization** - XSS prevention beyond validation
2. **CSRF Protection** - Token-based request verification
3. **SQL Injection Testing** - Automated fuzzing
4. **Secure Session Storage** - httpOnly cookies
5. **API Security** - Rate limiting, CORS refinement
6. **Dependency Security** - SCA and vulnerability scanning

**Target:** OWASP Top 10 Full Compliance + Industry best practices

---

## 🎯 Security Assessment

### Current State

```
✅ Implemented (Semana 1-3):
├─ Authentication (NextAuth.js + JWT)
├─ Rate limiting (memory + Redis ready)
├─ Input validation (Zod schemas)
├─ CORS configuration
├─ Security headers (CSP, HSTS, X-Frame-Options)
├─ Audit logging (AuditLog model)
├─ Request signing (via NextAuth)
└─ HTTPS enforcement (Railway)

⚠️  Gaps Identified:
├─ XSS: Validation only, no sanitization
├─ CSRF: No token protection
├─ SQLi: Schema-based only, no fuzzing
├─ Session: JWT in memory, httpOnly review
├─ Dependency: No SCA or vulnerability scans
└─ API: Rate limit per-endpoint, not global
```

---

## 📋 Semana 6 Tasks (5 Total)

### Task 1: XSS Prevention - Input Sanitization
**Risk:** Medium | **Impact:** High | **Effort:** 4 hours

#### Problem
- Current: Zod validates FORMAT but doesn't SANITIZE
- Example: Transaction description can contain `<script>` tags
- Risk: Browser executes malicious script in user content

#### Solution
```typescript
// Add sanitization library
npm install dompurify isomorphic-dompurify

// Sanitize on input
import DOMPurify from 'isomorphic-dompurify';

export const transactionSchema = z.object({
  description: z.string()
    .min(1)
    .transform(val => DOMPurify.sanitize(val))
    .transform(val => val.trim()),
  // ... rest
});

// Also sanitize on display
<span>{DOMPurify.sanitize(transaction.description)}</span>
```

#### Files to Update
- `src/lib/schemas.ts` - Add sanitization to all text inputs
- `src/components/TransactionItem.tsx` - Safe rendering
- `src/app/api/transactions/route.ts` - Sanitize before DB
- `src/app/api/categories/route.ts` - Sanitize category names

#### Testing
- Test with XSS payloads: `<img src=x onerror="alert(1)">`
- Test with event handlers: `<div onclick="alert(1)">`
- Test with HTML entities: `&lt;script&gt;`

---

### Task 2: CSRF Protection - Token-Based Verification
**Risk:** High | **Impact:** Medium | **Effort:** 6 hours

#### Problem
- Current: No CSRF protection
- Attack: Attacker tricks user into POST/PUT/DELETE from external site
- Example: `<img src="https://findash.com/api/transactions?id=123" />` deletes transaction

#### Solution
```typescript
// Use next-csrf or custom implementation
// Option 1: Middleware-based CSRF protection

// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const method = request.method;

  // Check CSRF token for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const token = request.headers.get('x-csrf-token') ||
                 request.nextUrl.searchParams.get('_csrf');

    if (!token || !verifyCSRFToken(token)) {
      return NextResponse.json(
        { error: 'CSRF token invalid' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};

// Client-side token generation & sending
export async function getCSRFToken() {
  const res = await fetch('/api/csrf-token');
  const { token } = await res.json();
  return token;
}

// Usage in forms/requests
const token = await getCSRFToken();
fetch('/api/transactions', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

#### Files to Update
- `middleware.ts` - Add CSRF verification
- `src/app/api/csrf-token/route.ts` - Token generation endpoint
- `src/lib/auth-utils.ts` - Token validation logic
- `src/components/forms/*.tsx` - Send CSRF tokens

#### Testing
- Test POST without token → 403
- Test POST with valid token → 200
- Test from different origin → 403

---

### Task 3: SQL Injection Testing - Automated Fuzzing
**Risk:** Critical | **Impact:** Critical | **Effort:** 5 hours

#### Problem
- Current: Prisma prevents SQLi by default
- But: Dynamic queries or raw SQL could be vulnerable
- Need: Automated testing to confirm

#### Solution
```typescript
// Create SQL injection test suite
// tests/security/sql-injection.test.ts

import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

const SQL_INJECTION_PAYLOADS = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "1; DELETE FROM transactions; --",
  "admin'--",
  "' UNION SELECT * FROM users --",
  "1' AND SLEEP(5) --", // Time-based blind SQLi
];

describe('SQL Injection Prevention', () => {
  it('should prevent SQL injection in transaction queries', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      // This should not throw or crash
      const result = await prisma.transaction.findMany({
        where: {
          description: {
            contains: payload
          }
        }
      });
      expect(Array.isArray(result)).toBe(true);
    }
  });

  it('should prevent SQL injection in category queries', async () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      const result = await prisma.category.findMany({
        where: {
          name: {
            contains: payload
          }
        }
      });
      expect(Array.isArray(result)).toBe(true);
    }
  });
});
```

#### Files to Update
- `tests/security/sql-injection.test.ts` (NEW)
- `tests/security/xss-injection.test.ts` (NEW)
- CI/CD to run security tests

#### Testing
- Run automated fuzzing
- Test with OWASP SQL injection list
- Verify no errors or behavior changes

---

### Task 4: Secure Session Storage - httpOnly Cookies
**Risk:** High | **Impact:** Medium | **Effort:** 3 hours

#### Problem
- Current: JWT in localStorage/memory
- Risk: XSS can steal tokens from localStorage
- Solution: httpOnly secure cookies

#### Solution
```typescript
// next-auth configuration with secure cookies

// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { verify } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      async authorize(credentials) {
        // Your auth logic
      }
    })
  ],

  // ✅ Secure cookie configuration
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 7 * 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,        // ✅ Not accessible from JS
        secure: true,          // ✅ HTTPS only
        sameSite: 'lax' as const, // ✅ CSRF protection
        path: '/',
      }
    },
    callbackUrl: {
      name: `${useSecureCookies ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax' as const,
        path: '/',
      }
    },
    csrfToken: {
      name: `${useSecureCookies ? '__Secure-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax' as const,
        path: '/',
      }
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    }
  }
};
```

#### Files to Update
- `src/lib/auth.ts` - Enhanced auth config
- `next.config.ts` - Verify secure headers still in place
- `middleware.ts` - Cookie validation

#### Testing
- Login and verify `httpOnly` cookie set
- Test XSS can't read token (would fail)
- Verify HTTPS enforcement on production

---

### Task 5: API Security Hardening
**Risk:** Medium | **Impact:** Medium | **Effort:** 4 hours

#### Sub-tasks

**5a. Global Rate Limiting**
```typescript
// middleware.ts - Add global rate limit
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour per IP
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  return NextResponse.next();
}
```

**5b. Content Security Policy Review**
```typescript
// next.config.ts - Verify strict CSP
"Content-Security-Policy": [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // ⚠️ Consider removing unsafe-*
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')
```

**5c. API Response Security**
```typescript
// Standardize error responses (don't leak info)
export function safeErrorResponse(error: unknown) {
  console.error(error); // Log internally

  return {
    success: false,
    error: 'An error occurred',
    // Don't expose: error.stack, error.message, implementation details
  };
}
```

---

## 🔒 Defense-in-Depth Layers

```
Layer 7 (Application):
├─ Input validation (Zod)
├─ Output sanitization (DOMPurify)
├─ CSRF tokens
└─ Rate limiting

Layer 6 (API):
├─ Authentication (NextAuth)
├─ Authorization (getServerSession)
├─ Audit logging
└─ Error handling

Layer 5 (Transport):
├─ HTTPS/TLS enforcement
├─ Secure cookies (httpOnly, secure, sameSite)
└─ HSTS headers

Layer 4 (Database):
├─ Parameterized queries (Prisma ORM)
├─ Input validation
└─ No raw SQL

Layer 3 (Infrastructure):
├─ Secrets in environment (Railway)
├─ WAF (if needed)
└─ DDoS protection

Layer 1-2 (Network):
└─ Railway managed
```

---

## 📊 Risk Matrix

| Risk | Severity | Likelihood | Mitigation | Task |
|------|----------|------------|-----------|------|
| XSS | High | Medium | Sanitization | Task 1 |
| CSRF | High | High | Token validation | Task 2 |
| SQLi | Critical | Low | Prisma ORM | Task 3 |
| Session hijacking | High | Medium | httpOnly cookies | Task 4 |
| API abuse | Medium | High | Rate limiting | Task 5 |
| Dependency vulns | Medium | High | SCA scanning | CI/CD |

---

## 🧪 Testing Strategy

### Unit Tests
- XSS payload filtering
- CSRF token validation
- SQL injection prevention
- Session token encryption

### Integration Tests
- Login flow with secure cookies
- CSRF token in forms
- Rate limiting per endpoint
- Error response sanitization

### Security Tests
```bash
# OWASP dependency scanning
npm audit

# SCA (Software Composition Analysis)
# Use Snyk or npm audit

# Dynamic testing
# Burp Suite or OWASP ZAP for manual testing
```

---

## 📝 Implementation Timeline

```
Semana 6: Security Hardening

Monday:
├─ Task 1: XSS sanitization (3h)
├─ Task 2: CSRF protection (3h)
└─ Testing both (2h)

Tuesday:
├─ Task 3: SQL injection tests (3h)
├─ Task 4: Session hardening (2h)
└─ Integration testing (2h)

Wednesday:
├─ Task 5: API security hardening (3h)
├─ Dependency scanning (1h)
├─ Final security audit (2h)
└─ Documentation (1h)

Total: 24 hours
```

---

## ✅ Security Checklist

- [ ] XSS payloads tested and sanitized
- [ ] CSRF tokens implemented on all state-changing operations
- [ ] SQL injection test suite passing
- [ ] Sessions using httpOnly, secure, sameSite cookies
- [ ] Global and per-endpoint rate limiting
- [ ] CSP headers verified strict
- [ ] No sensitive info in error responses
- [ ] Dependency audit passed
- [ ] All tests passing
- [ ] Security documentation updated

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [Next.js Security](https://nextjs.org/docs/guides/security)
- [NextAuth.js Security](https://next-auth.js.org/getting-started/deployment)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

**Status:** Planning phase complete
**Readiness:** Ready for implementation
**Target:** 100% OWASP Top 10 compliance

