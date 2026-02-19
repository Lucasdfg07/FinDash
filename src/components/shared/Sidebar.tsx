"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  PiggyBank,
  Settings,
  LogOut,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/custos-fixos", label: "Custos Fixos", icon: PiggyBank },
  { href: "/transacoes", label: "Extrato Bancário", icon: Receipt },
  { href: "/faturas", label: "Faturas Cartão", icon: CreditCard },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

/** Floating tooltip that appears to the right of the collapsed sidebar icon. */
function SidebarTooltip({ label }: { label: string }) {
  return (
    <span
      className="sidebar-tooltip"
      role="tooltip"
    >
      {label}
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 backdrop-blur-xl"
      style={{
        width: collapsed ? "80px" : "var(--sidebar-width)",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--border)",
        boxShadow: "var(--sidebar-shadow)",
      }}
      role="navigation"
      aria-label="Menu principal"
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
          style={{
            background: "linear-gradient(145deg, var(--primary), var(--primary-dark))",
            boxShadow: "var(--nav-active-shadow)",
          }}
        >
          <TrendingUp size={20} style={{ color: "var(--primary-text)" }} strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold gradient-text tracking-tight">
              FinDash
            </h1>
            <p
              className="text-[10px] font-medium tracking-widest uppercase"
              style={{ color: "var(--muted)" }}
            >
              Dashboard Financeiro
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 space-y-1.5" aria-label="Navegação principal">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nav-item group",
                isActive && "nav-active",
                collapsed && "nav-collapsed"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                size={20}
                className="flex-shrink-0"
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {collapsed ? (
                <SidebarTooltip label={item.label} />
              ) : (
                <span className="animate-fade-in">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 pb-5 space-y-1.5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn("nav-theme-btn group", collapsed && "nav-collapsed")}
          aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
        >
          {theme === "dark" ? (
            <Sun size={20} className="flex-shrink-0" />
          ) : (
            <Moon size={20} className="flex-shrink-0" />
          )}
          {collapsed ? (
            <SidebarTooltip label={theme === "dark" ? "Tema Claro" : "Tema Escuro"} />
          ) : (
            <span className="animate-fade-in">
              {theme === "dark" ? "Tema Claro" : "Tema Escuro"}
            </span>
          )}
        </button>

        {/* Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("nav-bottom-btn group", collapsed && "nav-collapsed")}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight size={20} className="flex-shrink-0" />
          ) : (
            <ChevronLeft size={20} className="flex-shrink-0" />
          )}
          {collapsed ? (
            <SidebarTooltip label="Expandir" />
          ) : (
            <span className="animate-fade-in">Recolher</span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn("nav-bottom-btn nav-logout group", collapsed && "nav-collapsed")}
          aria-label="Sair da conta"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {collapsed ? (
            <SidebarTooltip label="Sair" />
          ) : (
            <span className="animate-fade-in">Sair</span>
          )}
        </button>
      </div>
    </aside>
  );
}
