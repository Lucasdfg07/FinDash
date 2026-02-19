/**
 * Serviço de sincronização: Inter API → Banco de dados local
 * 
 * Busca transações do extrato e faturas do cartão no Inter
 * e salva/atualiza no banco de dados local (SQLite via Prisma)
 */

import { PrismaClient } from "@prisma/client";
import {
  getExtrato,
  getFaturas,
  getSaldo,
  InterTransacao,
  InterFaturaTransacao,
} from "./inter-api";
import { addDays, differenceInDays, format, min as minDate } from "date-fns";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════
// MAPEAMENTO DE CATEGORIAS
// ═══════════════════════════════════════════════════

/**
 * Mapeia o tipo de transação do Inter para um tipo interno
 */
function mapTransactionType(tipoTransacao: string, tipoOperacao: string): string {
  const tipo = tipoTransacao.toUpperCase();

  if (tipo.includes("PIX")) {
    return tipoOperacao === "C" ? "pix_received" : "pix_sent";
  }
  if (tipo.includes("PAGAMENTO") || tipo.includes("PAG")) {
    return "payment";
  }
  if (tipo.includes("APLICACAO") || tipo.includes("INVESTIMENTO")) {
    return "application";
  }
  if (tipo.includes("IOF") || tipo.includes("TARIFA") || tipo.includes("TAXA")) {
    return "tax";
  }
  if (tipo.includes("TED") || tipo.includes("DOC") || tipo.includes("TRANSFERENCIA")) {
    return tipoOperacao === "C" ? "pix_received" : "pix_sent";
  }

  return "other";
}

/**
 * Tenta encontrar ou criar uma categoria baseada na descrição
 */
async function findOrCreateCategory(
  description: string,
  type: "expense" | "income"
): Promise<string | null> {
  // Mapeamento básico de palavras-chave para categorias
  const categoryMap: Record<string, string> = {
    // Receitas
    "VENDA": "Vendas",
    "RECEITA": "Vendas",
    "CLIENTE": "Vendas",
    "SHOPIFY": "Vendas",
    "MERCADO PAGO": "Vendas",

    // Marketing
    "META": "Marketing",
    "FACEBOOK": "Marketing",
    "GOOGLE ADS": "Marketing",
    "INSTAGRAM": "Marketing",
    "TIKTOK": "Marketing",

    // Ferramentas
    "OPENAI": "Ferramentas e Software",
    "GITHUB": "Ferramentas e Software",
    "VERCEL": "Ferramentas e Software",
    "AWS": "Ferramentas e Software",
    "HEROKU": "Ferramentas e Software",
    "NETLIFY": "Ferramentas e Software",
    "STRIPE": "Ferramentas e Software",

    // Alimentação
    "IFOOD": "Alimentação",
    "UBER EATS": "Alimentação",
    "RESTAURANTE": "Alimentação",
    "PADARIA": "Alimentação",
    "SUPERMERCADO": "Alimentação",
    "MERCADO": "Alimentação",

    // Transporte
    "UBER": "Transporte",
    "99": "Transporte",
    "COMBUSTIVEL": "Transporte",
    "POSTO": "Transporte",

    // Impostos
    "DARF": "Impostos",
    "SIMPLES": "Impostos",
    "DAS": "Impostos",
    "ICMS": "Impostos",
    "IOF": "Impostos",
    "TARIFA": "Taxas Bancárias",
  };

  const upperDesc = description.toUpperCase();

  for (const [keyword, categoryName] of Object.entries(categoryMap)) {
    if (upperDesc.includes(keyword)) {
      // Busca ou cria a categoria
      let category = await prisma.category.findFirst({
        where: { name: categoryName },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryName,
            type: type,
            color: type === "income" ? "#22c55e" : "#ef4444",
            icon: "folder",
          },
        });
      }

      return category.id;
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════
// SYNC EXTRATO (Transações bancárias)
// ═══════════════════════════════════════════════════

export interface SyncResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
}

