# Abordagem Recomendada: Melhoria de Arquitetura, Features e Segurança

**Gerado:** 2026-02-20
**Gerado Por:** @architect (Aria)
**Projeto:** Findash
**Fase:** Brownfield Discovery - Recomendações Estratégicas

---

## 📌 Resumo Executivo

O Findash possui uma **arquitetura sólida** mas com **lacunas críticas em segurança e testes**. A recomendação é um **plano de 5 fases de melhoria** focado em:

1. **Fechar brechas de segurança** (imediato)
2. **Implementar testes abrangentes** (semanas 1-3)
3. **Melhorar observabilidade** (semanas 3-4)
4. **Otimizar performance** (semanas 5-6)
5. **Preparar para produção** (semanas 7-8)

---

## 🎯 Objetivos de Melhoria

### 1️⃣ **Segurança**
- ✅ Mover certificados digitais para `.env`
- ✅ Implementar rate limiting em APIs
- ✅ Adicionar security headers
- ✅ Validação com Zod em 100% das APIs
- ✅ Implementar CSRF protection explícita

### 2️⃣ **Testes**
- ✅ Cobertura mínima de 70% para componentes críticos
- ✅ Unit tests para funções de lógica de negócio
- ✅ Testes de integração para APIs
- ✅ E2E tests para fluxos críticos (login, sync banco)

### 3️⃣ **Features**
- ✅ Melhorias na sincronização com Inter Bank
- ✅ Detecção automática de padrões de gasto
- ✅ Alertas e notificações
- ✅ Exportação de dados (CSV, PDF)
- ✅ Dashboard customizável

### 4️⃣ **Performance**
- ✅ Otimização de queries no Prisma
- ✅ Caching de API responses
- ✅ Code splitting e lazy loading
- ✅ Índices no banco de dados

### 5️⃣ **Produção**
- ✅ Migração SQLite → PostgreSQL
- ✅ Docker + Docker Compose
- ✅ CI/CD com GitHub Actions
- ✅ Backup e disaster recovery

---

## 🏗️ Arquitetura Proposta

### Camada de Apresentação (UI)
```
┌─────────────────────────────────────────┐
│         React Components (UI)            │
│  ├─ Dashboard                            │
│  ├─ Transactions                         │
│  ├─ Invoices                             │
│  └─ Settings                             │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────┴─────────┐
         │   Zustand Store   │
         └─────────┬─────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
   UI Layer              Context Layer
 (TailwindCSS)          (ThemeContext)
```

### Camada de Negócio (API)
```
┌──────────────────────────────────────────┐
│      Next.js API Routes (Backend)        │
│  ├─ /api/auth/*            (NextAuth)    │
│  ├─ /api/transactions/*    (Transactions)│
│  ├─ /api/categories/*      (Categories)  │
│  ├─ /api/fixed-costs/*     (FixedCosts)  │
│  └─ /api/inter/*           (InterBank)   │
└──────────────────┬───────────────────────┘
                   │
         ┌─────────┴─────────┐
         │   Middleware      │
         │  ├─ Auth          │
         │  ├─ Rate Limit    │
         │  ├─ Validation    │
         │  └─ Logging       │
         └─────────┬─────────┘
                   │
              Prisma ORM
                   │
              SQLite/PostgreSQL
```

### Integração Externa
```
┌─────────────────────────────────────┐
│     External Services              │
│  ├─ Banco Inter (OAuth2 + mTLS)   │
│  ├─ Email Service (nodemailer?)   │
│  └─ Cloud Storage (S3?)           │
└─────────────────────────────────────┘
```

---

## 📋 Roadmap de Implementação (8 Semanas)

### **Semana 1-2: Segurança Crítica 🔴**

#### Task 1.1: Moverocumentivos e Secrets
```bash
# Antes (INSEGURO)
certs/inter-key.pem       # Em Git!
certs/inter-cert.pem      # Em Git!

# Depois (SEGURO)
.env
  INTER_KEY_PEM=<conteúdo base64>
  INTER_CERT_PEM=<conteúdo base64>
```

**Subtasks:**
- [ ] Ler certificados como base64 do `.env`
- [ ] Converter `lib/inter-api.ts` para usar `.env`
- [ ] Adicionar `certs/` ao `.gitignore`
- [ ] Rotação de certificados para produção

#### Task 1.2: Rate Limiting Middleware
```typescript
// src/middleware.ts - NOVA FUNCIONALIDADE
import { rateLimit } from '@/lib/rate-limit';

export const middleware = (req: NextRequest) => {
  const limited = rateLimit(req);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  // ... continue with auth
};
```

**Subtasks:**
- [ ] Implementar algoritmo token-bucket
- [ ] Limite por IP + User ID
- [ ] Diferentes limites por endpoint
- [ ] Alertas quando limite é atingido

