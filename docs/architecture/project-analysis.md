# Análise de Arquitetura do Projeto: Findash

**Gerado:** 2026-02-20
**Gerado Por:** @architect (Aria)
**Análise:** Brownfield Discovery (Fase 1)

---

## 📊 Resumo Executivo

O **Findash** é uma aplicação de **gestão financeira pessoal** construída com Next.js, focada em agregação de dados bancários, análise de despesas e visualização de padrões de gastos. O projeto possui uma **arquitetura moderna bem estruturada**, porém com **gaps críticos em testes, segurança de API e documentação**.

---

## 🏗️ Estrutura do Projeto

| Aspecto | Valor |
|--------|-------|
| **Framework Principal** | Next.js 16.1.6 (App Router) |
| **Linguagem Primária** | TypeScript 100% |
| **Frontend** | React 19 + TailwindCSS v4 |
| **Backend** | Next.js API Routes + Middleware |
| **Database** | SQLite + Prisma ORM v6.19.2 |
| **Autenticação** | NextAuth.js v4.24.13 + JWT |
| **State Management** | Zustand |
| **Testing Framework** | ❌ **NENHUM DETECTADO** |
| **CI/CD** | ❌ Não configurado |
| **Node Version** | 18+ (implícito) |

---

## 📁 Arquitetura de Diretórios

```
findash/
├── src/
│   ├── app/                          # App Router (Next.js 13+)
│   │   ├── (dashboard)/              # Layout privado (autenticado)
│   │   │   ├── page.tsx              # Dashboard principal
│   │   │   ├── transacoes/page.tsx   # Listagem de transações
│   │   │   ├── faturas/page.tsx      # Faturas de cartão
│   │   │   └── custos-fixos/page.tsx # Gestão de custos fixos
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/[...nextauth]/   # NextAuth endpoints
│   │   │   ├── transactions/         # CRUD de transações
│   │   │   ├── card-transactions/    # CRUD de transações de cartão
│   │   │   ├── categories/           # CRUD de categorias
│   │   │   ├── fixed-costs/          # CRUD de custos fixos
│   │   │   ├── inter/                # Integração com Banco Inter
│   │   │   │   ├── sync/             # Sincronizar extrato bancário
│   │   │   │   ├── status/           # Status da integração
│   │   │   │   └── dedup/            # Deduplicação de transações
│   │   │   ├── dashboard/            # Dados agregados para dashboard
│   │   │   └── drilldown/            # Drilldown para gráficos
│   │   ├── login/page.tsx            # Página de login
│   │   ├── layout.tsx                # Root layout
│   │   ├── providers.tsx             # Providers (Theme, Auth, etc)
│   │   └── middleware.ts             # Middleware de proteção
│   ├── lib/                          # Utilitários compartilhados
│   │   ├── auth.ts                   # Configuração NextAuth
│   │   ├── prisma.ts                 # Cliente Prisma singleton
│   │   ├── inter-api.ts              # Cliente HTTP para Banco Inter
│   │   ├── inter-sync.ts             # Lógica de sincronização
│   │   └── utils.ts                  # Helper functions
│   ├── components/                   # Componentes React
│   │   ├── charts/                   # Gráficos (Recharts)
│   │   │   ├── AdsSpendChart.tsx
│   │   │   ├── CategoryPieChart.tsx
│   │   │   ├── RevenueExpenseChart.tsx
│   │   │   ├── TopExpensesChart.tsx
│   │   │   └── FixedVsVariableChart.tsx
│   │   └── shared/                   # Componentes reutilizáveis
│   │       ├── Sidebar.tsx
│   │       ├── DateRangeFilter.tsx
│   │       ├── DrillDownPanel.tsx
│   │       └── PageLoading.tsx
│   ├── contexts/                     # React Contexts
│   │   └── ThemeContext.tsx          # Tema escuro/claro
│   └── hooks/                        # Custom React Hooks
│       └── useChartTheme.ts
├── prisma/                           # Schema + migrations
│   ├── schema.prisma                 # Data model
│   └── seed.ts                       # Seed script
├── .aios-core/                       # Framework AIOS
│   ├── infrastructure/               # Integração e infraestrutura
│   │   ├── integrations/
│   │   │   ├── ai-providers/         # Integrações com LLMs
│   │   │   ├── pm-adapters/          # Adaptadores Project Management
│   │   │   └── gemini-extensions/    # Extensões Google Gemini
│   │   └── scripts/
│   ├── development/
│   └── [outras pastas]
├── docs/                             # Documentação
└── certs/                            # 🔴 Certificados digitais (Inter mTLS)
```

---

## 🔌 Integrações Principais

### 1️⃣ **Banco Inter (Banco Digital)**
- **Propósito:** Agregar transações e faturas de cartão de crédito
- **Autenticação:** OAuth2 + mTLS (certificado digital em `/certs/`)
- **Endpoints:**
  - `POST /api/inter/sync/` → Sincroniza extrato bancário
  - `GET /api/inter/status/` → Status da integração
  - `POST /api/inter/dedup/` → Deduplicação inteligente de transações
