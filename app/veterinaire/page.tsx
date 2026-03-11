'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, clearTokens, getToken } from '@/lib/jwt';
import { getAllBatchesFlat, getDashboardAlerts } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type { BatchResponse, HealthAlertSummary } from '@/types/admin';

interface UserInfo { email: string; firstName: string; }

export default function VeterianaireDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setError(null);
      const all = await getAllBatchesFlat(token);
      setBatches(all.filter((b) => b.status === 'Active'));
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
    const name = decoded.email.split('@')[0] || 'Veterinaire';
    setUser({ email: decoded.email, firstName: name.charAt(0).toUpperCase() + name.slice(1) });
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [router, fetchData]);

  const greeting = currentTime.getHours() < 12 ? 'Bonjour' : currentTime.getHours() < 18 ? 'Bon apres-midi' : 'Bonsoir';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium mb-1">
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold mb-1">{greeting}, Dr. {user?.firstName}!</h1>
            <p className="text-white/80 text-sm">Veterinaire — {batches.length} lot(s) actif(s) sous surveillance</p>
          </div>
          <Link
            href="/veterinaire/health"
            className="px-4 py-2.5 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all text-sm shadow-lg"
          >
            Nouveau Rapport Sante
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Lots Surveilles', value: batches.length, color: 'from-emerald-500 to-teal-500', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
          { label: 'Total Poussins', value: batches.reduce((s, b) => s + b.chickenCount, 0).toLocaleString(), color: 'from-teal-500 to-cyan-500', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { label: 'Rapports a soumettre', value: batches.length, color: 'from-green-500 to-emerald-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
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

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Active Batches */}
      <div className="bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">Lots Actifs</h2>
          <Link
            href="/veterinaire/health"
            className="text-xs text-emerald-600 font-semibold hover:underline"
          >
            Nouveau rapport →
          </Link>
        </div>
        {batches.length === 0 ? (
          <p className="text-center py-8 text-[var(--color-text-muted)] text-sm">Aucun lot actif</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch, i) => {
              const days = Math.floor((Date.now() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={batch.id}
                  className="animate-slideUp rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                  style={{ opacity: 0, animationDelay: `${0.1 + i * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-[var(--color-text-primary)] text-sm">{batch.batchNumber}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{batch.strain}</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">J{days}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-[var(--color-surface-1)] rounded-lg p-2">
                      <p className="text-[var(--color-text-muted)]">Poussins</p>
                      <p className="font-bold text-[var(--color-text-primary)]">{batch.chickenCount.toLocaleString()}</p>
                    </div>
                    <div className="bg-[var(--color-surface-1)] rounded-lg p-2">
                      <p className="text-[var(--color-text-muted)]">Batiment</p>
                      <p className="font-bold text-[var(--color-text-primary)] truncate">{batch.buildingName || 'N/A'}</p>
                    </div>
                  </div>
                  <Link
                    href="/veterinaire/health"
                    className="block w-full text-center py-2 bg-emerald-500 text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 active:scale-[0.97] transition-all"
                  >
                    Creer rapport
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
