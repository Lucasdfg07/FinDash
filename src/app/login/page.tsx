"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Lock, Mail, ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  async function doLogin(loginEmail: string, loginPassword: string) {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou senha incorretos");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await doLogin(email, password);
  }

  async function handleDemoLogin() {
    setEmail("admin@findash.com");
    setPassword("admin123");
    await doLogin("admin@findash.com", "admin123");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative noise-bg"
      style={{ background: "var(--background)" }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-20 nav-theme-btn"
        style={{ width: "auto", padding: "0.5rem 1rem" }}
        title={theme === "dark" ? "Tema Claro" : "Tema Escuro"}
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        <span className="text-sm font-medium">
          {theme === "dark" ? "Claro" : "Escuro"}
        </span>
      </button>

      {/* Background glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-10"
        style={{ background: "var(--primary)" }}
      />

      <div className="w-full max-w-md p-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 glow-pulse"
            style={{
              background: "linear-gradient(145deg, var(--primary), var(--primary-dark))",
            }}
          >
            <TrendingUp
              size={32}
              style={{ color: "var(--primary-text)" }}
              strokeWidth={2.5}
            />
          </div>
          <h1 className="text-4xl font-bold gradient-text tracking-tight">
            FinDash
          </h1>
          <p
            className="mt-2 text-sm font-medium tracking-widest uppercase"
            style={{ color: "var(--muted)" }}
          >
            Dashboard Financeiro
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          {error && (
            <div
              className="p-3 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "var(--danger)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold mb-2 tracking-wider uppercase"
              style={{ color: "var(--muted)" }}
            >
              Email
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted)" }}
              />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@findash.com"
                required
                autoComplete="email"
                className="w-full pl-10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold mb-2 tracking-wider uppercase"
              style={{ color: "var(--muted)" }}
            >
              Senha
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted)" }}
              />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3 py-3.5 text-base"
          >
            {loading ? (
              <div
                className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "rgba(0,0,0,0.2)",
                  borderTopColor: "var(--primary-text)",
                }}
              />
            ) : (
              <>
                Entrar
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        {/* Demo Login */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="btn-secondary w-full mt-5 flex items-center justify-center gap-2"
          style={{
            background: "var(--primary-glow)",
            color: "var(--primary)",
            borderColor: "var(--primary-glow)",
          }}
        >
          🔐 Login Demo (admin@findash.com)
        </button>

        <p
          className="text-center text-xs mt-5 font-medium tracking-wider uppercase"
          style={{ color: "var(--muted)" }}
        >
          Somente visualização — dados do Banco Inter
        </p>
      </div>
    </div>
  );
}
