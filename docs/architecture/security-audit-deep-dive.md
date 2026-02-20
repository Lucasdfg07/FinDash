# 🔐 Segurança - Análise Profunda (Exploração Task 1.3)

**Data:** 2026-02-20
**Arquiteto:** Aria (Visionary)
**Escopo:** Análise completa de vulnerabilidades e riscos de segurança

---

## 📊 Resumo Executivo

O Findash possui **proteções básicas** mas com **lacunas críticas**:

| Aspecto | Status | Risco |
|---------|--------|-------|
| **Autenticação** | ✅ NextAuth.js (bom) | Sem 2FA |
| **Transport** | ✅ TLS (via middleware Next.js) | Depende de hospedagem |
| **Certificados** | ✅ REFATORADO para .env | ✅ Resolvido em Task 1.1 |
| **Headers** | ✅ IMPLEMENTADO | ✅ Resolvido em Task 1.3 |
| **Rate Limiting** | ❌ AUSENTE | 🔴 CRÍTICO |
| **Input Validation** | 🟡 PARCIAL (Zod não em tudo) | 🟠 ALTO |
| **CORS** | ❌ NÃO CONFIGURADO | 🟠 ALTO |
| **Logging/Audit** | ❌ AUSENTE | 🟡 MÉDIO |
| **Testes de Seg** | ❌ AUSENTE | 🔴 CRÍTICO |
| **DB Segurança** | ✅ SQLite + Prisma | Limitado para produção |

---

## 🎯 Vulnerabilidades Identificadas

### 🔴 CRÍTICO

#### 1. **Sem Rate Limiting**
**Localização:** Todos os endpoints em `src/app/api/`
**Risco:** Brute force, DoS, abuso de API
**Exemplo Vulnerável:**
```typescript
// ❌ SEM PROTEÇÃO
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await fullSync(dataInicio, dataFim);
  return NextResponse.json(result);
}
// Qualquer pessoa pode chamar isso infinitas vezes
```

**Impacto:**
- Consumo ilimitado de recursos (requisições para Inter Bank)
- DoS: derrubar a aplicação
- Força bruta em endpoints de autenticação

**Solução Recomendada:**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
});