- **Segurança:** Usa HTTPS com certificado cliente (mTLS)
- **Risco:** ⚠️ Certificados em repositório Git (potencial exposição)

### 2️⃣ **NextAuth.js (Autenticação)**
- **Estratégia:** JWT + Credentials Provider (email/senha)
- **Hash:** bcryptjs para senhas
- **Sessão:** Stateless (JWT)
- **Callback Customizado:** Adiciona `user.id` ao token
- **Páginas Customizadas:** Redirecionamento para `/login`

### 3️⃣ **Prisma ORM (Acesso a Dados)**
- **Database:** SQLite (dev.db)
- **Models:** User, Category, Transaction, CardTransaction, FixedCost, Setting
- **Relacionamentos:** 1-N entre User-Transactions e Category-Transactions
- **Migrations:** Gerenciadas com `prisma migrate`

### 4️⃣ **AIOS Framework (AI Orchestration)**
- **AI Providers:** Claude, Gemini, DeepSeek
- **PM Adapters:** GitHub, Jira, ClickUp
- **Status:** Em fase de integração (templates e estrutura presentes)

---

## 📚 Modelos de Dados

### User
```typescript
id: String @id @default(cuid())
email: String @unique
password: String (bcryptjs)
name: String
createdAt: DateTime @default(now())
```

### Category
```typescript
id: String @id
name: String @unique
color: String (hex color)
icon: String (lucide icon name)
type: String ("expense" | "income")
createdAt: DateTime
```

### Transaction (Banco)
```typescript
id: String @id
date: DateTime
description: String
amount: Float (+ = entrada, - = saída)
balance: Float? (saldo após transação)
type: String ("pix_sent" | "pix_received" | "payment" | "tax" | "other")
categoryId: String? (ForeignKey)
recipient: String?
source: String ("bank_extract" | "manual")
createdAt: DateTime
```

### CardTransaction (Cartão de Crédito)
```typescript
id: String @id
date: DateTime
description: String
amount: Float (- = débito, + = crédito)
card: String? (últimos 4 dígitos)
categoryId: String? (ForeignKey)
cardCategory: String? (categoria do Inter: SERVICOS, COMPRAS, etc)
type: String? ("Compra à vista" | "Parcela X/Y")
invoiceMonth: String ("2025-12", "2026-01", etc)
source: String ("card_invoice" | "manual")
createdAt: DateTime
```

### FixedCost (Custos Recorrentes)
```typescript
id: String @id
name: String
amount: Float
categoryId: String (ForeignKey)
subcategory: String? ("Funcionários", "Ferramentas", etc)
recurrence: String ("monthly" | "annual" | "quarterly")
renewalDate: String? ("Jan", "Set" para anuais)
notes: String?
active: Boolean @default(true)
startDate: DateTime
createdAt: DateTime
updatedAt: DateTime @updatedAt
```

---

## 🎨 Stack Frontend

| Componente | Lib | Versão |
|-----------|-----|---------|
| **Framework** | Next.js | 16.1.6 |
| **Biblioteca UI** | React | 19.2.3 |
| **Styling** | TailwindCSS | v4 |
| **Gráficos** | Recharts | 3.7.0 |
| **Ícones** | Lucide React | 0.575.0 |
| **Animações** | Framer Motion | 12.34.2 |
| **Estado Global** | Zustand | 5.0.11 |
| **Parsing** | PapaParse | 5.5.3 |
| **Validação** | Zod | 4.3.6 |

---

## ⚙️ Stack Backend

| Componente | Lib | Versão |
|-----------|-----|---------|
| **Runtime** | Node.js | 18+ (implícito) |
| **Framework** | Next.js API Routes | 16.1.6 |
| **ORM** | Prisma | 6.19.2 |
| **Database** | SQLite | 3.x |
| **Autenticação** | NextAuth.js | 4.24.13 |
| **Hash** | bcryptjs | 3.0.3 |
| **Date Utils** | date-fns | 4.1.0 |
| **Scripts** | tsx | 4.21.0 |

---

## 📊 Padrões de Código Detectados

### ✅ Boas Práticas Implementadas

1. **TypeScript Full Stack**
   - 100% dos arquivos em TypeScript
   - Tipos bem definidos para API responses
   - Interfaces para modelos de dados

2. **Autenticação Robusta**
   - NextAuth.js com JWT
   - Middleware de proteção de rotas
   - Passwords hasheadas com bcryptjs
   - Separated credentials (não tokens em cookies inseguros)

3. **Estrutura de Pastas Organizada**
   - Separação clara entre app, lib, components, contexts
   - Componentes reutilizáveis
   - Utilitários centralizados

4. **ORM Moderno**
   - Prisma para type-safe database queries
   - Migrations versionadas
   - Seed scripts para dados iniciais

5. **UI/UX Moderna**
   - Temas escuro/claro (ThemeContext)
   - Gráficos interativos (Recharts)
   - Carregamentos elegantes (Framer Motion)
   - Responsivo (TailwindCSS v4)

### ❌ Lacunas Críticas Identificadas

