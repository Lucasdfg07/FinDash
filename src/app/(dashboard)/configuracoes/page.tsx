"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Database,
  Shield,
  Zap,
  Palette,
  Sun,
  Moon,
  Building2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowDownToLine,
  Calendar,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { format, subMonths } from "date-fns";

interface InterStatus {
  configured: boolean;
  hasCertificate: boolean;
  hasCredentials: boolean;
  connected: boolean;
  error?: string;
  lastSync?: string;
  saldo?: { disponivel: number } | null;
  stats?: {
    transacoesImportadas: number;
    faturasImportadas: number;
  };
}

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

  // Inter API state
  const [interStatus, setInterStatus] = useState<InterStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMonths, setSyncMonths] = useState(3);

  // Dedup state
  const [deduping, setDeduping] = useState(false);
  const [dedupResult, setDedupResult] = useState<string | null>(null);
  const [dedupError, setDedupError] = useState<string | null>(null);

  const fetchInterStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch("/api/inter/status");
      const data = await res.json();
      setInterStatus(data);
    } catch {
      setInterStatus({
        configured: false,
        hasCertificate: false,
        hasCredentials: false,
        connected: false,
        error: "Erro ao verificar status",
      });
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchInterStatus();
  }, [fetchInterStatus]);

  const handleDedup = async () => {
    setDeduping(true);
    setDedupResult(null);
    setDedupError(null);

    try {
      const res = await fetch("/api/inter/dedup", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        if (data.duplicatesRemoved > 0) {
          setDedupResult(
            `${data.duplicatesRemoved} transação(ões) duplicada(s) removida(s) de ${data.totalAnalyzed} analisadas.`
          );
        } else {
          setDedupResult(
            `Nenhuma duplicata encontrada! ${data.totalAnalyzed} transações analisadas.`
          );
        }
        fetchInterStatus();
      } else {
        setDedupError(data.error || "Erro desconhecido");
      }
    } catch (err) {
      setDedupError(err instanceof Error ? err.message : "Erro ao remover duplicatas");
    } finally {
      setDeduping(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);

    try {
      const dataFim = format(new Date(), "yyyy-MM-dd");
      const dataInicio = format(subMonths(new Date(), syncMonths), "yyyy-MM-dd");

      const res = await fetch("/api/inter/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataInicio, dataFim }),
      });

      const data = await res.json();

      if (data.success) {
        const msgs: string[] = [];
        if (data.extrato) {
          msgs.push(`Extrato: ${data.extrato.created} novas transações`);
        }
        if (data.faturas) {
          msgs.push(`Faturas: ${data.faturas.created} novos lançamentos`);
        }
        if (data.saldo) {
          msgs.push(`Saldo: R$ ${data.saldo.disponivel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
        }
        msgs.push(`Tempo: ${(data.duration / 1000).toFixed(1)}s`);
        setSyncResult(msgs.join(" · "));
        fetchInterStatus(); // Atualiza status
      } else {
        setSyncError(data.error || "Erro desconhecido");
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Erro na sincronização");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Confi<span className="gradient-text">gurações</span>
        </h1>
        <p className="text-sm mt-1 font-medium" style={{ color: "var(--muted)" }}>
          Configurações gerais do dashboard
        </p>
      </div>

      {/* Theme */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <Palette size={16} style={{ color: "var(--warning)" }} />
          </div>
          <h3 className="text-sm font-bold tracking-tight">Aparência</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Tema do Dashboard</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Alterne entre os modos claro e escuro
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background:
                  theme === "dark"
                    ? "linear-gradient(145deg, var(--primary), var(--primary-dark))"
                    : "var(--input-bg)",
                color: theme === "dark" ? "var(--primary-text)" : "var(--foreground)",
                border: theme === "dark" ? "none" : "1px solid var(--border-strong)",
                boxShadow:
                  theme === "dark"
                    ? "var(--nav-active-shadow)"
                    : "var(--input-shadow)",
              }}
            >
              <Moon size={16} />
              Escuro
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background:
                  theme === "light"
                    ? "linear-gradient(145deg, var(--primary), var(--primary-dark))"
                    : "var(--input-bg)",
                color: theme === "light" ? "var(--primary-text)" : "var(--foreground)",
                border: theme === "light" ? "none" : "1px solid var(--border-strong)",
                boxShadow:
                  theme === "light"
                    ? "var(--nav-active-shadow)"
                    : "var(--input-shadow)",
              }}
            >
              <Sun size={16} />
              Claro
            </button>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: "var(--primary-glow)",
              border: "1px solid var(--primary-glow)",
            }}
          >
            <User size={16} style={{ color: "var(--primary)" }} />
          </div>
          <h3 className="text-sm font-bold tracking-tight">Informações da Conta</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              className="text-[10px] font-bold tracking-[0.15em] uppercase font-mono"
              style={{ color: "var(--muted)" }}
            >
              Nome
            </label>
            <p className="text-sm mt-1.5 font-medium">
              {session?.user?.name || "Admin"}
            </p>
          </div>
          <div>
            <label
              className="text-[10px] font-bold tracking-[0.15em] uppercase font-mono"
              style={{ color: "var(--muted)" }}
            >
              Email
            </label>
            <p className="text-sm mt-1.5 font-medium font-mono">
              {session?.user?.email || "admin@findash.com"}
            </p>
          </div>
        </div>
      </div>

      {/* Banco Inter Integration */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: "rgba(251,146,60,0.1)",
              border: "1px solid rgba(251,146,60,0.2)",
            }}
          >
            <Building2 size={16} style={{ color: "#fb923c" }} />
          </div>
          <h3 className="text-sm font-bold tracking-tight">Banco Inter — Integração API</h3>
        </div>

        {/* Status da Conexão */}
        <div style={{ marginBottom: 24 }}>
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-[10px] font-bold tracking-[0.15em] uppercase font-mono"
              style={{ color: "var(--muted)" }}
            >
              Status da Conexão
            </span>
            {loadingStatus ? (
              <Loader2 size={14} className="animate-spin" style={{ color: "var(--muted)" }} />
            ) : interStatus?.connected ? (
              <span
                className="badge"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  color: "var(--success)",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                <CheckCircle2 size={12} /> Conectado
              </span>
            ) : interStatus?.configured ? (
              <span
                className="badge"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <XCircle size={12} /> Erro na conexão
              </span>
            ) : (
              <span
                className="badge"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  color: "var(--warning)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <AlertTriangle size={12} /> Não configurado
              </span>
            )}
          </div>

          {/* Checklist de configuração */}
          <div
            className="rounded-xl"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--border)",
              padding: 20,
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm">
                {interStatus?.hasCredentials ? (
                  <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                ) : (
                  <XCircle size={16} style={{ color: "#ef4444" }} />
                )}
                <span className="font-medium">Client ID & Secret</span>
                <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                  (.env)
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {interStatus?.hasCertificate ? (
                  <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                ) : (
                  <XCircle size={16} style={{ color: "#ef4444" }} />
                )}
                <span className="font-medium">Certificado Digital</span>
                <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                  (certs/inter.crt + inter.key)
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {interStatus?.connected ? (
                  <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                ) : (
                  <XCircle size={16} style={{ color: "var(--muted)" }} />
                )}
                <span className="font-medium">Conexão com API</span>
                <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                  (OAuth2 + mTLS)
                </span>
              </div>
            </div>

            {interStatus?.error && !interStatus.connected && (
              <div
                className="mt-3 text-xs rounded-lg"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  color: "#ef4444",
                  padding: "10px 14px",
                }}
              >
                {interStatus.error}
              </div>
            )}
          </div>
        </div>

        {/* Stats da última sincronização */}
        {interStatus?.stats && (interStatus.stats.transacoesImportadas > 0 || interStatus.stats.faturasImportadas > 0) && (
          <div
            className="grid grid-cols-2 gap-4"
            style={{ marginBottom: 24 }}
          >
            <div
              className="rounded-xl text-center"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
                padding: 16,
              }}
            >
              <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                {interStatus.stats.transacoesImportadas}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest mt-1" style={{ color: "var(--muted)" }}>
                Transações
              </p>
            </div>
            <div
              className="rounded-xl text-center"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
                padding: 16,
              }}
            >
              <p className="text-2xl font-bold" style={{ color: "#fb923c" }}>
                {interStatus.stats.faturasImportadas}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-widest mt-1" style={{ color: "var(--muted)" }}>
                Faturas Cartão
              </p>
            </div>
          </div>
        )}

        {/* Última sincronização */}
        {interStatus?.lastSync && (
          <div
            className="flex items-center gap-2 text-xs mb-5"
            style={{ color: "var(--muted)" }}
          >
            <Calendar size={12} />
            Última sincronização: {new Date(interStatus.lastSync).toLocaleString("pt-BR")}
          </div>
        )}

        {/* Controles de sincronização */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
              Período:
            </label>
            <select
              value={syncMonths}
              onChange={(e) => setSyncMonths(Number(e.target.value))}
              className="text-sm rounded-lg"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                padding: "8px 12px",
                outline: "none",
              }}
            >
              <option value={1}>Último mês</option>
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Último ano</option>
            </select>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing || !interStatus?.configured}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: interStatus?.configured
                ? "linear-gradient(145deg, #fb923c, #ea580c)"
                : "var(--input-bg)",
              color: interStatus?.configured ? "#fff" : "var(--muted)",
              border: interStatus?.configured ? "none" : "1px solid var(--border)",
              opacity: syncing ? 0.7 : 1,
              cursor: syncing || !interStatus?.configured ? "not-allowed" : "pointer",
            }}
          >
            {syncing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowDownToLine size={16} />
            )}
            {syncing ? "Sincronizando..." : "Sincronizar Agora"}
          </button>

          <button
            onClick={fetchInterStatus}
            disabled={loadingStatus}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-xs transition-all"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              cursor: loadingStatus ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={14} className={loadingStatus ? "animate-spin" : ""} />
            Atualizar Status
          </button>

          <button
            onClick={handleDedup}
            disabled={deduping}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-xs transition-all"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              cursor: deduping ? "not-allowed" : "pointer",
              opacity: deduping ? 0.7 : 1,
            }}
          >
            {deduping ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {deduping ? "Removendo..." : "Remover Duplicatas"}
          </button>
        </div>

        {/* Resultado da sincronização */}
        {syncResult && (
          <div
            className="mt-4 flex items-start gap-3 text-sm rounded-xl"
            style={{
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.15)",
              padding: "14px 18px",
            }}
          >
            <CheckCircle2 size={18} style={{ color: "var(--success)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="font-semibold" style={{ color: "var(--success)" }}>
                Sincronização concluída!
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {syncResult}
              </p>
            </div>
          </div>
        )}

        {syncError && (
          <div
            className="mt-4 flex items-start gap-3 text-sm rounded-xl"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
              padding: "14px 18px",
            }}
          >
            <XCircle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="font-semibold" style={{ color: "#ef4444" }}>
                Erro na sincronização
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {syncError}
              </p>
            </div>
          </div>
        )}

        {/* Resultado da deduplicação */}
        {dedupResult && (
          <div
            className="mt-4 flex items-start gap-3 text-sm rounded-xl"
            style={{
              background: "rgba(168,85,247,0.06)",
              border: "1px solid rgba(168,85,247,0.15)",
              padding: "14px 18px",
            }}
          >
            <Trash2 size={18} style={{ color: "#a855f7", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="font-semibold" style={{ color: "#a855f7" }}>
                Deduplicação concluída!
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {dedupResult}
              </p>
            </div>
          </div>
        )}

        {dedupError && (
          <div
            className="mt-4 flex items-start gap-3 text-sm rounded-xl"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
              padding: "14px 18px",
            }}
          >
            <XCircle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="font-semibold" style={{ color: "#ef4444" }}>
                Erro na deduplicação
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {dedupError}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Database Info */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.2)",
            }}
          >
            <Database size={16} style={{ color: "#a855f7" }} />
          </div>
          <h3 className="text-sm font-bold tracking-tight">Banco de Dados</h3>
        </div>
        <div className="space-y-4">
          <div
            className="flex items-center justify-between text-sm"
            style={{
              borderBottom: "1px solid var(--border)",
              paddingBottom: "12px",
            }}
          >
            <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
              Tipo
            </span>
            <span className="font-medium">SQLite (Local)</span>
          </div>
          <div
            className="flex items-center justify-between text-sm"
            style={{
              borderBottom: "1px solid var(--border)",
              paddingBottom: "12px",
            }}
          >
            <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
              Engine
            </span>
            <span className="font-medium">Prisma ORM</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
              Framework
            </span>
            <span className="font-medium">Next.js 16</span>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <Shield size={16} style={{ color: "#22c55e" }} />
          </div>
          <h3 className="text-sm font-bold tracking-tight">Segurança</h3>
        </div>
        <div className="space-y-4">
          <div
            className="flex items-center justify-between text-sm"
            style={{
              borderBottom: "1px solid var(--border)",
              paddingBottom: "12px",
            }}
          >
            <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
              Autenticação
            </span>
            <span
              className="badge"
              style={{
                background: "rgba(34,197,94,0.1)",
                color: "var(--success)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              NextAuth.js JWT
            </span>
          </div>
          <div
            className="flex items-center justify-between text-sm"
            style={{
              borderBottom: "1px solid var(--border)",
              paddingBottom: "12px",
            }}
          >
            <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
              Modo de Acesso
            </span>
            <span
              className="badge"
              style={{
                background: "var(--primary-glow)",
                color: "var(--primary)",
                border: "1px solid var(--primary-glow)",
              }}
            >
              Somente Visualização
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
              Senhas
            </span>
            <span className="font-medium">bcrypt (hash)</span>
          </div>
        </div>
      </div>

      {/* About */}
      <div
        className="flex items-start gap-4 rounded-xl relative overflow-hidden"
        style={{
          background: "var(--primary-glow)",
          border: "1px solid var(--primary-glow)",
          padding: 24,
        }}
      >
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-10"
          style={{ background: "var(--primary)" }}
        />
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{
            background: "var(--primary-glow)",
            border: "1px solid var(--primary-glow)",
          }}
        >
          <Zap size={16} style={{ color: "var(--primary)" }} />
        </div>
        <div className="text-xs relative z-10" style={{ color: "var(--muted)" }}>
          <p
            className="font-bold text-[10px] tracking-[0.1em] uppercase font-mono"
            style={{ color: "var(--primary)" }}
          >
            FinDash v1.0.0
          </p>
          <p className="mt-1.5 leading-relaxed">
            Dashboard financeiro com dados do Banco Inter. Visualize receitas,
            despesas, ROAS, investimento em Ads (Meta + Google), custos fixos e
            variáveis com total transparência.
          </p>
          <p className="mt-1.5 font-mono text-[10px]">
            Next.js 16 · Prisma · Recharts · TailwindCSS · Estrutura AIOS
          </p>
        </div>
      </div>
    </div>
  );
}
