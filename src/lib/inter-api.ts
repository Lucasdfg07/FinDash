/**
 * Serviço de integração com a API do Banco Inter
 *
 * Documentação: https://developers.inter.co
 *
 * Autenticação: OAuth2 com mTLS (certificado digital)
 * Base URL: https://cdpj.partners.bancointer.com.br
 */

import https from "https";
import fs from "fs";
import path from "path";

// ═══════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════

export interface InterToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  /** Timestamp de quando o token foi obtido */
  obtained_at: number;
}

export interface InterSaldo {
  disponivel: number;
  bloqueadoCheque: number;
  bloqueadoJudicialmente: number;
  bloqueadoAdministrativo: number;
  limite: number;
}

export interface InterTransacao {
  dataEntrada: string; // "YYYY-MM-DD"
  tipoTransacao: string; // "PIX", "PAGAMENTO", "OUTROS", etc.
  tipoOperacao: string; // "C" (crédito) ou "D" (débito)
  valor: string; // "1234.56"
  titulo: string;
  descricao: string;
}

export interface InterExtratoResponse {
  transacoes: InterTransacao[];
}

export interface InterFatura {
  mesReferencia: string;
  valorTotal: number;
  situacao: string; // "ABERTA", "FECHADA", "PAGA"
  dataVencimento: string;
  transacoes: InterFaturaTransacao[];
}

export interface InterFaturaTransacao {
  titulo: string;
  tipo: string;
  valor: number;
  dataCompra: string;
  parcela?: string;
  categoria?: string;
}

// ═══════════════════════════════════════════════════
// CACHE DO TOKEN
// ═══════════════════════════════════════════════════

let cachedToken: InterToken | null = null;

function isTokenValid(): boolean {
  if (!cachedToken) return false;
  const now = Date.now();
  // Token expira em expires_in segundos, renovar 60s antes
  const expiresAt =
    cachedToken.obtained_at + (cachedToken.expires_in - 60) * 1000;
  return now < expiresAt;
}

// ═══════════════════════════════════════════════════
// CONFIGURAÇÃO mTLS
// ═══════════════════════════════════════════════════

function getCertificates(): { cert: Buffer; key: Buffer } {
  const certPath = path.resolve(
    process.cwd(),
    process.env.INTER_CERT_PATH || "./certs/inter.crt"
  );
  const keyPath = path.resolve(
    process.cwd(),
    process.env.INTER_KEY_PATH || "./certs/inter.key"
  );

  if (!fs.existsSync(certPath)) {
    throw new Error(
      `Certificado do Inter não encontrado em: ${certPath}. ` +
        `Baixe o certificado em https://developers.inter.co e coloque na pasta certs/`
    );
  }

  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `Chave privada do Inter não encontrada em: ${keyPath}. ` +
        `Baixe a chave em https://developers.inter.co e coloque na pasta certs/`
    );
  }

  return {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
}

export function hasCertificates(): boolean {
  const certPath = path.resolve(
    process.cwd(),
    process.env.INTER_CERT_PATH || "./certs/inter.crt"
  );
  const keyPath = path.resolve(
    process.cwd(),
    process.env.INTER_KEY_PATH || "./certs/inter.key"
  );
  return fs.existsSync(certPath) && fs.existsSync(keyPath);
}

// ═══════════════════════════════════════════════════
// REQUEST COM mTLS (usando https nativo do Node.js)
// ═══════════════════════════════════════════════════

interface HttpResponse {
  statusCode: number;
  body: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpsRequestRaw(
  url: string,
  options: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
  }
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const { cert, key } = getCertificates();
    const parsedUrl = new URL(url);

    const reqOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method,
      headers: options.headers || {},
      cert,
      key,
      rejectUnauthorized: true,
    };

    const req = https.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode || 0,
          body: data,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Request com retry automático para erros 429 (rate limit)
 */
async function httpsRequest(
  url: string,
  options: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
  },
  maxRetries = 3
): Promise<HttpResponse> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await httpsRequestRaw(url, options);

    if (response.statusCode === 429) {
      if (attempt < maxRetries) {
        // Delays progressivos: 10s, 30s, 60s
        const delays = [10000, 30000, 60000];
        const waitTime = delays[attempt] || 60000;
        console.log(
          `[Inter API] Rate limit (429). Aguardando ${waitTime / 1000}s antes do retry ${attempt + 1}/${maxRetries}...`
        );
        await sleep(waitTime);
        continue;
      }
    }

    return response;
  }

  // Fallback (nunca deve chegar aqui)
  return httpsRequestRaw(url, options);
}

// ═══════════════════════════════════════════════════
// AUTENTICAÇÃO OAuth2
// ═══════════════════════════════════════════════════

