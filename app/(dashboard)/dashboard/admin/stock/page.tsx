'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getToken } from '@/lib/jwt';
import { getStock, createStockItem, getAllBatchesFlat, createFeeding, getFeedings, getAllStockFlat } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import { StockType } from '@/types/admin';
import type {
  StockItemResponse,
  CreateStockRequest,
  BatchResponse,
  CreateFeedingRequest,
  FeedingResponse,
} from '@/types/admin';
import {
  AdminPageShell,
  AdminPanel,
  AdminBentoGrid,
  AdminBentoForm,
  AdminBentoList,
  Pagination,
} from '@/components/dashboard';

const typeConfig = {
  Feed: {
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    label: 'Aliment',
    pluralLabel: 'Aliments',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  Vaccine: {
    color: 'rose',
    gradient: 'from-rose-500 to-rose-600',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    label: 'Vaccin',
    pluralLabel: 'Vaccins',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  },
  Vitamin: {
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    label: 'Vitamine',
    pluralLabel: 'Vitamines',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
};

function DonutChart({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let accumulated = 0;
  if (total === 0) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-border)" strokeWidth="3" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">0</p>
            <p className="text-xs text-[var(--color-text-muted)]">Total</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        {data.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          const dashArray = `${percentage} ${100 - percentage}`;
          const dashOffset = -accumulated;
          accumulated += percentage;
          return (
            <circle
              key={index}
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={segment.color}
              strokeWidth="3"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{ animationDelay: `${index * 0.15}s` }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{total}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Total</p>
        </div>
      </div>
    </div>
  );
}

const initialForm: CreateStockRequest = {
  type: StockType.Feed,
  name: '',
  quantity: 0,
  unit: 'sac',
};

const initialFeedingForm: CreateFeedingRequest = {
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
            {remaining >= 0 ? `Reste apres : ${remaining.toFixed(2)} kg` : `Manque : ${Math.abs(remaining).toFixed(2)} kg`}
          </p>
        )}
      </div>
      {available > 0 && requested > 0 && (
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${remaining < 0 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 5;

export default function AdminStockPage() {
  // Paginated stock list
  const [stock, setStock] = useState<StockItemResponse[]>([]);
  const [stockPage, setStockPage] = useState(0);
  const [stockTotalPages, setStockTotalPages] = useState(0);
  const [stockTotalElements, setStockTotalElements] = useState(0);
  const [stockPageLoading, setStockPageLoading] = useState(false);

  // Paginated feedings list
  const [feedings, setFeedings] = useState<FeedingResponse[]>([]);
  const [feedingPage, setFeedingPage] = useState(0);
  const [feedingTotalPages, setFeedingTotalPages] = useState(0);
  const [feedingTotalElements, setFeedingTotalElements] = useState(0);
  const [feedingPageLoading, setFeedingPageLoading] = useState(false);

  // Flat data for forms + donut chart
  const [allStockFlat, setAllStockFlat] = useState<StockItemResponse[]>([]);
  const [allBatchesFlat, setAllBatchesFlat] = useState<BatchResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeTab, setActiveTab] = useState<'stock' | 'feeding'>('stock');

  // Stock form
  const [form, setForm] = useState<CreateStockRequest>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Feeding form
  const [feedingForm, setFeedingForm] = useState<CreateFeedingRequest>(initialFeedingForm);
  const [feedingFormError, setFeedingFormError] = useState<string | null>(null);
  const [feedingSubmitting, setFeedingSubmitting] = useState(false);
  const [feedingSuccess, setFeedingSuccess] = useState<string | null>(null);
  const [feedingSearch, setFeedingSearch] = useState('');
  const [filterBatchId, setFilterBatchId] = useState<number | null>(null);

  // Derived from flat data (for forms + charts)
  const feedStockItems = useMemo(() => allStockFlat.filter((s) => s.type === 'Feed'), [allStockFlat]);
  const selectedStock = useMemo(
    () => feedStockItems.find((s) => s.id === feedingForm.stockItemId) ?? null,
    [feedStockItems, feedingForm.stockItemId]
  );
  const activeBatches = useMemo(() => allBatchesFlat.filter((b) => b.status === 'Active'), [allBatchesFlat]);

  const fetchStockPage = useCallback(async (page: number) => {
    const token = getToken();
    if (!token) return;
    const result = await getStock(token, page, PAGE_SIZE);
    setStock(result.content);
    setStockPage(result.page);
    setStockTotalPages(result.totalPages);
    setStockTotalElements(result.totalElements);
  }, []);

  const fetchFeedingPage = useCallback(async (page: number) => {
    const token = getToken();
    if (!token) return;
    const result = await getFeedings(token, {}, page, PAGE_SIZE);
    setFeedings(result.content);
    setFeedingPage(result.page);
    setFeedingTotalPages(result.totalPages);
    setFeedingTotalElements(result.totalElements);
  }, []);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setError(null);
      const [stockPage0, feedingPage0, flatStock, flatBatches] = await Promise.all([
        getStock(token, 0, PAGE_SIZE),
        getFeedings(token, {}, 0, PAGE_SIZE),
        getAllStockFlat(token),
        getAllBatchesFlat(token),
      ]);
      setStock(stockPage0.content);
      setStockPage(stockPage0.page);
      setStockTotalPages(stockPage0.totalPages);
      setStockTotalElements(stockPage0.totalElements);
      setFeedings(feedingPage0.content);
      setFeedingPage(feedingPage0.page);
      setFeedingTotalPages(feedingPage0.totalPages);
      setFeedingTotalElements(feedingPage0.totalElements);
      setAllStockFlat(flatStock);
      setAllBatchesFlat(flatBatches);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors du chargement du stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedStock) {
      setFeedingForm((f) => ({ ...f, feedType: selectedStock.name || 'Aliment' }));
    }
  }, [selectedStock]);

  function handleStockPageChange(newPage: number) {
    setStockPageLoading(true);
    fetchStockPage(newPage).finally(() => setStockPageLoading(false));
  }

  function handleFeedingPageChange(newPage: number) {
    setFeedingPageLoading(true);
    fetchFeedingPage(newPage).finally(() => setFeedingPageLoading(false));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createStockItem(token, {
        type: form.type,
        name: form.name || undefined,
        quantity: form.quantity,
        unit: form.unit,
      });
      setForm(initialForm);
      await fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la creation');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFeedingSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    if (feedingForm.batchId <= 0) { setFeedingFormError('Veuillez selectionner un lot'); return; }
    if (feedingForm.stockItemId <= 0) { setFeedingFormError('Veuillez selectionner un article de stock'); return; }
    if (feedingForm.quantity <= 0) { setFeedingFormError('La quantite doit etre superieure a 0'); return; }
    if (selectedStock && feedingForm.quantity > selectedStock.quantity) {
      setFeedingFormError(`Stock insuffisant : disponible ${selectedStock.quantity.toFixed(2)} kg, demande ${feedingForm.quantity} kg`);
      return;
    }
    setFeedingSubmitting(true);
    setFeedingFormError(null);
    setFeedingSuccess(null);
    try {
      const created = await createFeeding(token, feedingForm);
      setFeedingSuccess(`Distribution enregistree : ${created.quantity} kg deduits du stock "${created.stockItemName || created.feedType}"`);
      setFeedingForm(initialFeedingForm);
      await fetchData();
    } catch (err) {
      setFeedingFormError(err instanceof ApiError ? err.message : 'Erreur lors de la creation');
    } finally {
      setFeedingSubmitting(false);
    }
  }

  // Chart data from flat stock
  const feedCount = allStockFlat.filter((s) => s.type === 'Feed').reduce((sum, s) => sum + s.quantity, 0);
  const vaccineCount = allStockFlat.filter((s) => s.type === 'Vaccine').reduce((sum, s) => sum + s.quantity, 0);
  const vitaminCount = allStockFlat.filter((s) => s.type === 'Vitamin').reduce((sum, s) => sum + s.quantity, 0);

  const chartData = [
    { label: 'Aliments', value: feedCount, color: '#f59e0b' },
    { label: 'Vaccins', value: vaccineCount, color: '#f43f5e' },
    { label: 'Vitamines', value: vitaminCount, color: '#10b981' },
  ];

  const filteredStock = stock.filter((item) => {
    const matchesType = !selectedType || item.type === selectedType;
    const matchesSearch = !searchQuery ||
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredFeedings = feedings.filter((f) => {
    const matchesBatch = !filterBatchId || f.batchId === filterBatchId;
    const matchesSearch =
      !feedingSearch ||
      f.batchNumber.toLowerCase().includes(feedingSearch.toLowerCase()) ||
      f.feedType.toLowerCase().includes(feedingSearch.toLowerCase()) ||
      (f.stockItemName && f.stockItemName.toLowerCase().includes(feedingSearch.toLowerCase())) ||
      f.recordedByName.toLowerCase().includes(feedingSearch.toLowerCase());
    return matchesBatch && matchesSearch;
  });

  const totalFeedToday = feedings
    .filter((f) => f.feedingDate === new Date().toISOString().split('T')[0])
    .reduce((sum, f) => sum + f.quantity, 0);

  if (loading) {
    return (
      <AdminPageShell title="Gestion du Stock" subtitle="Chargement..." accent="stock">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell title="Gestion du Stock" subtitle="" accent="stock">
        <div className="bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl p-6 text-center">
          <p className="text-[var(--color-brand)] font-semibold mb-2">Erreur</p>
          <p className="text-[var(--color-text-muted)] text-sm">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
            Reessayer
          </button>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title="Gestion du Stock"
      subtitle="Gerez votre inventaire et les distributions d'aliments avec deduction automatique du stock."
      accent="stock"
    >
      {/* STATS OVERVIEW WITH DONUT CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Repartition du Stock</h3>
          <div className="flex items-center justify-center">
            <DonutChart data={chartData} size={160} />
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {chartData.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-[var(--color-text-muted)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { type: 'Feed' as StockType, count: feedCount, unit: 'unites', extra: totalFeedToday > 0 ? `${totalFeedToday.toFixed(0)} kg distribue auj.` : undefined },
            { type: 'Vaccine' as StockType, count: vaccineCount, unit: 'unites' },
            { type: 'Vitamin' as StockType, count: vitaminCount, unit: 'unites' },
          ]).map((cat, index) => {
            const cfg = typeConfig[cat.type];
            return (
              <div
                key={cat.type}
                onClick={() => setSelectedType(selectedType === cat.type ? null : cat.type)}
                className={`animate-slideUp cursor-pointer bg-gradient-to-br ${cfg.gradient} rounded-2xl p-5 text-white shadow-lg card-lift ${selectedType === cat.type ? 'ring-4 ring-white/30' : ''}`}
                style={{ opacity: 0, animationDelay: `${0.1 + index * 0.1}s`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                    </svg>
                  </div>
                </div>
                <p className="text-white/70 text-sm font-medium">{cfg.pluralLabel}</p>
                <p className="text-3xl font-bold mt-1">{cat.count}</p>
                <p className="text-white/60 text-sm">{cat.unit}</p>
                {cat.extra && <p className="text-white/50 text-xs mt-1">{cat.extra}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div className="flex gap-1 p-1 bg-[var(--color-surface-2)] rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'stock' ? 'bg-white shadow-sm text-amber-600' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}
        >
          Inventaire
        </button>
        <button
          onClick={() => setActiveTab('feeding')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'feeding' ? 'bg-white shadow-sm text-amber-600' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}
        >
          Distribution d&apos;aliment
        </button>
      </div>

      {/* ===================== TAB: INVENTAIRE ===================== */}
      {activeTab === 'stock' && (
        <AdminBentoGrid>
          <AdminBentoForm>
            <AdminPanel title="Ajouter au Stock" description="Enregistrer un nouvel article" accent="stock">
              <form onSubmit={handleSubmit} className="space-y-5 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
                {formError && (
                  <div className="p-3 bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl text-sm text-[var(--color-brand)]">{formError}</div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">Type d&apos;article</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([StockType.Feed, StockType.Vaccine, StockType.Vitamin]).map((type) => {
                      const cfg = typeConfig[type];
                      return (
                        <button key={type} type="button" onClick={() => setForm((f) => ({ ...f, type }))} className={`p-3 rounded-xl border-2 transition-all duration-200 ${cfg.bgLight} ${cfg.borderColor} hover:shadow-md active:scale-[0.98] ${form.type === type ? 'ring-2 ring-offset-1 ring-amber-400 shadow-md' : ''}`}>
                          <svg className={`w-6 h-6 mx-auto mb-1 ${cfg.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} /></svg>
                          <p className={`text-xs font-medium ${cfg.textColor}`}>{cfg.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Nom de l&apos;article</label>
                  <input type="text" value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Aliment Demarrage" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Quantite</label>
                    <input type="number" required min={1} value={form.quantity || ''} onChange={(e) => setForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} placeholder="100" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Unite</label>
                    <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200">
                      <option>sac</option>
                      <option>dose</option>
                      <option>flacon</option>
                      <option>kg</option>
                      <option>sachet</option>
                      <option>litre</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="flex-1 px-6 py-3.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-500/25 disabled:opacity-50">
                    {submitting ? 'Enregistrement...' : 'Ajouter au stock'}
                  </button>
                  <button type="button" onClick={() => { setForm(initialForm); setFormError(null); }} className="px-6 py-3.5 border-2 border-[var(--color-border)] text-[var(--color-text-body)] font-semibold rounded-xl hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all duration-200">
                    Annuler
                  </button>
                </div>
              </form>
            </AdminPanel>
          </AdminBentoForm>

          <AdminBentoList>
            <AdminPanel title="Inventaire Complet" description={`${stockTotalElements} articles en stock`} accent="stock">
              <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fadeIn">
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Rechercher un article..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200" />
                </div>
                <div className="flex gap-1 p-1 bg-[var(--color-surface-2)] rounded-lg">
                  {[
                    { key: null, label: 'Tous' },
                    { key: 'Feed', label: 'Aliments' },
                    { key: 'Vaccine', label: 'Vaccins' },
                    { key: 'Vitamin', label: 'Vitamines' },
                  ].map((tab) => (
                    <button key={tab.key || 'all'} onClick={() => setSelectedType(tab.key)} className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${selectedType === tab.key ? 'bg-white shadow-sm text-amber-600' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {stockPageLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
                </div>
              ) : filteredStock.length === 0 ? (
                <div className="text-center py-12 text-[var(--color-text-muted)]">
                  <p className="text-lg font-medium">Aucun article trouve</p>
                  <p className="text-sm mt-1">Ajoutez un article via le formulaire</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStock.map((item, index) => {
                    const config = typeConfig[item.type as keyof typeof typeConfig] || typeConfig.Feed;
                    return (
                      <div key={item.id} className="animate-slideUp flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] transition-all duration-300 hover:shadow-md" style={{ opacity: 0, animationDelay: `${0.05 + index * 0.03}s`, animationFillMode: 'forwards' }}>
                        <div className={`w-12 h-12 ${config.bgLight} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <svg className={`w-6 h-6 ${config.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[var(--color-text-primary)] truncate">{item.name || config.label}</h4>
                          <p className="text-sm text-[var(--color-text-muted)]">{config.pluralLabel}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-bold text-[var(--color-text-primary)]">{item.quantity}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{item.unit}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Pagination
                page={stockPage}
                totalPages={stockTotalPages}
                totalElements={stockTotalElements}
                size={PAGE_SIZE}
                onPageChange={handleStockPageChange}
                loading={stockPageLoading}
              />
            </AdminPanel>
          </AdminBentoList>
        </AdminBentoGrid>
      )}

      {/* ===================== TAB: DISTRIBUTION D'ALIMENT ===================== */}
      {activeTab === 'feeding' && (
        <AdminBentoGrid>
          <AdminBentoForm>
            <AdminPanel title="Distribuer de l'aliment" description="Deduction automatique du stock" accent="stock">
              <form onSubmit={handleFeedingSubmit} className="space-y-5 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
                {feedingFormError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{feedingFormError}</div>
                )}
                {feedingSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600">{feedingSuccess}</div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Lot (batch)</label>
                  <select required value={feedingForm.batchId || ''} onChange={(e) => setFeedingForm((f) => ({ ...f, batchId: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200">
                    <option value="">-- Selectionner un lot actif --</option>
                    {activeBatches.map((b) => (
                      <option key={b.id} value={b.id}>{b.batchNumber} - {b.strain} ({b.chickenCount} poussins)</option>
                    ))}
                  </select>
                  {activeBatches.length === 0 && <p className="text-xs text-amber-600 mt-1">Aucun lot actif disponible</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Article de stock (aliment)</label>
                  <select required value={feedingForm.stockItemId || ''} onChange={(e) => setFeedingForm((f) => ({ ...f, stockItemId: parseInt(e.target.value) || 0 }))} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200">
                    <option value="">-- Selectionner un aliment --</option>
                    {feedStockItems.map((s) => (
                      <option key={s.id} value={s.id}>{s.name || 'Aliment'} - {s.quantity.toFixed(2)} {s.unit} disponible</option>
                    ))}
                  </select>
                  {feedStockItems.length === 0 && <p className="text-xs text-red-600 mt-1">Aucun article de type Aliment en stock</p>}
                </div>

                {selectedStock && (
                  <StockAvailabilityBadge available={selectedStock.quantity} requested={feedingForm.quantity} />
                )}

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Type d&apos;aliment</label>
                  <input type="text" required value={feedingForm.feedType} onChange={(e) => setFeedingForm((f) => ({ ...f, feedType: e.target.value }))} placeholder="Ex: Aliment Demarrage" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Quantite (kg)</label>
                    <input type="number" required min={0.01} step={0.01} value={feedingForm.quantity || ''} onChange={(e) => setFeedingForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} placeholder="50" className={`w-full px-4 py-3 rounded-xl border bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 transition-all duration-200 ${selectedStock && feedingForm.quantity > selectedStock.quantity ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-[var(--color-border)] focus:ring-amber-500/20 focus:border-amber-500'}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Date</label>
                    <input type="date" required max={new Date().toISOString().split('T')[0]} value={feedingForm.feedingDate} onChange={(e) => setFeedingForm((f) => ({ ...f, feedingDate: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Notes (optionnel)</label>
                  <textarea value={feedingForm.notes || ''} onChange={(e) => setFeedingForm((f) => ({ ...f, notes: e.target.value || undefined }))} rows={2} placeholder="Observations..." className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 resize-none" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={feedingSubmitting || (selectedStock !== null && feedingForm.quantity > selectedStock.quantity)} className="flex-1 px-6 py-3.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
                    {feedingSubmitting ? 'Enregistrement...' : 'Distribuer et deduire'}
                  </button>
                  <button type="button" onClick={() => { setFeedingForm(initialFeedingForm); setFeedingFormError(null); setFeedingSuccess(null); }} className="px-6 py-3.5 border-2 border-[var(--color-border)] text-[var(--color-text-body)] font-semibold rounded-xl hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all duration-200">
                    Annuler
                  </button>
                </div>
              </form>
            </AdminPanel>
          </AdminBentoForm>

          <AdminBentoList>
            <AdminPanel title="Historique des distributions" description={`${feedingTotalElements} enregistrement${feedingTotalElements > 1 ? 's' : ''}`} accent="stock">
              <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fadeIn">
                <div className="relative flex-1">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Rechercher par lot, aliment, ouvrier..." value={feedingSearch} onChange={(e) => setFeedingSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200" />
                </div>
                <select value={filterBatchId || ''} onChange={(e) => setFilterBatchId(e.target.value ? parseInt(e.target.value) : null)} className="px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200">
                  <option value="">Tous les lots</option>
                  {allBatchesFlat.map((b) => (
                    <option key={b.id} value={b.id}>{b.batchNumber}</option>
                  ))}
                </select>
              </div>

              {feedingPageLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
                </div>
              ) : filteredFeedings.length === 0 ? (
                <div className="text-center py-12 text-[var(--color-text-muted)]">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-lg font-medium">Aucune distribution trouvee</p>
                  <p className="text-sm mt-1">Enregistrez une distribution via le formulaire</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFeedings.map((feeding, index) => (
                    <div key={feeding.id} className="animate-slideUp flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] transition-all duration-300 hover:shadow-md" style={{ opacity: 0, animationDelay: `${0.05 + index * 0.03}s`, animationFillMode: 'forwards' }}>
                      <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-[var(--color-text-primary)] truncate">{feeding.feedType}</h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{feeding.batchNumber}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                          <span>{feeding.feedingDate}</span>
                          <span>par {feeding.recordedByName}</span>
                          {feeding.stockItemName && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600">{feeding.stockItemName}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-[var(--color-text-primary)]">{feeding.quantity}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">kg</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Pagination
                page={feedingPage}
                totalPages={feedingTotalPages}
                totalElements={feedingTotalElements}
                size={PAGE_SIZE}
                onPageChange={handleFeedingPageChange}
                loading={feedingPageLoading}
              />
            </AdminPanel>
          </AdminBentoList>
        </AdminBentoGrid>
      )}
    </AdminPageShell>
  );
}
