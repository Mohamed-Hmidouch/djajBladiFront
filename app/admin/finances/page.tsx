'use client';

import { useState, useCallback } from 'react';
import { getToken } from '@/lib/jwt';
import { getBatchCost, getAllBatchesFlat } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type { BatchCostBreakdownResponse, FeedLineItem, BatchResponse } from '@/types/admin';
import { AdminPageShell, AdminPanel } from '@/components/dashboard';

/* ============================================
   KPI CARD
   ============================================ */
interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: 'primary' | 'brand' | 'success' | 'warning' | 'danger';
}

const kpiAccent: Record<KpiCardProps['accent'], { border: string; text: string; bg: string }> = {
  primary: {
    border: 'border-l-[var(--color-primary)]',
    text: 'text-[var(--color-primary)]',
    bg: 'bg-[var(--color-primary)]/5',
  },
  brand: {
    border: 'border-l-[var(--color-brand)]',
    text: 'text-[var(--color-brand)]',
    bg: 'bg-[var(--color-brand)]/5',
  },
  success: {
    border: 'border-l-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  warning: {
    border: 'border-l-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  danger: {
    border: 'border-l-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
  },
};

function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  const a = kpiAccent[accent];
  return (
    <div
      className={`rounded-xl border border-[var(--color-border)] ${a.bg} border-l-4 ${a.border} px-5 py-4 flex flex-col gap-1`}
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        {label}
      </span>
      <span className={`text-2xl font-bold tracking-tight ${a.text}`}>{value}</span>
      {sub && (
        <span className="text-xs text-[var(--color-text-muted)]">{sub}</span>
      )}
    </div>
  );
}

/* ============================================
   COST ROW (animated bar)
   ============================================ */
interface CostRowProps {
  label: string;
  amount: number;
  total: number;
  color: string;
}

function CostRow({ label, amount, total, color }: CostRowProps) {
  const pct = total > 0 ? Math.min((amount / total) * 100, 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-[var(--color-text-body)]">{label}</span>
        <span className="font-semibold text-[var(--color-text-primary)]">
          {formatDH(amount)}
          <span className="ml-2 text-xs text-[var(--color-text-muted)] font-normal">
            ({pct.toFixed(1)}%)
          </span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ============================================
   STAT CARD (mortality)
   ============================================ */
function StatCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] px-4 py-3 text-center">
      <div className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mt-0.5">
        {label}
      </div>
      {note && (
        <div className="text-xs text-[var(--color-text-muted)] mt-1">{note}</div>
      )}
    </div>
  );
}

/* ============================================
   HELPERS
   ============================================ */
