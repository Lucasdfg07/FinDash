# FinDash — Product Requirements Document (PRD)

**Versão:** 1.0.0
**Status:** Draft
**Data:** 2026-02-19
**Autor:** @pm (Morgan)
**Método:** AIOS Elicitation-Driven

---

## 1. Goals & Background Context

### 1.1 Goals

- Dashboard financeiro conectado ao Banco Inter (visualização somente)
- Cálculo e visualização de ROAS total do negócio
- Transparência completa: receitas, despesas, ads, custos fixos/variáveis
- Gestão de custos fixos por categorias (Funcionários, Ferramentas, etc.)
- Gráficos visuais detalhados de todos os aspectos financeiros

### 1.2 Background Context

O negócio utiliza o Banco Inter como conta principal. A receita principal vem da Launch Pad (sociedade de crédito). Os maiores gastos são em Meta Ads (Facebook), Google Ads, funcionários e ferramentas SaaS. O dashboard precisa consolidar dados de extrato bancário e faturas de cartão para dar visibilidade total do ROAS e saúde financeira.

### 1.3 Non-Goals

- **NÃO** é integração direta com API do Inter (dados importados via CSV)
- **NÃO** permite transações financeiras (somente visualização)
- **NÃO** é multi-tenant/SaaS
- **NÃO** tem previsões financeiras com IA (v1)

---

## 2. Functional Requirements

### FR-001: Dashboard Principal (P0)
- KPIs: ROAS, Receita Total, Investimento Ads, Saldo Atual
- Gráfico: Receita vs Despesas por mês
- Gráfico: Investimento Meta Ads vs Google Ads por mês
- Gráfico: Custos Fixos vs Variáveis
- Gráfico: Gastos por Categoria (pizza)
- Top 10 maiores saídas e entradas

### FR-002: Custos Fixos (P0)
- CRUD completo de custos fixos
- Categorização: Funcionários, Ferramentas, Hospedagem, etc.
- Recorrência: Mensal, Anual, Trimestral
- Ativar/Desativar custos
- Agrupamento visual por subcategoria

### FR-003: Extrato Bancário (P0)
- Listagem de todas as transações
- Filtros por tipo (Pix, Pagamento, Aplicação, etc.)
- Busca por descrição/destinatário
- Totais de entradas/saídas

### FR-004: Faturas do Cartão (P0)
- Listagem agrupada por mês de fatura
- Identificação automática de Meta Ads e Google Ads
- Totais por fatura
- Filtros e busca

### FR-005: Autenticação (P0)
- Login com email/senha
- Sessão JWT
- Proteção de todas as rotas

---

## 3. Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript (strict) |
| Estilização | Tailwind CSS 4 |
| Charts | Recharts |
| Banco de Dados | SQLite via Prisma |
| Auth | NextAuth.js v4 (JWT) |
| Estado | React hooks |
| Ícones | Lucide React |

---

*PRD gerado pelo @pm Morgan — Synkra AIOS v4.2*
