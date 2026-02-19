"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  PiggyBank,
  Users,
  Wrench,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import PageLoading from "@/components/shared/PageLoading";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface FixedCost {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  category: Category;
  subcategory: string | null;
  recurrence: string;
  renewalDate: string | null;
  notes: string | null;
  active: boolean;
}

const subcategoryOptions = [
  "Funcionários",
  "Ferramentas e Software",
  "Hospedagem e Domínios",
  "Marketing",
  "Outros",
];

export default function CustosFixosPage() {
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    categoryId: "",
    subcategory: "Ferramentas e Software",
    recurrence: "monthly",
    renewalDate: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/fixed-costs").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([costsData, catsData]) => {
        setCosts(costsData);
        setCategories(catsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const resetForm = useCallback(() => {
    setForm({ name: "", amount: "", categoryId: "", subcategory: "Ferramentas e Software", recurrence: "monthly", renewalDate: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  }, []);

  // Esc key to close modal
  useEffect(() => {
    if (!showForm) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") resetForm();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showForm, resetForm]);

  function startEdit(cost: FixedCost) {
    setForm({
      name: cost.name,
      amount: String(cost.amount),
      categoryId: cost.categoryId,
      subcategory: cost.subcategory || "Ferramentas e Software",
      recurrence: cost.recurrence,
      renewalDate: cost.renewalDate || "",
      notes: cost.notes || "",
    });
    setEditingId(cost.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = editingId ? `/api/fixed-costs/${editingId}` : "/api/fixed-costs";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const updated = await fetch("/api/fixed-costs").then((r) => r.json());
      setCosts(updated);
      resetForm();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este custo fixo?")) return;
    const res = await fetch(`/api/fixed-costs/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCosts(costs.filter((c) => c.id !== id));
    }
  }

  async function toggleActive(cost: FixedCost) {
    const res = await fetch(`/api/fixed-costs/${cost.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !cost.active }),
    });
    if (res.ok) {
      setCosts(costs.map((c) => (c.id === cost.id ? { ...c, active: !c.active } : c)));
    }
  }

  // Agrupar por subcategoria
  const grouped: Record<string, FixedCost[]> = {};
  for (const cost of costs) {
    const key = cost.subcategory || "Outros";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(cost);
  }

  const totalMonthly = costs
    .filter((c) => c.active && c.recurrence === "monthly")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalAnnual = costs
    .filter((c) => c.active && c.recurrence === "annual")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalAll = totalMonthly + totalAnnual / 12;

  if (loading) {
    return <PageLoading message="Carregando custos fixos..." />;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Custos <span className="gradient-text">Fixos</span>
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: "var(--muted)" }}>
            Gerencie seus custos fixos recorrentes por categoria
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary flex items-center gap-3"
        >
          <Plus size={18} strokeWidth={2.5} />
          Novo Custo Fixo
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "rgba(209,245,23,0.1)", border: "1px solid rgba(209,245,23,0.2)" }}>
              <PiggyBank size={16} style={{ color: "var(--primary)" }} />
            </div>
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>
              TOTAL MENSAL
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
            {formatCurrency(totalAll)}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <Users size={16} style={{ color: "#6366f1" }} />
            </div>
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>
              FUNCIONÁRIOS
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#6366f1" }}>
            {formatCurrency(
              costs
                .filter((c) => c.active && c.subcategory === "Funcionários")
                .reduce((sum, c) => sum + c.amount, 0)
            )}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <Wrench size={16} style={{ color: "#a855f7" }} />
            </div>
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>
              FERRAMENTAS
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: "#a855f7" }}>
            {formatCurrency(
              costs
                .filter((c) => c.active && c.subcategory === "Ferramentas e Software")
                .reduce((sum, c) => sum + (c.recurrence === "annual" ? c.amount / 12 : c.amount), 0)
            )}
          </p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-backdrop"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? "Editar custo fixo" : "Novo custo fixo"}
        >
          <div className="glass-card w-full max-w-lg animate-slide-up" style={{ border: "1px solid rgba(209,245,23,0.1)", padding: 28 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold tracking-tight">
                {editingId ? "Editar Custo Fixo" : "Novo Custo Fixo"}
              </h2>
              <button onClick={resetForm} className="btn-icon" aria-label="Fechar modal" title="Fechar (Esc)">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fc-name" className="block text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>
                    Nome *
                  </label>
                  <input id="fc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Cademi" required className="w-full" />
                </div>
                <div>
                  <label htmlFor="fc-amount" className="block text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>
                    Valor (R$) *
                  </label>
                  <input id="fc-amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="997.00" required className="w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fc-category" className="block text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>
                    Categoria *
                  </label>
                  <select id="fc-category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="w-full">
                    <option value="">Selecione...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="fc-subcategory" className="block text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>
                    Subcategoria
                  </label>
                  <select id="fc-subcategory" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className="w-full">
                    {subcategoryOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fc-recurrence" className="block text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>
                    Recorrência
                  </label>
                  <select id="fc-recurrence" value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })} className="w-full">
                    <option value="monthly">Mensal</option>
                    <option value="annual">Anual</option>
                    <option value="quarterly">Trimestral</option>
                  </select>
                </div>
                {form.recurrence === "annual" && (
                  <div>
                    <label htmlFor="fc-renewal" className="block text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>
                      Mês de Renovação
                    </label>
                    <input id="fc-renewal" value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} placeholder="Ex: Jan, Set" className="w-full" />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="fc-notes" className="block text-[10px] font-bold mb-1.5 tracking-[0.15em] uppercase font-mono" style={{ color: "var(--muted)" }}>
                  Observações
                </label>
                <input id="fc-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionais..." className="w-full" />
              </div>

              <div className="flex gap-4 justify-end pt-3">
                <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-3">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={2.5} />}
                  {editingId ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grouped Lists */}
      {Object.entries(grouped).map(([subcategory, items]) => (
        <div key={subcategory} className="glass-card overflow-hidden">
          <div className="flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)", padding: "20px 24px" }}>
            <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{
              background: subcategory === "Funcionários" ? "rgba(99,102,241,0.1)" : "rgba(168,85,247,0.1)",
              border: `1px solid ${subcategory === "Funcionários" ? "rgba(99,102,241,0.2)" : "rgba(168,85,247,0.2)"}`,
            }}>
              {subcategory === "Funcionários" ? (
                <Users size={14} style={{ color: "#6366f1" }} />
              ) : (
                <Wrench size={14} style={{ color: "#a855f7" }} />
              )}
            </div>
            <h3 className="text-sm font-bold tracking-tight">{subcategory}</h3>
            <span className="text-[10px] font-mono font-bold ml-auto" style={{ color: "var(--muted)" }}>
              {items.filter((i) => i.active).length} itens ativos —{" "}
              <span style={{ color: "var(--primary)" }}>
                {formatCurrency(
                  items
                    .filter((i) => i.active)
                    .reduce((sum, i) => sum + (i.recurrence === "annual" ? i.amount / 12 : i.amount), 0)
                )}
              </span>
              /mês
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Valor</th>
                <th>Recorrência</th>
                <th>Categoria</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((cost) => (
                <tr key={cost.id} style={{ opacity: cost.active ? 1 : 0.4 }}>
                  <td>
                    <div>
                      <span className="font-semibold text-sm">{cost.name}</span>
                      {cost.notes && (
                        <p className="text-[10px] mt-0.5 font-mono" style={{ color: "var(--muted)" }}>
                          {cost.notes}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="font-bold font-mono" style={{ color: "var(--danger)" }}>
                    {formatCurrency(cost.amount)}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: cost.recurrence === "monthly" ? "rgba(209,245,23,0.1)" : "rgba(245,158,11,0.1)",
                        color: cost.recurrence === "monthly" ? "var(--primary)" : "var(--warning)",
                        border: `1px solid ${cost.recurrence === "monthly" ? "rgba(209,245,23,0.2)" : "rgba(245,158,11,0.2)"}`,
                      }}
                    >
                      {cost.recurrence === "monthly" ? "Mensal" : cost.recurrence === "annual" ? `Anual${cost.renewalDate ? ` (${cost.renewalDate})` : ""}` : "Trimestral"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: `${cost.category.color}15`,
                        color: cost.category.color,
                        border: `1px solid ${cost.category.color}25`,
                      }}
                    >
                      {cost.category.name}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(cost)}
                      className="badge cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      style={{
                        background: cost.active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                        color: cost.active ? "var(--success)" : "var(--danger)",
                        border: `1px solid ${cost.active ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                        boxShadow: cost.active
                          ? "0 2px 6px rgba(34,197,94,0.1), inset 0 1px 0 rgba(255,255,255,0.05)"
                          : "0 2px 6px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                      }}
                    >
                      {cost.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(cost)}
                        className="btn-icon"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cost.id)}
                        className="btn-icon btn-icon-danger"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Info */}
      <div
        className="flex items-start gap-3 rounded-xl"
        style={{
          background: "rgba(209,245,23,0.04)",
          border: "1px solid rgba(209,245,23,0.1)",
          padding: 20,
        }}
      >
        <AlertCircle size={16} style={{ color: "var(--primary)" }} className="mt-0.5 flex-shrink-0" />
        <div className="text-xs" style={{ color: "var(--muted)" }}>
          <p className="font-bold text-[10px] tracking-[0.1em] uppercase" style={{ color: "var(--primary)" }}>Sobre custos anuais</p>
          <p className="mt-1">
            Custos anuais são rateados por 12 meses no cálculo do custo fixo mensal total.
            O mês de renovação indica quando a cobrança é feita.
          </p>
        </div>
      </div>
    </div>
  );
}