#### Task 1.3: Security Headers
```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: "default-src 'self'" },
        ],
      },
    ];
  },
};
```

**Subtasks:**
- [ ] Configurar CSP (Content Security Policy)
- [ ] Adicionar X-Frame-Options
- [ ] Configurar STS (HSTS)
- [ ] Testar com security headers checker

### **Semana 2-3: Testes 📝**

#### Task 2.1: Setup Vitest + React Testing Library
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom msw
```

**Subtasks:**
- [ ] Criar `vitest.config.ts`
- [ ] Configurar import aliases
- [ ] Setup MSW (Mock Service Worker)
- [ ] Criar helpers de teste

#### Task 2.2: Unit Tests para Auth
```typescript
// src/lib/__tests__/auth.test.ts
describe('NextAuth Config', () => {
  it('should hash passwords with bcryptjs', () => {
    // Test password hashing
  });

  it('should return user on valid credentials', () => {
    // Test authorize callback
  });

  it('should add user.id to JWT token', () => {
    // Test JWT callback
  });
});
```

**Subtasks:**
- [ ] Testar authorize callback
- [ ] Testar JWT callbacks
- [ ] Testar session management
- [ ] Edge cases (empty password, invalid email)

#### Task 2.3: API Route Tests
```typescript
// src/app/api/transactions/__tests__/route.test.ts
describe('GET /api/transactions', () => {
  it('should return 401 without auth', () => {
    // Test unauthenticated request
  });

  it('should return user transactions', () => {
    // Test authenticated request
  });
});
```

**Subtasks:**
- [ ] Testes de todos endpoints CRUD
- [ ] Validação de permissões
- [ ] Error handling (400, 401, 500)
- [ ] Rate limiting tests

#### Task 2.4: Component Tests
```typescript
// src/components/shared/__tests__/DateRangeFilter.test.tsx
describe('DateRangeFilter', () => {
  it('should render date inputs', () => {
    // Test rendering
  });

  it('should call onChange with selected dates', () => {
    // Test interaction
  });
});
```

**Subtasks:**
- [ ] Testes para componentes principais
- [ ] Testes de interação (clicks, inputs)
- [ ] Testes de charts
- [ ] Snapshot tests

#### Task 2.5: E2E Tests com Playwright
```typescript
// e2e/auth.spec.ts
test.describe('Authentication Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });
});
```

**Subtasks:**
- [ ] Setup Playwright
- [ ] Testes de login
- [ ] Testes de sync com Inter
- [ ] Testes de CRUD operações

### **Semana 3-4: Validação e Logging 📊**

#### Task 3.1: Zod Schemas para APIs
```typescript
// src/lib/schemas.ts
export const transactionSchema = z.object({
  date: z.date(),
  description: z.string().min(1),
  amount: z.number(),
  categoryId: z.string().optional(),
  type: z.enum(['pix_sent', 'pix_received', 'payment']),
});
```

**Subtasks:**
- [ ] Criar schemas para todas APIs
- [ ] Validação no request handler
- [ ] Error responses padronizadas
- [ ] Testes de validação

#### Task 3.2: Logging Estruturado
```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

// Usage
logger.info({ userId, action: 'login' });
```

**Subtasks:**
- [ ] Setup Pino ou Winston
- [ ] Log levels (info, warn, error)
- [ ] Correlação de requests
- [ ] Logs de segurança

#### Task 3.3: Error Handling Centralizado
```typescript
// src/lib/error-handler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
  }
}