function formatDH(v: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(v);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* ============================================
   PAGE
   ============================================ */
export default function AdminFinancesPage() {
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [batchesLoaded, setBatchesLoaded] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');
  const [fixedChargesInput, setFixedChargesInput] = useState<string>('');
  const [costData, setCostData] = useState<BatchCostBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    if (batchesLoaded) return;
    const token = getToken();
    if (!token) return;
    setBatchesLoading(true);
    try {
      const all = await getAllBatchesFlat(token);
      setBatches(all.sort((a, b) => a.batchNumber.localeCompare(b.batchNumber)));
      setBatchesLoaded(true);
    } catch {
      // silent — dropdown will be empty
    } finally {
      setBatchesLoading(false);
    }
  }, [batchesLoaded]);

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBatchId) return;
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    setCostData(null);

    const fixedCharges = fixedChargesInput !== '' ? parseFloat(fixedChargesInput) : undefined;

    try {
      const data = await getBatchCost(token, Number(selectedBatchId), fixedCharges);
      setCostData(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors du calcul du cout de revient');
    } finally {
      setLoading(false);
    }
  }

  const profitPositive = costData ? costData.estimatedProfitDH >= 0 : true;

  return (
    <AdminPageShell
      title="Cout de Revient"
      subtitle="Analyse financiere detaillee par lot — achats poussins, alimentation, medicaments et charges fixes."
      accent="brand"
    >
      {/* Selector Panel */}
      <AdminPanel
        title="Parametres du calcul"
        description="Selectionnez un lot et ajustez les charges fixes si necessaire."
        accent="brand"
      >
        <form onSubmit={handleCalculate} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              Lot
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : '')}
              onFocus={loadBatches}
              required
              className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/40 focus:border-[var(--color-brand)]"
            >
              <option value="">{batchesLoading ? 'Chargement...' : 'Selectionner un lot...'}</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} — {b.strain ?? 'N/A'} ({b.status})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-56 flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              Charges Fixes (DH) — optionnel
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fixedChargesInput}
              onChange={(e) => setFixedChargesInput(e.target.value)}
              placeholder="Ex: 1500.00"
              className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/40 focus:border-[var(--color-brand)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedBatchId}
            className="h-10 px-6 rounded-lg bg-[var(--color-brand)] text-white text-sm font-semibold hover:bg-[var(--color-brand)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? 'Calcul...' : 'Calculer'}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </AdminPanel>

      {/* Results */}
      {costData && (
        <>
          {/* Batch Header Info */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] px-5 py-4 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                {costData.batchNumber}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {costData.strain ?? 'Souche inconnue'} &bull; Arrivee le {formatDate(costData.arrivalDate)}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                costData.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700'
                  : costData.status === 'Completed'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {costData.status}
            </span>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Cout Total"
              value={formatDH(costData.totalCostDH)}
              sub={costData.costPerChickenDH != null ? `${formatDH(costData.costPerChickenDH)} / tete` : undefined}
              accent="brand"
            />
            <KpiCard
              label="Revenu Total"
              value={formatDH(costData.totalRevenueDH)}
              sub="Ventes encaissees"
              accent="primary"
            />
            <KpiCard
              label={profitPositive ? 'Benefice Estime' : 'Perte Estimee'}
              value={formatDH(Math.abs(costData.estimatedProfitDH))}
              sub={costData.profitMarginPct != null ? `Marge: ${costData.profitMarginPct.toFixed(1)}%` : undefined}
              accent={profitPositive ? 'success' : 'danger'}
            />
            <KpiCard
              label="Cout / Tete"
              value={costData.costPerChickenDH != null ? formatDH(costData.costPerChickenDH) : '--'}
              sub={`Sur ${costData.aliveChickens.toLocaleString('fr-MA')} survivants`}
              accent="warning"
            />
          </div>

          {/* Cost Decomposition + Mortality */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cost Decomposition */}
            <div className="lg:col-span-2">
              <AdminPanel
                title="Decomposition du Cout"
                description="Part de chaque poste dans le cout total de revient."
                accent="brand"
              >
                <div className="flex flex-col gap-4">
                  <CostRow
                    label="Achats Poussins"
                    amount={costData.chickenCostDH}
                    total={costData.totalCostDH}
                    color="bg-[var(--color-primary)]"
                  />
                  <CostRow
                    label="Alimentation"
                    amount={costData.feedCostDH}
                    total={costData.totalCostDH}
                    color="bg-amber-500"
                  />
                  <CostRow
                    label="Medicaments"
                    amount={costData.medicationCostDH}
                    total={costData.totalCostDH}
                    color="bg-[var(--color-brand)]"
                  />
                  <CostRow
                    label="Charges Fixes"
                    amount={costData.fixedChargesDH}
                    total={costData.totalCostDH}
                    color="bg-slate-400"
                  />
                </div>
              </AdminPanel>
            </div>

            {/* Mortality Stats */}
            <div>
              <AdminPanel
                title="Effectif"
                description="Etat du cheptel sur ce lot."
                accent="primary"
              >
                <div className="flex flex-col gap-3">
                  <StatCard
                    label="Initial"
                    value={costData.initialChickenCount.toLocaleString('fr-MA')}
                    note="poussins a l'arrivee"
                  />
                  <StatCard
                    label="Mortalite"
                    value={costData.totalMortality.toLocaleString('fr-MA')}
                    note={`${costData.initialChickenCount > 0 ? ((costData.totalMortality / costData.initialChickenCount) * 100).toFixed(1) : 0}% du lot`}
                  />
                  <StatCard
                    label="Survivants"
                    value={costData.aliveChickens.toLocaleString('fr-MA')}
                    note="en vie actuellement"
                  />
                </div>
              </AdminPanel>
            </div>
          </div>

          {/* Feed Lines Detail */}
          {costData.feedLines.length > 0 && (
            <AdminPanel
              title="Detail Alimentation"
              description="Consommation par type d'aliment et cout associe."
              accent="stock"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                        Article
                      </th>
                      <th className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                        Type
                      </th>
                      <th className="text-right pb-3 pr-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                        Quantite (kg)
                      </th>
                      <th className="text-right pb-3 pr-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                        Prix Unit. (DH/kg)
                      </th>
                      <th className="text-right pb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                        Sous-Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {costData.feedLines.map((line: FeedLineItem, idx: number) => (
                      <tr
                        key={`${line.stockItemId}-${line.feedType}-${idx}`}
                        className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-2)] transition-colors"
                      >
                        <td className="py-3 pr-4 font-medium text-[var(--color-text-primary)]">
                          {line.stockItemName ?? `Article #${line.stockItemId}`}
                        </td>
                        <td className="py-3 pr-4 text-[var(--color-text-body)]">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-800 font-medium">
                            {line.feedType}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right text-[var(--color-text-body)] tabular-nums">
                          {line.totalQuantityKg.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 pr-4 text-right text-[var(--color-text-body)] tabular-nums">
                          {formatDH(line.unitPriceDH)}
                        </td>
                        <td className="py-3 text-right font-semibold text-[var(--color-text-primary)] tabular-nums">
                          {formatDH(line.subtotalDH)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[var(--color-border)]">
                      <td
                        colSpan={4}
                        className="pt-3 pr-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]"
                      >
                        Total Alimentation
                      </td>
                      <td className="pt-3 text-right font-bold text-[var(--color-brand)] tabular-nums">
                        {formatDH(costData.feedCostDH)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </AdminPanel>
          )}

          {costData.feedLines.length === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-1)] px-6 py-10 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                Aucune ligne d&apos;alimentation enregistree pour ce lot (ou prix unitaire non renseigne sur les articles de stock).
              </p>
            </div>
          )}
        </>
      )}
    </AdminPageShell>
  );
}