/**
 * Divide o período em janelas de no máximo 90 dias
 * (limitação da API do Inter)
 */
function splitDateRange(
  dataInicio: string,
  dataFim: string
): Array<{ inicio: string; fim: string }> {
  const MAX_DAYS = 89; // API permite no máximo 90 dias
  const ranges: Array<{ inicio: string; fim: string }> = [];

  let current = new Date(dataInicio + "T00:00:00");
  const end = new Date(dataFim + "T00:00:00");

  while (differenceInDays(end, current) > 0) {
    const windowEnd = minDate([addDays(current, MAX_DAYS), end]);
    ranges.push({
      inicio: format(current, "yyyy-MM-dd"),
      fim: format(windowEnd, "yyyy-MM-dd"),
    });
    current = addDays(windowEnd, 1);
  }

  return ranges;
}

export async function syncExtrato(
  dataInicio: string,
  dataFim: string
): Promise<SyncResult> {
  const result: SyncResult = { total: 0, created: 0, skipped: 0, errors: 0 };

  try {
    // Divide em janelas de 90 dias (limitação da API do Inter)
    const ranges = splitDateRange(dataInicio, dataFim);
    console.log(
      `[Inter Sync] Extrato dividido em ${ranges.length} janela(s):`,
      ranges
    );

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];

      // Delay entre janelas para evitar rate limit (429)
      if (i > 0) {
        console.log("[Inter Sync] Aguardando 5s entre janelas...");
        await new Promise((r) => setTimeout(r, 5000));
      }

      try {
        const transacoes = await getExtrato(range.inicio, range.fim);
        result.total += transacoes.length;

        for (const t of transacoes) {
          try {
            await processTransaction(t);
            result.created++;
          } catch {
            // Se já existe (duplicada), conta como skipped
            result.skipped++;
          }
        }
      } catch (err) {
        console.error(
          `Erro ao buscar extrato ${range.inicio} - ${range.fim}:`,
          err
        );
        result.errors++;
      }
    }
  } catch (err) {
    console.error("Erro ao sincronizar extrato:", err);
    throw err;
  }

  return result;
}

async function processTransaction(t: InterTransacao): Promise<void> {
  const valor = parseFloat(t.valor);
  const amount = t.tipoOperacao === "D" ? -Math.abs(valor) : Math.abs(valor);
  const type = mapTransactionType(t.tipoTransacao, t.tipoOperacao);
  const date = new Date(t.dataEntrada + "T12:00:00Z");

  // ──────────────────────────────────────────────
  // DEDUPLICAÇÃO INTELIGENTE
  // A API do Inter pode retornar a mesma transação com:
  //  - datas ligeiramente diferentes (data operação vs data entrada)
  //  - descrições diferentes (formato do título varia)
  // Então checamos: mesmo valor + mesmo tipo + janela de ±2 dias
  // ──────────────────────────────────────────────

  const dateMin = new Date(date);
  dateMin.setDate(dateMin.getDate() - 2);
  const dateMax = new Date(date);
  dateMax.setDate(dateMax.getDate() + 2);

  const existing = await prisma.transaction.findFirst({
    where: {
      amount: amount,
      type: type,
      source: "inter_api",
      date: {
        gte: dateMin,
        lte: dateMax,
      },
    },
  });

  if (existing) {
    throw new Error("Transaction already exists (dedup: same amount+type within ±2 days)");
  }

  // Tenta categorizar automaticamente
  const categoryId = await findOrCreateCategory(
    `${t.titulo} ${t.descricao}`,
    amount >= 0 ? "income" : "expense"
  );

  await prisma.transaction.create({
    data: {
      date,
      description: t.titulo || t.descricao,
      amount,
      type,
      categoryId,
      recipient: t.descricao || null,
      source: "inter_api",
    },
  });
}