// Usage em API routes
try {
  // Business logic
} catch (error) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.statusCode }
    );
  }
  logger.error(error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

**Subtasks:**
- [ ] Criar classe AppError
- [ ] Middleware de error handling
- [ ] Respostas padronizadas
- [ ] Testes de error cases

### **Semana 4-5: Observabilidade 🔍**

#### Task 4.1: Error Tracking (Sentry)
```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Subtasks:**
- [ ] Setup Sentry
- [ ] Integração com API routes
- [ ] Integração com components
- [ ] Alertas para erros críticos

#### Task 4.2: Performance Monitoring
```typescript
// Adicionar Web Vitals
import { reportWebVitals } from 'next/vitals';

reportWebVitals(metric => {
  console.log(metric); // LCP, FID, CLS, etc
});
```

**Subtasks:**
- [ ] Setup Web Vitals monitoring
- [ ] Database query performance
- [ ] API response times
- [ ] Bundle size analysis

#### Task 4.3: Audit Logging
```typescript
// src/lib/audit.ts
export async function auditLog(
  userId: string,
  action: string,
  resource: string,
  details: object
) {
  await prisma.auditLog.create({
    data: { userId, action, resource, details },
  });
}
```

**Subtasks:**
- [ ] Criar modelo AuditLog
- [ ] Log todas operações sensíveis
- [ ] Retenção de logs (30+ dias)
- [ ] Relatórios de auditoria

### **Semana 5-6: Features Novas 🚀**

#### Task 5.1: Sincronização Melhorada com Inter
```typescript
// src/lib/inter-sync.ts - MELHORIAS
- Detectar transações duplicadas com ML
- Reconciliação automática
- Retry com exponential backoff
- Notificações de sync
```

**Subtasks:**
- [ ] Algoritmo de deduplicação inteligente
- [ ] Histórico de sincronizações
- [ ] Webhook do Inter (quando disponível)
- [ ] Testes de concorrência

#### Task 5.2: Alertas e Notificações
```typescript
// src/lib/notifications.ts
export async function sendAlert(
  userId: string,
  type: 'spending_limit' | 'large_transaction' | 'failed_sync'
) {
  // Email + in-app notification
}
```

**Subtasks:**
- [ ] Setup de email (SendGrid, Resend)
- [ ] In-app notifications
- [ ] Configuração de alertas por usuário
- [ ] Testes de notificações

#### Task 5.3: Exportação de Dados
```typescript
// src/app/api/export/[format]/route.ts
// Suportar: CSV, PDF, Excel
```

**Subtasks:**
- [ ] Exportar CSV de transações
- [ ] Gerar PDFs de relatórios
- [ ] Agendamento de exports
- [ ] Testes de imports/exports

#### Task 5.4: Dashboard Customizável
```typescript
// Adicionar widgets personalizáveis
// Reordenação de gráficos
// Filters salvos por usuário
```

**Subtasks:**
- [ ] Modelo Dashboard customizado
- [ ] Drag & drop widgets
- [ ] Salvar preferências
- [ ] Presets de dashboard

### **Semana 6-7: Performance 🚄**

#### Task 6.1: Otimização de Database
```sql
-- Criar índices nas queries frequentes
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_userId ON transactions(userId);
CREATE INDEX idx_categories_name ON categories(name);
```

**Subtasks:**
- [ ] Análise de query plans
- [ ] Criação de índices
- [ ] Otimização de N+1 queries
- [ ] Testes de performance

#### Task 6.2: Caching Strategy
```typescript
// src/lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCategoryStats = unstable_cache(
  async (userId: string) => {
    return prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId },
      _sum: { amount: true },
    });
  },
  ['category-stats'],
  { revalidate: 3600 } // 1 hour
);
```

**Subtasks:**
- [ ] Implementar caching de dados estáticos
- [ ] Cache de API responses
- [ ] Invalidação de cache
- [ ] Testes de cache

#### Task 6.3: Code Splitting
```typescript
// src/components/Charts/index.ts
export const TopExpensesChart = dynamic(
  () => import('./TopExpensesChart'),
  { loading: () => <Skeleton /> }
);
```

**Subtasks:**
- [ ] Lazy load componentes pesados
- [ ] Análise com bundle analyzer
- [ ] Otimização de imports
- [ ] Teste de Lighthouse

### **Semana 7-8: Produção 🏭**

#### Task 7.1: Migração SQLite → PostgreSQL
```bash
# Backup SQLite
npm run db:backup

# Setup PostgreSQL
docker run -d -e POSTGRES_PASSWORD=secret postgres

# Migrate data
npm run db:migrate -- postgresql://...
```

**Subtasks:**
- [ ] Setup PostgreSQL
- [ ] Script de migração de dados
- [ ] Validação de dados
- [ ] Rollback strategy

#### Task 7.2: Docker + Compose
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Subtasks:**
- [ ] Criar Dockerfile otimizado
- [ ] Docker Compose com DB
- [ ] Volumes para dados
- [ ] Health checks

#### Task 7.3: CI/CD com GitHub Actions
```yaml
# .github/workflows/test-deploy.yml
name: Test & Deploy
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run lint
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: npm run build
      - run: docker push ...
