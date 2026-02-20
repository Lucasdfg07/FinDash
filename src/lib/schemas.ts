import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

// ═══════════════════════════════════════════════════
// SCHEMAS DE VALIDAÇÃO PARA APIS
// ═══════════════════════════════════════════════════

// Helper para sanitizar e validar strings
const sanitizeString = (value: string) => {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }).trim();
};

// Inter Sync - Sincronização com Banco Inter
export const interSyncSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
});

export type InterSyncRequest = z.infer<typeof interSyncSchema>;

// Transações - Create/Update
export const transactionSchema = z.object({
  date: z.string().datetime(),
  description: z.string().min(1).max(500).transform(sanitizeString),
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
  recipient: z.string().max(255).optional().transform(val => val ? sanitizeString(val) : undefined),
});

export type TransactionRequest = z.infer<typeof transactionSchema>;

// Categorias - Create/Update
export const categorySchema = z.object({
  name: z.string().min(1).max(100).transform(sanitizeString),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().max(50).transform(sanitizeString),
  type: z.enum(["expense", "income"]),
});

export type CategoryRequest = z.infer<typeof categorySchema>;

// Fixed Costs - Create/Update
export const fixedCostSchema = z.object({
  name: z.string().min(1).max(255).transform(sanitizeString),
  amount: z.number().positive(),
  categoryId: z.string(),
  subcategory: z.string().max(100).optional().transform(val => val ? sanitizeString(val) : undefined),
  recurrence: z.enum(["monthly", "annual", "quarterly"]),
  renewalDate: z.string().max(50).optional().transform(val => val ? sanitizeString(val) : undefined),
  notes: z.string().max(500).optional().transform(val => val ? sanitizeString(val) : undefined),
});

export type FixedCostRequest = z.infer<typeof fixedCostSchema>;

// Dashboard Query Params
export const dashboardQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
