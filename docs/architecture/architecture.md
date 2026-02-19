# FinDash — Documento de Arquitetura

**Versão:** 1.0.0
**Data:** 2026-02-19
**Autor:** @architect (Aria)
**PRD Ref:** FinDash PRD v1.0.0

---

## 1. Tech Stack

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Framework** | Next.js 16 (App Router) | SSR, API Routes, performance |
| **Linguagem** | TypeScript (strict) | Type safety |
| **Estilização** | Tailwind CSS 4 | Utility-first, tema escuro |
| **Charts** | Recharts | Gráficos interativos e responsivos |
| **Banco de Dados** | SQLite via Prisma | Self-hosted, zero config |
| **Auth** | NextAuth.js v4 (Credentials) | JWT, proteção de rotas |
| **Ícones** | Lucide React | Modernos, tree-shakeable |

---

## 2. Modelo de Dados

```
User (auth)
Category (categorias de gastos)
FixedCost (custos fixos recorrentes)
Transaction (extrato bancário)
CardTransaction (faturas cartão)
Setting (configurações)
```

---

## 3. Estrutura do Projeto

```
findash/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── docs/
│   ├── prd/
│   ├── architecture/
│   ├── changelog/
│   └── stories/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx (Dashboard)
│   │   │   ├── custos-fixos/
│   │   │   ├── transacoes/
│   │   │   ├── faturas/
│   │   │   └── configuracoes/
│   │   ├── login/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── fixed-costs/
│   │   │   ├── transactions/
│   │   │   ├── card-transactions/
│   │   │   └── categories/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── charts/
│   │   └── shared/
│   └── lib/
│       ├── prisma.ts
│       ├── auth.ts
│       └── utils.ts
└── package.json
```

---

*Documento gerado pelo @architect Aria — Synkra AIOS v4.2*
