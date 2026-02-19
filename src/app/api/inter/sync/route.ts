import { NextRequest, NextResponse } from "next/server";
import { fullSync } from "@/lib/inter-sync";
import { format, subMonths } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Padrão: últimos 3 meses
    const dataFim = body.dataFim || format(new Date(), "yyyy-MM-dd");
    const dataInicio =
      body.dataInicio || format(subMonths(new Date(), 3), "yyyy-MM-dd");

    console.log(`[Inter Sync] Iniciando sincronização: ${dataInicio} → ${dataFim}`);

    const result = await fullSync(dataInicio, dataFim);

    console.log(`[Inter Sync] Concluído em ${result.duration}ms:`, {
      extrato: result.extrato,
      faturas: result.faturas,
      saldo: result.saldo,
    });

    return NextResponse.json({
      success: true,
      message: "Sincronização concluída com sucesso",
      ...result,
    });
  } catch (error) {
    console.error("[Inter Sync] Erro:", error);

    const message =
      error instanceof Error ? error.message : "Erro desconhecido na sincronização";

    // Mensagens amigáveis para erros comuns
    let userMessage = message;
    if (message.includes("Certificado")) {
      userMessage =
        "Certificado digital não encontrado. Baixe o certificado em developers.inter.co e coloque na pasta certs/";
    } else if (message.includes("401") || message.includes("403")) {
      userMessage =
        "Credenciais inválidas ou sem permissão. Verifique o Client ID e Client Secret.";
    } else if (message.includes("ECONNREFUSED")) {
      userMessage =
        "Não foi possível conectar à API do Inter. Verifique sua conexão com a internet.";
    }

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        details: message,
      },
      { status: 500 }
    );
  }
}
