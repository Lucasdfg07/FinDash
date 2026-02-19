/**
 * API Route: Remoção de transações duplicadas
 * POST /api/inter/dedup
 * 
 * Remove transações duplicadas importadas pela API do Inter.
 * Critério: mesmo valor + mesmo tipo + mesma fonte + datas dentro de ±2 dias.
 */

import { NextResponse } from "next/server";
import { removeDuplicateTransactions } from "@/lib/inter-sync";

export async function POST() {
  try {
    console.log("[Dedup API] Iniciando remoção de duplicatas...");

    const result = await removeDuplicateTransactions();

    console.log(
      `[Dedup API] Concluído: ${result.duplicatesRemoved} duplicatas removidas de ${result.totalAnalyzed} transações`
    );

    return NextResponse.json({
      success: true,
      totalAnalyzed: result.totalAnalyzed,
      duplicatesRemoved: result.duplicatesRemoved,
      details: result.details,
    });
  } catch (err) {
    console.error("[Dedup API] Erro:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
