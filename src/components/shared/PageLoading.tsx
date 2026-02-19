"use client";

import { Loader2 } from "lucide-react";

interface PageLoadingProps {
  message?: string;
}

/**
 * Full-page loading indicator — theme-aware.
 * Uses CSS variables so the spinner always looks correct in both light & dark modes.
 */
export default function PageLoading({ message = "Carregando..." }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4 animate-fade-in">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center glow-pulse"
        style={{ background: "var(--primary)" }}
      >
        <Loader2
          size={24}
          className="animate-spin"
          style={{ color: "var(--primary-text)" }}
        />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
        {message}
      </p>
    </div>
  );
}