// ═══════════════════════════════════════════════════
// SYNC FATURAS DO CARTÃO
// ═══════════════════════════════════════════════════

export async function syncFaturas(): Promise<SyncResult> {
  const result: SyncResult = { total: 0, created: 0, skipped: 0, errors: 0 };

  try {
    const faturas = await getFaturas();

    for (const fatura of faturas) {
      if (fatura.transacoes) {
        result.total += fatura.transacoes.length;

        for (const t of fatura.transacoes) {
          try {
            await processCardTransaction(t, fatura.mesReferencia);
            result.created++;
          } catch {
            result.skipped++;
          }
        }
      }
    }
  } catch (err) {
    console.error("Erro ao sincronizar faturas:", err);
    throw err;
  }

  return result;
}

async function processCardTransaction(
  t: InterFaturaTransacao,
  mesReferencia: string
): Promise<void> {
  const amount = -Math.abs(t.valor); // Gastos no cartão são negativos
  const date = new Date(t.dataCompra + "T12:00:00Z");

  // Formata mês para "YYYY-MM"
  const invoiceMonth = mesReferencia.substring(0, 7); // "2026-01"

  // Verifica se já existe
  const existing = await prisma.cardTransaction.findFirst({
    where: {
      date: date,
      description: t.titulo,
      amount: amount,
      source: "inter_api",
    },
  });

  if (existing) {
    throw new Error("Card transaction already exists");
  }

  // Tenta categorizar
  const categoryId = await findOrCreateCategory(t.titulo, "expense");

  await prisma.cardTransaction.create({
    data: {
      date,
      description: t.titulo,
      amount,
      cardCategory: t.categoria || null,
      type: t.parcela || "Compra à vista",
      invoiceMonth,
      categoryId,
      source: "inter_api",
    },
  });
}

// ═══════════════════════════════════════════════════
// LIMPEZA DE DUPLICATAS EXISTENTES
// ═══════════════════════════════════════════════════

export interface DeduplicationResult {
  totalAnalyzed: number;
  duplicatesRemoved: number;
  details: Array<{
    kept: { id: string; date: string; description: string; amount: number };
    removed: { id: string; date: string; description: string; amount: number };
  }>;
}

/**
 * Remove transações duplicadas já existentes no banco de dados.
 * 
 * Critério de duplicata:
 *  - Mesmo valor (amount)
 *  - Mesmo tipo (type)
 *  - Mesma fonte (source = "inter_api")
 *  - Datas dentro de uma janela de ±2 dias
 * 
 * Quando encontra duplicatas, mantém a que tem categoria atribuída,
 * ou a mais antiga (primeira inserida). Remove as demais.
 */