```

**Subtasks:**
- [ ] Setup GitHub Actions
- [ ] Testes automáticos
- [ ] Build automático
- [ ] Deploy para staging
- [ ] Deploy para produção

#### Task 7.4: Backup & Disaster Recovery
```typescript
// src/scripts/backup-database.ts
// Backup automático diário
// Retenção de 30 dias
// Testes mensais de restore
```

**Subtasks:**
- [ ] Backup automático
- [ ] Testes de restore
- [ ] Documentação de DR
- [ ] Runbooks de emergência

---

## 🔧 Stack Recomendado (Adições)

| Funcionalidade | Biblioteca | Razão |
|---|---|---|
| Testing | Vitest | Mais rápido que Jest, melhor TypeScript |
| E2E Tests | Playwright | Melhor que Cypress, suporta múltiplos browsers |
| Error Tracking | Sentry | Melhor observabilidade, free tier |
| Logging | Pino | Mais rápido que Winston, estruturado |
| Validation | Zod | TypeScript-first, excelente DX |
| Email | SendGrid/Resend | Confiáveis, bom suporte |
| Database | PostgreSQL | Mais robusto que SQLite, pronto para produção |
| Cache | Redis | Opcional, melhora performance |
| Docker | Docker Compose | Fácil local dev e produção |

---

## 📊 Métricas de Sucesso

### Fase 1: Segurança
- [ ] 0 certificados em Git
- [ ] Rate limit ativo em 100% das APIs
- [ ] Security headers presentes
- [ ] Zod validation em 100% das APIs

### Fase 2: Testes
- [ ] ≥ 70% code coverage
- [ ] 0 testes falhando
- [ ] E2E tests para fluxos críticos
- [ ] Todas APIs com testes

### Fase 3: Observabilidade
- [ ] 100% das exceções rastreadas
- [ ] Logs estruturados
- [ ] Auditoria de ações críticas
- [ ] Alertas configurados

### Fase 4: Performance
- [ ] Lighthouse score ≥ 90
- [ ] API response time < 200ms (p95)
- [ ] Database queries < 100ms
- [ ] Bundle size < 200KB (main)

### Fase 5: Produção
- [ ] Zero downtime deployments
- [ ] Backup strategy testada
- [ ] Disaster recovery documentado
- [ ] SLA 99.9% uptime

---

## 🎯 Assignação de Agentes

| Fase | Tasks | Agent Principal | Agent Suporte |
|-----|-------|-----------------|--------------|
| 1 | Segurança | @dev | @architect |
| 2 | Testes | @qa | @dev |
| 3 | Observabilidade | @dev | @architect |
| 4 | Performance | @architect | @data-engineer |
| 5 | Produção | @devops | @architect |

---

## 📚 Documentação a Criar

1. **API Documentation**
   - OpenAPI/Swagger spec
   - Autenticação e autorização
   - Rate limiting details
   - Error codes

2. **Architecture Decision Records (ADRs)**
   - Por que PostgreSQL vs SQLite
   - Por que Vitest vs Jest
   - Por que Redis para cache
   - Pattern decisions

3. **Runbooks**
   - Como fazer backup
   - Como restaurar database
   - Como escalar
   - Emergency procedures

4. **Development Guide**
   - Setup local
   - Scripts úteis
   - Padrões de código
   - Contribuição

---

## 🚦 Timeline

```
Semana 1-2: Segurança Crítica (40 pontos)
├─ Certificados → .env
├─ Rate limiting
├─ Security headers
└─ Zod validation

Semana 2-3: Testes (60 pontos)
├─ Setup Vitest
├─ Unit tests
├─ API tests
└─ E2E tests

Semana 3-4: Observabilidade (30 pontos)
├─ Sentry
├─ Logging
└─ Audit trail

Semana 5-6: Features (50 pontos)
├─ Inter sync melhorado
├─ Alertas
├─ Exportação
└─ Dashboard customizável

Semana 6-7: Performance (40 pontos)
├─ Database optimization
├─ Caching
└─ Code splitting

Semana 7-8: Produção (50 pontos)
├─ PostgreSQL
├─ Docker
├─ CI/CD
└─ Backup/DR

TOTAL: ~270 story points / 8 semanas
AVG: ~33 pontos/semana
```

---

## 🎓 Aprendizados Recomendados

Para implementar este plano, recomendo estudar:

1. **Security**
   - OWASP Top 10
   - Next.js security best practices
   - JWT and authentication patterns

2. **Testing**
   - Test-Driven Development (TDD)
   - Testing Trophy
   - Mocking and fixtures

3. **Database**
   - SQL optimization
   - Indexing strategies
   - Query planning

4. **DevOps**
   - Docker basics
   - GitHub Actions
   - Database migrations

---

## ✅ Próximos Passos

1. **Esta semana:**
   - [ ] Revisar este documento
   - [ ] Priorizar tasks (MVP)
   - [ ] Alocar recursos
   - [ ] Criar histórias no backlog

2. **Próxima semana:**
   - [ ] Começar Fase 1 (Segurança)
   - [ ] Setup Vitest (preps para testes)
   - [ ] Criar repositório de tasks

3. **Este mês:**
   - [ ] Completar Fases 1-2
   - [ ] Ter 70%+ cobertura de testes
   - [ ] Zod validation 100%

4. **Este trimestre:**
   - [ ] Todas 5 fases completas
   - [ ] Deploy em produção
   - [ ] SLA 99.9% uptime

---

**Status:** Pronto para Implementação
**Arquiteto:** Aria 🏛️
**Data:** 2026-02-20
**Confidencialidade:** Internal Only
