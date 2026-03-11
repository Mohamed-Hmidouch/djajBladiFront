'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, clearTokens, getToken } from '@/lib/jwt';
import { getOuvrierBatchesFlat, getOuvrierStockFlat, getTodayProgress, getAllMortalitiesFlat } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type { BatchResponse, StockItemResponse, FeedingResponse, MortalityResponse } from '@/types/admin';
import FeedingQuickModal, { getSuggestedFeedType } from '@/components/dashboard/FeedingQuickModal';
import MortalityQuickModal from '@/components/dashboard/MortalityQuickModal';

interface UserInfo { email: string; firstName: string; }

type DayStatus = 'done' | 'partial' | 'pending';

function getDayStatus(
  batchId: number,
  feedings: FeedingResponse[],
  mortalities: MortalityResponse[]
): DayStatus {
  const fed = feedings.some((f) => f.batchId === batchId);
  const mort = mortalities.some((m) => m.batchId === batchId);
  if (fed && mort) return 'done';
  if (fed || mort) return 'partial';
  return 'pending';
}

const STATUS_CFG: Record<DayStatus, { bar: string; badge: string; label: string }> = {
  done:    { bar: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Complet' },
  partial: { bar: 'bg-orange-400',  badge: 'bg-orange-50  border-orange-200  text-orange-700',  label: 'Incomplet' },
  pending: { bar: 'bg-red-400',     badge: 'bg-red-50     border-red-200     text-red-600',     label: 'Non commence' },
};

export default function OuvrierDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeBatches, setActiveBatches] = useState<BatchResponse[]>([]);
  const [stock, setStock] = useState<StockItemResponse[]>([]);
  const [todayFeedings, setTodayFeedings] = useState<FeedingResponse[]>([]);
  const [todayMortalities, setTodayMortalities] = useState<MortalityResponse[]>([]);
  const [cumMortMap, setCumMortMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [feedingBatch, setFeedingBatch] = useState<BatchResponse | null>(null);
  const [mortalityBatch, setMortalityBatch] = useState<BatchResponse | null>(null);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setError(null);
      const [batches, stockItems, progress, allMorts] = await Promise.all([
        getOuvrierBatchesFlat(token),
        getOuvrierStockFlat(token),
        getTodayProgress(token),
        getAllMortalitiesFlat(token),
      ]);
      setActiveBatches(batches.filter((b) => b.status === 'Active'));
      setStock(stockItems);
      setTodayFeedings(progress.feedings);
      setTodayMortalities(progress.mortalities);
      // Build cumulative mortality per batch
      const map: Record<number, number> = {};
      for (const m of allMorts) map[m.batchId] = (map[m.batchId] || 0) + m.mortalityCount;
      setCumMortMap(map);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { clearTokens(); router.replace('/login'); return; }
    const decoded = getCurrentUser();
    if (!decoded || decoded.isExpired) { clearTokens(); router.replace('/login'); return; }
    const name = decoded.email.split('@')[0] || 'Ouvrier';
    setUser({ email: decoded.email, firstName: name.charAt(0).toUpperCase() + name.slice(1) });
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [router, fetchData]);

  const greeting = currentTime.getHours() < 12 ? 'Bonjour' : currentTime.getHours() < 18 ? 'Bon apres-midi' : 'Bonsoir';
  const feedStock = stock.filter((s) => s.type === 'Feed');
  const totalFeedKg = feedStock.reduce((sum, s) => sum + s.quantity, 0);
  const completedCount = activeBatches.filter(
    (b) => getDayStatus(b.id, todayFeedings, todayMortalities) === 'done'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      {feedingBatch && (
        <FeedingQuickModal
          batch={feedingBatch}
          onClose={() => setFeedingBatch(null)}
          onSuccess={() => { setFeedingBatch(null); fetchData(); }}
        />
      )}
      {mortalityBatch && (
        <MortalityQuickModal
          batch={mortalityBatch}
          onClose={() => setMortalityBatch(null)}
          onSuccess={() => { setMortalityBatch(null); fetchData(); }}
        />
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium mb-1">
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold mb-1">{greeting}, {user?.firstName}!</h1>
            <p className="text-white/80 text-sm">Ouvrier — {activeBatches.length} lot(s) actif(s) a surveiller</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/ouvrier/feeding"
              className="px-4 py-2.5 bg-white text-amber-600 font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all text-sm shadow-lg"
            >
              Historique Alimentation
            </Link>
            <Link
              href="/ouvrier/tasks"
              className="px-4 py-2.5 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 active:scale-[0.98] transition-all text-sm border border-white/30"
            >
              Mes Taches
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Lots Actifs', value: activeBatches.length, color: 'from-amber-500 to-orange-500', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
          { label: 'Poussins Totaux', value: activeBatches.reduce((s, b) => s + b.chickenCount, 0).toLocaleString(), color: 'from-yellow-500 to-amber-500', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { label: 'Stock Aliment (kg)', value: totalFeedKg.toLocaleString(), color: 'from-green-500 to-emerald-500', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { label: 'Progression Jour', value: `${completedCount}/${activeBatches.length}`, color: activeBatches.length > 0 && completedCount === activeBatches.length ? 'from-emerald-500 to-green-500' : 'from-rose-500 to-red-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map((kpi, i) => (
          <div
            key={i}
            className={`animate-slideUp bg-gradient-to-br ${kpi.color} rounded-2xl p-5 text-white shadow-lg`}
            style={{ opacity: 0, animationDelay: `${i * 0.06}s`, animationFillMode: 'forwards' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium">{kpi.label}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
              </div>
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={kpi.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Batches — Action Hub */}
      <div className="bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Lots Actifs — Actions Rapides</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Distribuez l&apos;aliment ou signalez une mortalite</p>
          </div>
          {activeBatches.length > 0 && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              completedCount === activeBatches.length
                ? 'bg-emerald-100 text-emerald-700'
                : completedCount > 0
                ? 'bg-orange-100 text-orange-700'
                : 'bg-red-100 text-red-600'
            }`}>
              {completedCount === activeBatches.length ? 'Tout est fait !' : `${completedCount}/${activeBatches.length} termines`}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {activeBatches.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p className="font-medium">Aucun lot actif</p>
            <p className="text-sm mt-1">Aucune action disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBatches.map((batch, i) => {
              const { ageInDays: days, value: feedType, label: feedLabel } = getSuggestedFeedType(batch.arrivalDate);
              const status = getDayStatus(batch.id, todayFeedings, todayMortalities);
              const cfg = STATUS_CFG[status];
              const hasFed  = todayFeedings.some((f) => f.batchId === batch.id);
              const hasMort = todayMortalities.some((m) => m.batchId === batch.id);
              const cumMort = cumMortMap[batch.id] || 0;
              const theoreticalCount = Math.max(0, batch.chickenCount - cumMort);

              return (
                <div
                  key={batch.id}
                  className="animate-slideUp group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:shadow-lg hover:border-amber-300 transition-all duration-300 overflow-hidden"
                  style={{ opacity: 0, animationDelay: `${0.1 + i * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  {/* Top progress bar strip */}
                  <div className={`h-1.5 w-full ${cfg.bar}`} />

                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-[var(--color-text-primary)] text-sm">{batch.batchNumber}</h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{batch.strain}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">J{days}</span>
                      </div>
                    </div>

                    {/* Batch Identity Card — 3 stats */}
                    <div className="grid grid-cols-3 gap-1.5 mb-2.5 text-xs">
                      <div className="bg-[var(--color-surface-1)] rounded-lg p-2 text-center">
                        <p className="text-[var(--color-text-muted)] text-[10px]">Initial</p>
                        <p className="font-bold text-[var(--color-text-primary)]">{batch.chickenCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-[var(--color-surface-1)] rounded-lg p-2 text-center">
                        <p className="text-[var(--color-text-muted)] text-[10px]">Effectif</p>
                        <p className={`font-bold ${cumMort > 0 ? 'text-orange-600' : 'text-[var(--color-text-primary)]'}`}>
                          {theoreticalCount.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-[var(--color-surface-1)] rounded-lg p-2 text-center">
                        <p className="text-[var(--color-text-muted)] text-[10px]">Pertes</p>
                        <p className={`font-bold ${cumMort > 0 ? 'text-red-600' : 'text-[var(--color-text-primary)]'}`}>
                          {cumMort > 0 ? `-${cumMort}` : '0'}
                        </p>
                      </div>
                    </div>

                    {/* Phase + Building */}
                    <div className="grid grid-cols-2 gap-1.5 mb-3 text-xs">
                      <div className="bg-[var(--color-surface-1)] rounded-lg p-2">
                        <p className="text-[var(--color-text-muted)] text-[10px]">Phase</p>
                        <p className="font-bold text-[var(--color-text-primary)]">{feedLabel}</p>
                      </div>
                      {batch.buildingName && (
                        <div className="bg-[var(--color-surface-1)] rounded-lg p-2">
                          <p className="text-[var(--color-text-muted)] text-[10px]">Batiment</p>
                          <p className="font-bold text-[var(--color-text-primary)] truncate">{batch.buildingName}</p>
                        </div>
                      )}
                    </div>

                    {/* Daily micro-status pills */}
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        hasFed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[var(--color-surface-1)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasFed ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        Aliment
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        hasMort ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[var(--color-surface-1)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasMort ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        Mortalite
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setFeedingBatch(batch)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 text-white text-xs font-semibold rounded-xl active:scale-[0.97] transition-all shadow-md ${
                          hasFed ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        {hasFed ? 'Fait' : 'Aliment'}
                      </button>
                      <button
                        onClick={() => setMortalityBatch(batch)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 text-white text-xs font-semibold rounded-xl active:scale-[0.97] transition-all shadow-md ${
                          hasMort ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {hasMort ? 'Fait' : 'Mortalite'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