export async function removeDuplicateTransactions(): Promise<DeduplicationResult> {
  const result: DeduplicationResult = {
    totalAnalyzed: 0,
    duplicatesRemoved: 0,
    details: [],
  };

  // Busca todas as transações da API do Inter, ordenadas por data
  const allTransactions = await prisma.transaction.findMany({
    where: { source: "inter_api" },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  result.totalAnalyzed = allTransactions.length;

  // IDs já marcados para remoção (para não remover duplamente)
  const idsToRemove = new Set<string>();

  for (let i = 0; i < allTransactions.length; i++) {
    const current = allTransactions[i];

    // Pula se já está marcada para remoção
    if (idsToRemove.has(current.id)) continue;

    for (let j = i + 1; j < allTransactions.length; j++) {
      const candidate = allTransactions[j];

      // Pula se já está marcada para remoção
      if (idsToRemove.has(candidate.id)) continue;

      // Verifica: mesmo valor e mesmo tipo
      if (current.amount !== candidate.amount || current.type !== candidate.type) {
        continue;
      }

      // Verifica: janela de ±2 dias
      const diffMs = Math.abs(current.date.getTime() - candidate.date.getTime());
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays > 2) continue;

      // É duplicata! Decidir qual manter:
      // - Preferência 1: a que tem categoria atribuída
      // - Preferência 2: a mais antiga (pelo createdAt)
      let toKeep = current;
      let toRemove = candidate;

      if (!current.categoryId && candidate.categoryId) {
        toKeep = candidate;
        toRemove = current;
      }

      idsToRemove.add(toRemove.id);

      result.details.push({
        kept: {
          id: toKeep.id,
          date: toKeep.date.toISOString().split("T")[0],
          description: toKeep.description,
          amount: toKeep.amount,
        },
        removed: {
          id: toRemove.id,
          date: toRemove.date.toISOString().split("T")[0],
          description: toRemove.description,
          amount: toRemove.amount,
        },
      });
    }
  }

  // Remove todas as duplicatas encontradas
  if (idsToRemove.size > 0) {
    await prisma.transaction.deleteMany({
      where: { id: { in: Array.from(idsToRemove) } },
    });
    result.duplicatesRemoved = idsToRemove.size;
  }

  console.log(
    `[Dedup] Analisadas: ${result.totalAnalyzed}, Duplicatas removidas: ${result.duplicatesRemoved}`
  );

  return result;
}

// ═══════════════════════════════════════════════════
// SYNC COMPLETO
// ═══════════════════════════════════════════════════

export interface FullSyncResult {
  saldo: {
    disponivel: number;
  } | null;
  extrato: SyncResult | null;
  faturas: SyncResult | null;
  duration: number;
  error?: string;
}

export async function fullSync(
  dataInicio: string,
  dataFim: string
): Promise<FullSyncResult> {
  const startTime = Date.now();
  const result: FullSyncResult = {
    saldo: null,
    extrato: null,
    faturas: null,
    duration: 0,
  };

  try {
    // 1. Busca saldo
    try {
      const saldo = await getSaldo();
      result.saldo = { disponivel: saldo.disponivel };

      // Salva o saldo nas configurações
      await prisma.setting.upsert({
        where: { key: "inter_saldo" },
        update: { value: JSON.stringify(saldo) },
        create: { key: "inter_saldo", value: JSON.stringify(saldo) },
      });
    } catch (err) {
      console.error("Erro ao buscar saldo:", err);
    }

    // Delay entre saldo e extrato para evitar rate limit
    console.log("[Inter Sync] Aguardando 5s antes de buscar extrato...");
    await new Promise((r) => setTimeout(r, 5000));

    // 2. Sincroniza extrato
    try {
      result.extrato = await syncExtrato(dataInicio, dataFim);
    } catch (err) {
      console.error("Erro ao sincronizar extrato:", err);
      result.extrato = { total: 0, created: 0, skipped: 0, errors: 1 };
    }

    // Delay entre extrato e faturas
    console.log("[Inter Sync] Aguardando 5s antes de buscar faturas...");
    await new Promise((r) => setTimeout(r, 5000));

    // 3. Sincroniza faturas
    try {
      result.faturas = await syncFaturas();
    } catch (err) {
      console.error("Erro ao sincronizar faturas:", err);
      result.faturas = { total: 0, created: 0, skipped: 0, errors: 1 };
    }

    // 4. Roda deduplicação automática após sync
    console.log("[Inter Sync] Executando deduplicação automática...");
    try {
      const dedupResult = await removeDuplicateTransactions();
      console.log(
        `[Inter Sync] Dedup: ${dedupResult.duplicatesRemoved} duplicatas removidas`
      );
    } catch (err) {
      console.error("[Inter Sync] Erro na deduplicação:", err);
    }

    // 5. Salva timestamp da última sincronização
    await prisma.setting.upsert({
      where: { key: "inter_last_sync" },
      update: { value: new Date().toISOString() },
      create: { key: "inter_last_sync", value: new Date().toISOString() },
    });

  } catch (err) {
    result.error = err instanceof Error ? err.message : "Erro desconhecido";
  }

  result.duration = Date.now() - startTime;
  return result;
}