1. **❌ ZERO Testes**
   - Nenhum arquivo de teste detectado
   - Sem Jest, Vitest ou Playwright configurados
   - Sem cobertura de código

2. **❌ Falta de Rate Limiting**
   - API routes sem proteção contra abuso
   - Sem implementação de throttling
   - Sincronização com Inter sem limite de requisições

3. **❌ Sem Security Headers Explícitos**
   - Sem next.config.ts configurado para headers
   - Potencial para XSS, Clickjacking, etc
   - CORS não explicitamente configurado

4. **❌ Certificados em Git**
   - `/certs/` contém certificados digitais do Inter
   - Risco de exposição se repositório ficar público
   - Secrets não versionados corretamente

5. **❌ Sem Logging/Monitoring**
   - console.error apenas em algumas rotas
   - Sem traçamento de requisições
   - Sem alertas de falhas

6. **❌ Validação de Input Incompleta**
   - Alguns endpoints sem validação Zod
   - Potencial para SQL injection (mitigado por Prisma)
   - Falta de sanitização de entrada

7. **⚠️ API Route Error Handling**
   - Algumas rotas sem try-catch
   - Respostas de erro inconsistentes
   - Sem tratamento de timeout

8. **⚠️ Database Migrations**
   - SQLite limitado para produção
   - Sem backup strategy documentada
   - Sem indices otimizados

---

## 🔐 Avaliação de Segurança

### 🔴 Crítico

| Problema | Severidade | Recomendação |
|---------|-----------|--------------|
| **Certificados em Git** | CRÍTICO | Mover para `.env` ou Secret Manager |
| **Sem testes de segurança** | CRÍTICO | Implementar OWASP Top 10 checks |
| **API sem rate limiting** | CRÍTICO | Implementar middleware rate-limit |

### 🟠 Alto

| Problema | Severidade | Recomendação |
|---------|-----------|--------------|
| **Sem Security Headers** | ALTO | Configurar CSP, X-Frame-Options, etc |
| **Input validation incompleta** | ALTO | Adicionar Zod validation a todas APIs |
| **Sem logging de segurança** | ALTO | Implementar audit trail |
| **Senhas em SQLite** | ALTO | Garantir bcryptjs usado em toda parte |

### 🟡 Médio

| Problema | Severidade | Recomendação |
|---------|-----------|--------------|
| **Sem CSRF protection explícito** | MÉDIO | Verificar NextAuth CSRF (padrão) |
| **Sem SQL injection protection logging** | MÉDIO | Usar Prisma (já faz isso) |
| **Erro messages verbosos** | MÉDIO | Sanitizar mensagens de erro |

---

## 📈 Recomendações de Melhoria

### Fase 1: Segurança (Crítico)
- [ ] Mover certificados para `.env`
- [ ] Implementar rate limiting (middleware)
- [ ] Adicionar security headers (Next.js config)
- [ ] Validação com Zod em todas APIs

### Fase 2: Testing (Alto)
- [ ] Setup Vitest para unit tests
- [ ] Adicionar testes para auth
- [ ] Testes de integração para Inter API
- [ ] E2E tests com Playwright

### Fase 3: Observability (Médio)
- [ ] Implementar logging estruturado
- [ ] Adicionar error tracking (Sentry)
- [ ] Metrics/monitoring básico
- [ ] Audit trail para operações sensíveis

### Fase 4: Performance (Médio)
- [ ] Análise de índices no Prisma
- [ ] Caching de queries frequentes
- [ ] CDN para assets estáticos
- [ ] Otimização de bundla (Next.js analyzer)

### Fase 5: Produção (Baixo)
- [ ] Migrar SQLite → PostgreSQL/MySQL
- [ ] Setup Docker + Docker Compose
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Backup strategy para database

---

## 📋 Checklist de Qualidade

| Aspecto | Status | Prioridade |
|--------|--------|-----------|
| Testes Unitários | ❌ 0% | 🔴 CRÍTICO |
| Testes Integração | ❌ 0% | 🔴 CRÍTICO |
| Testes E2E | ❌ 0% | 🟠 ALTO |
| Cobertura de Código | ❌ 0% | 🔴 CRÍTICO |
| Segurança (OWASP) | 🟠 ~40% | 🔴 CRÍTICO |
| Documentação API | 🟡 ~50% | 🟠 ALTO |
| Performance Audit | ❌ 0% | 🟡 MÉDIO |
| Monitoring/Logging | ❌ 0% | 🟡 MÉDIO |
| Docker Ready | ❌ 0% | 🟡 MÉDIO |
| CI/CD Setup | ❌ 0% | 🟡 MÉDIO |

---

## 🎯 Próximos Passos

1. **Imediato:** Revisar documento de abordagem recomendada
2. **Esta semana:** Implementar rate limiting + security headers
3. **Este mês:** Setup de testes + move certificados
4. **Este trimestre:** Testing completo + observability
5. **Produção:** Migração de banco + deployment strategy

---

**Status:** Pronto para Review
**Arquiteto:** Aria 🏛️
**Data:** 2026-02-20
