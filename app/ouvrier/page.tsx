'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, clearTokens, getToken } from '@/lib/jwt';
import { getOuvrierBatchesFlat, getOuvrierStockFlat, createFeeding, createMortality } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type { BatchResponse, StockItemResponse } from '@/types/admin';
import FeedingQuickModal from '@/components/dashboard/FeedingQuickModal';
import MortalityQuickModal from '@/components/dashboard/MortalityQuickModal';

interface UserInfo { email: string; firstName: string; }

const FEED_TYPE_LABELS: Record<string, string> = {
  'Pre-Starter': 'Pre-Demarrage',
  'Starter': 'Demarrage',
  'Grower': 'Croissance',
  'Finisher': 'Finition',
};

export default function OuvrierDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeBatches, setActiveBatches] = useState<BatchResponse[]>([]);
  const [stock, setStock] = useState<StockItemResponse[]>([]);
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
      const [batches, stockItems] = await Promise.all([
        getOuvrierBatchesFlat(token),
        getOuvrierStockFlat(token),
      ]);
      setActiveBatches(batches.filter((b) => b.status === 'Active'));
      setStock(stockItems);
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
          { label: 'Articles Stock', value: stock.length, color: 'from-teal-500 to-cyan-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
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
              const days = Math.floor((Date.now() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24));
              const feedType = days <= 7 ? 'Pre-Starter' : days <= 10 ? 'Starter' : days <= 24 ? 'Grower' : 'Finisher';
              return (
                <div
                  key={batch.id}
                  className="animate-slideUp group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-5 hover:shadow-lg hover:border-amber-300 transition-all duration-300"
                  style={{ opacity: 0, animationDelay: `${0.1 + i * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  {/* Batch info */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-[var(--color-text-primary)] text-sm">{batch.batchNumber}</h3>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{batch.strain}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">J{days}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="bg-[var(--color-surface-1)] rounded-lg p-2">
                      <p className="text-[var(--color-text-muted)]">Poussins</p>
                      <p className="font-bold text-[var(--color-text-primary)]">{batch.chickenCount.toLocaleString()}</p>
                    </div>
                    <div className="bg-[var(--color-surface-1)] rounded-lg p-2">
                      <p className="text-[var(--color-text-muted)]">Phase</p>
                      <p className="font-bold text-[var(--color-text-primary)]">{FEED_TYPE_LABELS[feedType]}</p>
                    </div>
                    {batch.buildingName && (
                      <div className="col-span-2 bg-[var(--color-surface-1)] rounded-lg p-2">
                        <p className="text-[var(--color-text-muted)]">Batiment</p>
                        <p className="font-bold text-[var(--color-text-primary)] truncate">{batch.buildingName}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFeedingBatch(batch)}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 active:scale-[0.97] transition-all shadow-md shadow-amber-500/20"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      Aliment
                    </button>
                    <button
                      onClick={() => setMortalityBatch(batch)}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-red-500 text-white text-xs font-semibold rounded-xl hover:bg-red-600 active:scale-[0.97] transition-all shadow-md shadow-red-500/20"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Mortalite
                    </button>
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
