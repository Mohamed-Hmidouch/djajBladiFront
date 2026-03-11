'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearTokens, getToken } from '@/lib/jwt';
import { getOuvrierBatchesFlat } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type { BatchResponse } from '@/types/admin';
import MortalityQuickModal from '@/components/dashboard/MortalityQuickModal';

export default function OuvrierTasksPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mortalityBatch, setMortalityBatch] = useState<BatchResponse | null>(null);
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
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mortalityBatch && (
        <MortalityQuickModal
          batch={mortalityBatch}
          onClose={() => setMortalityBatch(null)}
          onSuccess={() => { setMortalityBatch(null); setRefreshKey((k) => k + 1); }}
        />
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 px-8 py-6 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative">
          <p className="text-white/70 text-xs font-medium mb-1">Ouvrier — Surveillance</p>
          <h1 className="text-2xl font-bold mb-1">Signalement Mortalite</h1>
          <p className="text-white/80 text-sm">Signalez les deces de poussins par lot</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="text-sm text-amber-800">Si la mortalite est superieure ou egale a 10, un rapport sera automatiquement soumis pour approbation par l&apos;administrateur.</p>
      </div>

      {/* Batch List */}
      <div className="bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-6">
        <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-4">Lots Actifs</h2>
        {batches.length === 0 ? (
          <p className="text-center py-8 text-[var(--color-text-muted)] text-sm">Aucun lot actif</p>
        ) : (
          <div className="space-y-3">
            {batches.map((batch, i) => {
              const days = Math.floor((Date.now() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={batch.id}
                  className="animate-slideUp flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-red-300 hover:shadow-md transition-all duration-200"
                  style={{ opacity: 0, animationDelay: `${i * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--color-text-primary)] truncate">{batch.batchNumber}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{batch.strain} — {batch.chickenCount.toLocaleString()} poussins — J{days}</p>
                    {batch.buildingName && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Batiment: {batch.buildingName}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setMortalityBatch(batch)}
                    className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 active:scale-[0.97] transition-all text-sm shadow-md shadow-red-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Signaler
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
