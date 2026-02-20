import { z } from "zod";

// ═══════════════════════════════════════════════════
// SCHEMAS DE VALIDAÇÃO PARA APIS
// ═══════════════════════════════════════════════════

// Inter Sync - Sincronização com Banco Inter
export const interSyncSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
});

export type InterSyncRequest = z.infer<typeof interSyncSchema>;

// Transações - Create/Update
export const transactionSchema = z.object({
  date: z.string().datetime(),
  description: z.string().min(1).max(500),
  amount: z.number(),
  type: z.enum([
    "pix_sent",
    "pix_received",
    "payment",
    "application",
    "tax",
    "other",
  ]),
  categoryId: z.string().optional(),
  recipient: z.string().max(255).optional(),
});

export type TransactionRequest = z.infer<typeof transactionSchema>;

// Categorias - Create/Update
export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().max(50),
  type: z.enum(["expense", "income"]),
});

export type CategoryRequest = z.infer<typeof categorySchema>;

// Fixed Costs - Create/Update
export const fixedCostSchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number().positive(),
  categoryId: z.string(),
  subcategory: z.string().max(100).optional(),
  recurrence: z.enum(["monthly", "annual", "quarterly"]),
  renewalDate: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export type FixedCostRequest = z.infer<typeof fixedCostSchema>;

// Dashboard Query Params
export const dashboardQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
