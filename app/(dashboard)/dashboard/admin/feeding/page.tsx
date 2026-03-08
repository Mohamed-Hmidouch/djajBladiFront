'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getToken } from '@/lib/jwt';
import { getBatches, getStock, createFeeding, getFeedings } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type {
  BatchResponse,
  StockItemResponse,
  CreateFeedingRequest,
  FeedingResponse,
} from '@/types/admin';
import {
  AdminPageShell,
  AdminPanel,
  AdminBentoGrid,
  AdminBentoForm,
  AdminBentoList,
} from '@/components/dashboard/AdminPageShell';

const initialForm: CreateFeedingRequest = {
  batchId: 0,
  stockItemId: 0,
  feedType: '',
  quantity: 0,
  feedingDate: new Date().toISOString().split('T')[0],
};

function StockAvailabilityBadge({ available, requested }: { available: number; requested: number }) {
  const remaining = available - requested;
  const pct = available > 0 ? (requested / available) * 100 : 0;

  let color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let label = 'Stock suffisant';
  if (requested <= 0) {
    color = 'text-[var(--color-text-muted)] bg-[var(--color-surface-2)] border-[var(--color-border)]';
    label = 'Entrez une quantite';
  } else if (remaining < 0) {
    color = 'text-red-600 bg-red-50 border-red-200';
    label = 'Stock insuffisant';
  } else if (pct > 80) {
    color = 'text-amber-600 bg-amber-50 border-amber-200';
    label = 'Stock limite';
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${color} transition-all duration-300`}>
      <div>
        <p className="text-xs font-medium">{label}</p>
        {requested > 0 && (
          <p className="text-xs mt-0.5 opacity-80">
            {remaining >= 0
              ? `Reste apres : ${remaining.toFixed(2)} kg`
              : `Manque : ${Math.abs(remaining).toFixed(2)} kg`}
          </p>
        )}
      </div>
      {available > 0 && requested > 0 && (
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              remaining < 0 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminFeedingPage() {
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [stockItems, setStockItems] = useState<StockItemResponse[]>([]);
  const [feedings, setFeedings] = useState<FeedingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateFeedingRequest>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [filterBatchId, setFilterBatchId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Derived: only Feed stock items
  const feedStockItems = useMemo(
    () => stockItems.filter((s) => s.type === 'Feed'),
    [stockItems]
  );

  // Derived: selected stock item for availability badge
  const selectedStock = useMemo(
    () => feedStockItems.find((s) => s.id === form.stockItemId) ?? null,
    [feedStockItems, form.stockItemId]
  );

  // Derived: active batches only for the selector
  const activeBatches = useMemo(
    () => batches.filter((b) => b.status === 'Active'),
    [batches]
  );

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setError(null);
      const [batchData, stockData, feedingData] = await Promise.all([
        getBatches(token),
        getStock(token),
        getFeedings(token),
      ]);
      setBatches(batchData);
      setStockItems(stockData);
      setFeedings(feedingData);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Erreur lors du chargement des donnees'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-fill feedType when a stock item is selected
  useEffect(() => {
    if (selectedStock) {
      setForm((f) => ({
        ...f,
        feedType: selectedStock.name || 'Aliment',
      }));
    }
  }, [selectedStock]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    // Client-side validation
    if (form.batchId <= 0) {
      setFormError('Veuillez selectionner un lot');
      return;
    }
    if (form.stockItemId <= 0) {
      setFormError('Veuillez selectionner un article de stock');
      return;
    }
    if (form.quantity <= 0) {
      setFormError('La quantite doit etre superieure a 0');
      return;
    }
    if (selectedStock && form.quantity > selectedStock.quantity) {
      setFormError(
        `Stock insuffisant : disponible ${selectedStock.quantity.toFixed(2)} kg, demande ${form.quantity} kg`
      );
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setSuccessMsg(null);

    try {
      const created = await createFeeding(token, form);
      setSuccessMsg(
        `Alimentation enregistree : ${created.quantity} kg deduits du stock "${created.stockItemName || created.feedType}"`
      );
      setForm(initialForm);
      await fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('Erreur lors de la creation');
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Filtered feedings for the list
  const filteredFeedings = useMemo(() => {
    return feedings.filter((f) => {
      const matchesBatch = !filterBatchId || f.batchId === filterBatchId;
      const matchesSearch =
        !searchQuery ||
        f.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.feedType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.stockItemName && f.stockItemName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        f.recordedByName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesBatch && matchesSearch;
    });
  }, [feedings, filterBatchId, searchQuery]);

  // Stats
  const totalFeedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return feedings
      .filter((f) => f.feedingDate === today)
      .reduce((sum, f) => sum + f.quantity, 0);
  }, [feedings]);

  const totalFeedAll = useMemo(
    () => feedings.reduce((sum, f) => sum + f.quantity, 0),
    [feedings]
  );

  const totalFeedStock = useMemo(
    () => feedStockItems.reduce((sum, s) => sum + s.quantity, 0),
    [feedStockItems]
  );

  if (loading) {
    return (
      <AdminPageShell title="Alimentation" subtitle="Chargement..." accent="stock">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell title="Alimentation" subtitle="" accent="stock">
        <div className="bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl p-6 text-center">
          <p className="text-[var(--color-brand)] font-semibold mb-2">Erreur</p>
          <p className="text-[var(--color-text-muted)] text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            Reessayer
          </button>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title="Alimentation"
      subtitle="Enregistrez les distributions d'aliment et suivez la consommation en temps reel avec deduction automatique du stock."
      accent="stock"
    >
      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Consomme aujourd'hui",
            value: `${totalFeedToday.toFixed(1)} kg`,
            gradient: 'from-amber-500 to-amber-600',
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
          },
          {
            label: 'Consommation totale',
            value: `${totalFeedAll.toFixed(1)} kg`,
            gradient: 'from-blue-500 to-blue-600',
            icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
          },
          {
            label: 'Stock aliment restant',
            value: `${totalFeedStock.toFixed(1)} kg`,
            gradient: totalFeedStock < 100 ? 'from-red-500 to-red-600' : 'from-emerald-500 to-emerald-600',
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`animate-slideUp bg-gradient-to-br ${stat.gradient} rounded-2xl p-5 text-white shadow-lg`}
            style={{ opacity: 0, animationDelay: `${i * 0.1}s`, animationFillMode: 'forwards' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-white/70 text-sm font-medium">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <AdminBentoGrid>
        {/* FORM */}
        <AdminBentoForm>
          <AdminPanel
            title="Enregistrer une distribution"
            description="Deduction automatique du stock"
            accent="stock"
          >
            <form onSubmit={handleSubmit} className="space-y-5 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {formError}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600">
                  {successMsg}
                </div>
              )}

              {/* Lot selector */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Lot (batch)
                </label>
                <select
                  required
                  value={form.batchId || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, batchId: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                >
                  <option value="">-- Selectionner un lot actif --</option>
                  {activeBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} - {b.strain} ({b.chickenCount} poussins)
                    </option>
                  ))}
                </select>
                {activeBatches.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Aucun lot actif disponible</p>
                )}
              </div>

              {/* Stock item selector */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Article de stock (aliment)
                </label>
                <select
                  required
                  value={form.stockItemId || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stockItemId: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                >
                  <option value="">-- Selectionner un aliment --</option>
                  {feedStockItems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || 'Aliment'} - {s.quantity.toFixed(2)} {s.unit} disponible
                    </option>
                  ))}
                </select>
                {feedStockItems.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Aucun article de type Aliment en stock
                  </p>
                )}
              </div>

              {/* Availability badge */}
              {selectedStock && (
                <StockAvailabilityBadge
                  available={selectedStock.quantity}
                  requested={form.quantity}
                />
              )}

              {/* Feed type (auto-filled) */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Type d&apos;aliment
                </label>
                <input
                  type="text"
                  required
                  value={form.feedType}
                  onChange={(e) => setForm((f) => ({ ...f, feedType: e.target.value }))}
                  placeholder="Ex: Aliment Demarrage"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                />
              </div>

              {/* Quantity + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Quantite (kg)
                  </label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step={0.01}
                    value={form.quantity || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="50"
                    className={`w-full px-4 py-3 rounded-xl border bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 transition-all duration-200 ${
                      selectedStock && form.quantity > selectedStock.quantity
                        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-[var(--color-border)] focus:ring-amber-500/20 focus:border-amber-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={form.feedingDate}
                    onChange={(e) => setForm((f) => ({ ...f, feedingDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || undefined }))}
                  rows={2}
                  placeholder="Observations..."
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || (selectedStock !== null && form.quantity > selectedStock.quantity)}
                  className="flex-1 px-6 py-3.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer et deduire'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(initialForm);
                    setFormError(null);
                    setSuccessMsg(null);
                  }}
                  className="px-6 py-3.5 border-2 border-[var(--color-border)] text-[var(--color-text-body)] font-semibold rounded-xl hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all duration-200"
                >
                  Annuler
                </button>
              </div>
            </form>
          </AdminPanel>
        </AdminBentoForm>

        {/* FEEDING LIST */}
        <AdminBentoList>
          <AdminPanel
            title="Historique des distributions"
            description={`${feedings.length} enregistrement${feedings.length > 1 ? 's' : ''}`}
            accent="stock"
          >
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fadeIn">
              <div className="relative flex-1">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher par lot, aliment, ouvrier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                />
              </div>
              <select
                value={filterBatchId || ''}
                onChange={(e) => setFilterBatchId(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
              >
                <option value="">Tous les lots</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* List */}
            {filteredFeedings.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-text-muted)]">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <p className="text-lg font-medium">Aucune distribution trouvee</p>
                <p className="text-sm mt-1">
                  Enregistrez une distribution via le formulaire
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFeedings.map((feeding, index) => (
                  <div
                    key={feeding.id}
                    className="animate-slideUp flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] transition-all duration-300 hover:shadow-md"
                    style={{
                      opacity: 0,
                      animationDelay: `${0.05 + index * 0.03}s`,
                      animationFillMode: 'forwards',
                    }}
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[var(--color-text-primary)] truncate">
                          {feeding.feedType}
                        </h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          {feeding.batchNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                        <span>{feeding.feedingDate}</span>
                        <span>par {feeding.recordedByName}</span>
                        {feeding.stockItemName && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600">
                            {feeding.stockItemName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {feeding.quantity}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">kg</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </AdminBentoList>
      </AdminBentoGrid>
    </AdminPageShell>
  );
}
