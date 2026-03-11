'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearTokens, getToken } from '@/lib/jwt';
import { getOuvrierBatchesFlat, createFeeding } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type { BatchResponse } from '@/types/admin';
import FeedingQuickModal from '@/components/dashboard/FeedingQuickModal';

const FEED_TYPES = [
  { value: 'Pre-Starter', label: 'Pre-Demarrage', days: '0-7j' },
  { value: 'Starter',     label: 'Demarrage',    days: '0-10j' },
  { value: 'Grower',      label: 'Croissance',   days: '11-24j' },
  { value: 'Finisher',    label: 'Finition',     days: '25j+' },
];

export default function OuvrierFeedingPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedingBatch, setFeedingBatch] = useState<BatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setError(null);
      const all = await getOuvrierBatchesFlat(token);
      setBatches(all.filter((b) => b.status === 'Active'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { clearTokens(); router.replace('/login'); return; }
    fetchData();
  }, [router, fetchData, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {feedingBatch && (
        <FeedingQuickModal
          batch={feedingBatch}
          onClose={() => setFeedingBatch(null)}
          onSuccess={() => { setFeedingBatch(null); setRefreshKey((k) => k + 1); }}
        />
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-6 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative">
          <p className="text-white/70 text-xs font-medium mb-1">Ouvrier — Distribution</p>
          <h1 className="text-2xl font-bold mb-1">Alimentation des Lots</h1>
          <p className="text-white/80 text-sm">Enregistrez les distributions d&apos;aliment par lot actif</p>
        </div>
      </div>

      {/* Feed type legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FEED_TYPES.map((ft) => (
          <div key={ft.value} className="bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border)] p-3 text-center">
            <p className="font-bold text-sm text-[var(--color-text-primary)]">{ft.label}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{ft.days}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Batch List */}
      <div className="bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-6">
        <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4">Lots Actifs</h2>
        {batches.length === 0 ? (
          <p className="text-center py-8 text-[var(--color-text-muted)] text-sm">Aucun lot actif</p>
        ) : (
          <div className="space-y-3">
            {batches.map((batch, i) => {
              const days = Math.floor((Date.now() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24));
              const suggestedType = days <= 7 ? 'Pre-Starter' : days <= 10 ? 'Starter' : days <= 24 ? 'Grower' : 'Finisher';
              const ft = FEED_TYPES.find((f) => f.value === suggestedType)!;
              return (
                <div
                  key={batch.id}
                  className="animate-slideUp flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-amber-300 hover:shadow-md transition-all duration-200"
                  style={{ opacity: 0, animationDelay: `${i * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--color-text-primary)] truncate">{batch.batchNumber}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{batch.strain} — {batch.chickenCount.toLocaleString()} poussins — J{days}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg">
                      Phase conseilee: {ft.label}
                    </span>
                  </div>
                  <button
                    onClick={() => setFeedingBatch(batch)}
                    className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 active:scale-[0.97] transition-all text-sm shadow-md shadow-amber-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Distribuer
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