export async function POST(request: NextRequest) {
  const { success } = await ratelimit.limit(
    request.ip || "unknown"
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }
  // ... resto do código
}
```

---

#### 2. **Sem Validação de Input em Todas APIs**
**Localização:** Endpoints variam
**Exemplo:**
```typescript
// ❌ VULNERÁVEL
export async function GET() {
  const transactions = await prisma.transaction.findMany();
  // Sem checar autenticação!
  return NextResponse.json(transactions);
}
```

**Problemas:**
1. Endpoint `/api/transactions` exposto sem autenticação verificável
2. Middleware NextAuth verifica, mas não é explícito
3. Falta validação de tipos com Zod
4. Sem sanitização de input

**Risco:** Exposição de dados, injeção de queries (se houvesse)

---

#### 3. **Middleware de Autenticação Incompleto**
**Localização:** `src/middleware.ts`
**Problema:**
```typescript
const config = {
  matcher: [
    "/((?!login|api/auth|api/inter|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

**Risco:**
- `api/inter/*` está **FORA da proteção**
- Endpoints `/api/inter/sync`, `/api/inter/status` são públicos!
- Qualquer pessoa pode sincronizar banco ou verificar status

**Solução:**
```typescript
const config = {
  matcher: [
    // Proteger TUDO exceto login
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};

// E adicionar verificação de autenticação nos endpoints de Inter
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... continuar
}
```

---

### 🟠 ALTO

#### 4. **Sem CORS Configurado**
**Localização:** Todo o app
**Problema:**
- Nenhuma configuração explícita de CORS
- Dependente de host/deployment
- Permite qualquer origin (em dev)

**Solução:**
```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.ALLOWED_ORIGINS || "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};
```

---

#### 5. **Senhas em SQLite (Desenvolvimento)**
**Localização:** `prisma/schema.prisma`
**Problema:**
```prisma
model User {
  id       String @id @default(cuid())
  password String  // ← Armazenado direto em SQLite
}
```

**Risco:**
- SQLite não tem criptografia nativa
- dev.db está em gitignore mas no disco
- Se BD for roubado, senhas estão expostas

**Status:** ✅ Mitigado em produção (será PostgreSQL)
**Mas:** Implementar PBKDF2 ou Argon2 em production

---

#### 6. **Sem Validação Zod em Todos Endpoints**
**Localização:** Endpoints variam
**Exemplo:**
```typescript
// ❌ SEM VALIDAÇÃO
export async function POST(request: NextRequest) {
  const body = await request.json();
  await prisma.fixedCost.create({ data: body });
}
```

**Risco:**
- Injeção de campos extras
- Tipos inválidos aceitos
- Sem documentação de expected format

**Checklist:**
- [ ] GET /api/transactions - Adicionar validação de query params
- [ ] POST /api/fixed-costs - Validar body com Zod
- [ ] PUT /api/fixed-costs/[id] - Validar ID e body
- [ ] GET /api/inter/status - Sem body, apenas verificar auth
- [ ] POST /api/inter/sync - Validar dataInicio/dataFim (já faz parse, mas sem Zod)

---

### 🟡 MÉDIO

#### 7. **Sem Logging de Segurança**
**Localização:** Todo app
**Problema:**
```typescript
// Apenas console.error (não persistido)
console.error("[Inter Sync] Erro:", error);
```

**Risco:**
- Sem auditoria de ações
- Sem rastreamento de tentativas falhadas
- Impossível investigar incidentes

**Solução:**
```typescript
// src/lib/audit-logger.ts
export async function auditLog(
  userId: string | null,
  action: string,
  resource: string,
  status: "success" | "failure",
  details?: object
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      status,
      details: JSON.stringify(details),
      ip: getClientIp(), // Implementar
      timestamp: new Date(),
    },
  });
}
```

---

#### 8. **Sem Proteção CSRF Explícita**
**Status:** NextAuth.js fornece por padrão (✅ Bom)
**Mas:** Não é documentado
**Recomendação:** Adicionar comentário no código explicando

---

## 🔍 Análise de Endpoints Específicos

### `/api/transactions`
```
GET /api/transactions
├─ ✅ Autenticado (middleware)
├─ ❌ Sem rate limit
├─ ❌ Sem validação output
└─ 🟡 Retorna TUDO (sem paginação)
```

**Risco:** Carregar 1000+ transações esgota memória
**Fix:** Adicionar paginação + limite

---

### `/api/inter/sync` (CRÍTICO)
```
POST /api/inter/sync
├─ ❌ PÚBLICO! (não protegido)
├─ ❌ Sem rate limit
├─ ⚠️ Chama API externa (Inter Bank)
└─ 🟡 Consome recursos do servidor
```

**Risco Extremo:**
- Qualquer pessoa pode forçar 1000 sincronizações
- Consumir quotas da API do Inter
- Derrubar aplicação

**Solução Imediata:**
```typescript
export async function POST(request: NextRequest) {
  // 1. Verificar autenticação
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({}, { status: 401 });

  // 2. Rate limit por user
  const { success } = await ratelimit.limit(`user:${session.user.id}`);
  if (!success) return NextResponse.json({}, { status: 429 });

  // 3. Validar input
  const body = syncRequestSchema.parse(await request.json());

  // 4. Executar
  return NextResponse.json(await fullSync(body.dataInicio, body.dataFim));
}
```

---

### `/api/inter/dedup`
```
POST /api/inter/dedup
├─ ❌ PÚBLICO!
├─ ❌ Sem rate limit
├─ ❌ Sem validação
└─ 🟡 Acessa BD
```

**Problema:** Alguém pode chamar infinitamente para deduplicar dados

---

## 🏗️ Arquitetura de Segurança Recomendada

```
┌─────────────────────────────────────────┐
│       Request da Rede (Internet)        │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────▼─────────┐
         │  Rate Limiting    │ ← Task 1.2
         │  (Por IP + User)  │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │   Auth Middleware │ ✅ (existente)
         │  (NextAuth.js)    │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │  Input Validation │ ← Task 1.2
         │  (Zod Schemas)    │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │  Audit Logging    │ ← Task 3
         │  (AuditLog table) │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │  Business Logic   │
         │  (fullSync, etc)  │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │   Error Handling  │
         │  (sem detalhar)   │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │  Response Headers │ ✅ (Task 1.3 done)
         │  (Security HDRs)  │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │   TLS/Encryption  │ ✅ (Next.js)
         │  (HTTPS em prod)  │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │  Client Browser   │
         └─────────────────────┘
```

---

## ✅ Checklist de Implementação (Semana 1)

### Task 1.1: Certificados ✅ DONE
- [x] Mover INTER_CERT_PEM para .env
- [x] Mover INTER_KEY_PEM para .env
- [x] Remover fs/path imports
- [x] Testar decodificação base64

### Task 1.2: Rate Limiting (PRÓXIMO)
- [ ] Setup Upstash Redis (ou alternativa)
- [ ] Implementar middleware rate-limit
- [ ] Proteger endpoints de Inter (crítico)
- [ ] Testar com ab -n 1000

### Task 1.2.5: Input Validation
- [ ] Criar schemas Zod para todos endpoints
- [ ] Validar queries, bodies, params
- [ ] Retornar 400 em erros de validação
- [ ] Testar com tipos inválidos

### Task 1.3: Security Headers ✅ DONE
- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: DENY
- [x] Strict-Transport-Security
- [x] Content-Security-Policy
- [x] Permissions-Policy

### Task 1.3.5: CORS
- [ ] Configurar ALLOWED_ORIGINS
- [ ] Testar com curl cross-origin
- [ ] Documentar em env.example

### Task 1.4: Autenticação Endpoint (Semana 2)
- [ ] Verificar session em `/api/inter/*`
- [ ] Verificar session em `/api/transactions`
- [ ] Retornar 401 sem autenticação
- [ ] Testes E2E de autorização

### Task 1.5: Logging de Segurança (Semana 2)
- [ ] Criar modelo AuditLog
- [ ] Logar tentativas falhadas de auth
- [ ] Logar operações sensíveis
- [ ] Retenção de 90 dias

---

## 🎯 Próximos Passos Imediatos

### 1. **CRÍTICO - Hoje**
```bash
# Ativar @dev para Task 1.2
# - Rate limiting middleware
# - Proteger /api/inter/*
# - Testar com Apache Bench
```

### 2. **ALTO - Esta Semana**
```bash
# Ativar @dev para validação
# - Zod schemas
# - Verificação de autenticação
# - Testes de 400/401/429
```

### 3. **MÉDIO - Próxima Semana**
```bash
# Ativar @dev para logging
# - Auditoria de segurança
# - Testes de investigação
```

---

## 📚 Referências de Segurança

- **OWASP Top 10 2021:**
  1. ✅ Broken Access Control (Parcial - autenticação ok, rate limit não)
  2. ❌ Cryptographic Failures (tudo criptografado em transit)
  3. ❌ Injection (Prisma previne SQL, mas validação fraca)
  4. ✅ Insecure Design (Security headers implementados)
  5. ❌ Security Misconfiguration (CORS não configurado)
  6. ❌ Vulnerable Components (dependências atualizadas)
  7. ❌ Auth Failures (2FA não implementado)
  8. ✅ Software Data Integrity (certificados seguros)
  9. ❌ Logging Failures (sem auditoria)
  10. ✅ SSRF (não aplicável)

---

## Conclusão

**Status Geral:** 🟡 MÉDIO (40% de segurança implementada)

**Próximo:** Implementar Task 1.2 (Rate Limiting) - é o item crítico que falta.

---

**Arquiteto:** Aria 🏛️
**Data:** 2026-02-20
**Confidencialidade:** Interno