export async function getAccessToken(): Promise<string> {
  // Retorna token em cache se ainda válido
  if (isTokenValid() && cachedToken) {
    return cachedToken.access_token;
  }

  const clientId = process.env.INTER_CLIENT_ID;
  const clientSecret = process.env.INTER_CLIENT_SECRET;
  const baseUrl =
    process.env.INTER_API_URL || "https://cdpj.partners.bancointer.com.br";

  if (!clientId || !clientSecret) {
    throw new Error(
      "INTER_CLIENT_ID e INTER_CLIENT_SECRET não configurados no .env"
    );
  }

  const tokenUrl = `${baseUrl}/oauth/v2/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "extrato.read boleto-cobranca.read",
  });

  console.log("[Inter API] Solicitando token OAuth2...");

  const response = await httpsRequest(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (response.statusCode !== 200) {
    console.error("[Inter API] Erro ao obter token:", response.body);
    throw new Error(
      `Falha ao obter token do Inter (${response.statusCode}): ${response.body}`
    );
  }

  const tokenData = JSON.parse(response.body) as Omit<
    InterToken,
    "obtained_at"
  >;

  cachedToken = {
    ...tokenData,
    obtained_at: Date.now(),
  };

  console.log(
    `[Inter API] Token obtido com sucesso (expira em ${tokenData.expires_in}s, scope: ${tokenData.scope})`
  );

  return cachedToken.access_token;
}

// ═══════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════

/**
 * Busca o saldo da conta corrente
 */
export async function getSaldo(): Promise<InterSaldo> {
  const token = await getAccessToken();
  const baseUrl =
    process.env.INTER_API_URL || "https://cdpj.partners.bancointer.com.br";

  const response = await httpsRequest(`${baseUrl}/banking/v2/saldo`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(
      `Erro ao buscar saldo (${response.statusCode}): ${response.body}`
    );
  }

  return JSON.parse(response.body) as InterSaldo;
}

/**
 * Busca o extrato da conta corrente em um período
 * @param dataInicio - Data inicial no formato YYYY-MM-DD
 * @param dataFim - Data final no formato YYYY-MM-DD
 */
export async function getExtrato(
  dataInicio: string,
  dataFim: string
): Promise<InterTransacao[]> {
  const token = await getAccessToken();
  const baseUrl =
    process.env.INTER_API_URL || "https://cdpj.partners.bancointer.com.br";

  const allTransacoes: InterTransacao[] = [];
  let pagina = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      dataInicio,
      dataFim,
      pagina: pagina.toString(),
      tamanhoPagina: "50",
    });

    const response = await httpsRequest(
      `${baseUrl}/banking/v2/extrato?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (response.statusCode !== 200) {
      throw new Error(
        `Erro ao buscar extrato (${response.statusCode}): ${response.body}`
      );
    }

    const data = JSON.parse(response.body) as InterExtratoResponse;

    if (data.transacoes && data.transacoes.length > 0) {
      allTransacoes.push(...data.transacoes);
      pagina++;
      // Delay entre páginas para evitar rate limit
      await sleep(1000);
    } else {
      hasMore = false;
    }

    // Segurança: máximo de 20 páginas (1000 transações)
    if (pagina >= 20) {
      hasMore = false;
    }
  }

  console.log(
    `[Inter API] Extrato: ${allTransacoes.length} transações encontradas`
  );

  return allTransacoes;
}

/**
 * Busca as faturas do cartão de crédito
 */
export async function getFaturas(): Promise<InterFatura[]> {
  const token = await getAccessToken();
  const baseUrl =
    process.env.INTER_API_URL || "https://cdpj.partners.bancointer.com.br";

  const response = await httpsRequest(
    `${baseUrl}/banking/v2/cartao/faturas`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  if (response.statusCode !== 200) {
    // Se não tem cartão ou endpoint não disponível
    if (response.statusCode === 404 || response.statusCode === 403) {
      console.log("[Inter API] Endpoint de faturas não disponível");
      return [];
    }
    throw new Error(
      `Erro ao buscar faturas (${response.statusCode}): ${response.body}`
    );
  }

  return JSON.parse(response.body) as InterFatura[];
}

/**
 * Busca detalhes de uma fatura específica
 */
export async function getFaturaDetalhes(
  mesAno: string // formato "YYYY-MM"
): Promise<InterFatura | null> {
  const token = await getAccessToken();
  const baseUrl =
    process.env.INTER_API_URL || "https://cdpj.partners.bancointer.com.br";

  const response = await httpsRequest(
    `${baseUrl}/banking/v2/cartao/faturas/${mesAno}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  if (response.statusCode !== 200) {
    if (response.statusCode === 404) return null;
    throw new Error(
      `Erro ao buscar fatura ${mesAno} (${response.statusCode}): ${response.body}`
    );
  }

  return JSON.parse(response.body) as InterFatura;
}

// ═══════════════════════════════════════════════════
// STATUS DA CONEXÃO
// ═══════════════════════════════════════════════════

export interface InterConnectionStatus {
  configured: boolean;
  hasCertificate: boolean;
  hasCredentials: boolean;
  connected: boolean;
  error?: string;
}

export async function checkConnection(): Promise<InterConnectionStatus> {
  const clientId = process.env.INTER_CLIENT_ID;
  const clientSecret = process.env.INTER_CLIENT_SECRET;

  const hasCredentials = !!(clientId && clientSecret);
  const hasCert = hasCertificates();
  const configured = hasCredentials && hasCert;

  if (!configured) {
    return {
      configured,
      hasCertificate: hasCert,
      hasCredentials,
      connected: false,
      error: !hasCredentials
        ? "Client ID e Client Secret não configurados no .env"
        : "Certificado digital (.crt/.key) não encontrado na pasta certs/",
    };
  }

  try {
    await getAccessToken();
    return {
      configured: true,
      hasCertificate: true,
      hasCredentials: true,
      connected: true,
    };
  } catch (err) {
    return {
      configured: true,
      hasCertificate: true,
      hasCredentials: true,
      connected: false,
      error: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
}
