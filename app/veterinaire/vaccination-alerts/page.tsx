'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearTokens, getToken } from '@/lib/jwt';
import {
  getVaccinationAlerts,
  getOverdueVaccinationAlerts,
  getBatchVaccinationSchedule,
  getVetBatchesFlat,
} from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type { VaccinationAlertResponse, VaccinationScheduleResponse, BatchResponse } from '@/types/admin';

type Tab = 'today' | 'overdue' | 'schedule';

export default function VetVaccinationAlertsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('today');

  const [todayAlerts, setTodayAlerts] = useState<VaccinationAlertResponse[]>([]);
  const [overdueAlerts, setOverdueAlerts] = useState<VaccinationAlertResponse[]>([]);
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [schedule, setSchedule] = useState<VaccinationScheduleResponse[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [today, overdue, allBatches] = await Promise.all([
        getVaccinationAlerts(token),
        getOverdueVaccinationAlerts(token),
        getVetBatchesFlat(token),
      ]);
      setTodayAlerts(today);
      setOverdueAlerts(overdue);
      setBatches(allBatches.filter((b) => b.status === 'Active' || b.status === 'ACTIVE'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { clearTokens(); router.replace('/login'); return; }
    fetchAlerts();
  }, [router, fetchAlerts]);

  async function loadSchedule(batchId: number) {
    const token = getToken();
    if (!token) return;
    setScheduleLoading(true);
    setError(null);
    try {
      const data = await getBatchVaccinationSchedule(token, batchId);
      setSchedule(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors du chargement du planning');
    } finally {
      setScheduleLoading(false);
    }
  }

  function handleBatchChange(id: string) {
    const batchId = id ? Number(id) : null;
    setSelectedBatchId(batchId);
    if (batchId) loadSchedule(batchId);
    else setSchedule([]);
  }

  const tabClass = (t: Tab) =>
    `px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
      tab === t
        ? 'bg-white shadow-sm text-emerald-600'
        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'
    }`;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-6 text-white">
        <div className="relative">
          <p className="text-white/70 text-xs font-medium mb-1">Veterinaire — Vaccinations</p>
          <h1 className="text-2xl font-bold mb-1">Alertes de Vaccination</h1>
          <p className="text-white/80 text-sm">Suivez le calendrier vaccinal de tous les lots actifs</p>
        </div>
        {/* KPI badges */}
        <div className="flex gap-4 mt-4">
          <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
            <p className="text-white/70 text-xs">Aujourd&apos;hui</p>
            <p className="text-2xl font-bold text-white">{todayAlerts.length}</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
            <p className="text-white/70 text-xs">En retard</p>
            <p className={`text-2xl font-bold ${overdueAlerts.length > 0 ? 'text-red-200' : 'text-white'}`}>
              {overdueAlerts.length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--color-surface-2)] rounded-xl w-fit">
        <button onClick={() => setTab('today')} className={tabClass('today')}>
          Aujourd&apos;hui
          {todayAlerts.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">{todayAlerts.length}</span>
          )}
        </button>
        <button onClick={() => setTab('overdue')} className={tabClass('overdue')}>
          En retard
          {overdueAlerts.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700">{overdueAlerts.length}</span>
          )}
        </button>
        <button onClick={() => setTab('schedule')} className={tabClass('schedule')}>Planning par lot</button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* TODAY */}
          {tab === 'today' && (
            <AlertList
              alerts={todayAlerts}
              emptyMessage="Aucune vaccination prevue aujourd'hui"
              emptyIcon="today"
              accent="emerald"
            />
          )}

          {/* OVERDUE */}
          {tab === 'overdue' && (
            <AlertList
              alerts={overdueAlerts}
              emptyMessage="Aucune vaccination en retard"
              emptyIcon="check"
              accent="red"
            />
          )}

          {/* SCHEDULE */}
          {tab === 'schedule' && (
            <div className="bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Selectionner un lot</label>
                <select
                  value={selectedBatchId || ''}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option value="">-- Choisir un lot actif --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} — {b.strain}
                    </option>
                  ))}
                </select>
              </div>

              {scheduleLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                </div>
              ) : selectedBatchId && schedule.length === 0 ? (
                <p className="text-center py-10 text-[var(--color-text-muted)]">Aucun protocole vaccinal pour cette souche.</p>
              ) : schedule.length > 0 ? (
                <div className="space-y-3">
                  {schedule.sort((a, b) => a.dayOfLife - b.dayOfLife).map((item) => (
                    <ScheduleRow key={item.protocolId} item={item} />
                  ))}
                </div>
              ) : (
                <p className="text-center py-10 text-[var(--color-text-muted)]">Selectionnez un lot pour voir son planning.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AlertList({
  alerts,
  emptyMessage,
  emptyIcon,
  accent,
}: {
  alerts: VaccinationAlertResponse[];
  emptyMessage: string;
  emptyIcon: 'today' | 'check';
  accent: 'emerald' | 'red';
}) {
  const accentColor = accent === 'red' ? 'text-red-600' : 'text-emerald-600';
  const accentBg = accent === 'red' ? 'bg-red-50' : 'bg-emerald-50';
  const accentBorder = accent === 'red' ? 'border-red-200' : 'border-emerald-200';

  if (alerts.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--color-text-muted)]">
        <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {emptyIcon === 'check'
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
        </svg>
        <p className="text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={`${alert.batchId}-${alert.protocolId}`}
          className={`flex items-center gap-4 p-4 rounded-2xl border ${accentBorder} ${accentBg} transition-all`}
        >
          {/* Icon */}
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className={`w-6 h-6 ${accentColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-[var(--color-text-primary)]">{alert.vaccineName}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white border border-current text-[var(--color-text-muted)]">
                {alert.batchNumber}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">{alert.strain}</span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Prevu le {new Date(alert.dueDate).toLocaleDateString('fr-FR')}
              {alert.isOverdue && alert.daysOverdue != null && (
                <span className="ml-2 font-semibold text-red-600">— {alert.daysOverdue}j de retard</span>
              )}
            </p>
          </div>

          {alert.isOverdue && (
            <div className="flex-shrink-0">
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">
                EN RETARD
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ScheduleRow({ item }: { item: VaccinationScheduleResponse }) {
  const isPast = new Date(item.dueDate) < new Date();
  const statusColor = item.isCompleted
    ? 'bg-emerald-50 border-emerald-200'
    : isPast
    ? 'bg-red-50 border-red-200'
    : 'bg-[var(--color-surface-1)] border-[var(--color-border)]';

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${statusColor} transition-all`}>
      {/* Day badge */}
      <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-[var(--color-border)] shadow-sm">
        <span className="text-xs text-[var(--color-text-muted)] leading-none">J</span>
        <span className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">{item.dayOfLife}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--color-text-primary)]">{item.vaccineName}</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Prevu le {new Date(item.dueDate).toLocaleDateString('fr-FR')}
          {item.isCompleted && item.completedDate && (
            <span className="ml-2 text-emerald-600">
              — Realise le {new Date(item.completedDate).toLocaleDateString('fr-FR')}
            </span>
          )}
        </p>
      </div>

      <div className="flex-shrink-0">
        {item.isCompleted ? (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            REALISE
          </span>
        ) : isPast ? (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">
            EN RETARD
          </span>
        ) : (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
            PLANIFIE
          </span>
        )}
      </div>
    </div>
  );
}
