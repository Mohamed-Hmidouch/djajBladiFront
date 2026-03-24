'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, clearTokens, getToken } from '@/lib/jwt';
import { getVetActiveBatches, getVetSanitaryStock } from '@/lib/admin';
import { apiRequest, ApiError } from '@/lib/api';
import { StockType } from '@/types/admin';
import type { BatchResponse, StockItemResponse, CreateHealthRecordRequest } from '@/types/admin';

interface UserInfo { email: string; firstName: string; }

/* ──────────────────────────────────────────────
   Form state
────────────────────────────────────────────── */
const DIAGNOSES = [
  { group: 'Respiratoire (Declarable)', options: ['Newcastle Disease', 'Avian Influenza', 'Infectious Bronchitis'] },
  { group: 'Digestif', options: ['Coccidiosis', 'Salmonellosis', 'Necrotic Enteritis'] },
  { group: 'Autre', options: ['Gumboro Disease', 'Heat Stress', 'Routine Checkup'] },
];

const todayStr = () => new Date().toISOString().split('T')[0];

interface FormState {
  batchId: string;
  diagnosis: string;
  customDiagnosis: string;
  treatment: string;
  examinationDate: string;
  nextVisitDate: string;
  mortalityCount: string;
  treatmentCost: string;
  isDiseaseReported: boolean;
  notes: string;
  isVaccination: boolean;
  stockItemId: string;
  quantityUsed: string;
  withdrawalDays: string;
}

const makeInitialForm = (batchId = ''): FormState => ({
  batchId,
  diagnosis: '',
  customDiagnosis: '',
  treatment: '',
  examinationDate: todayStr(),
  nextVisitDate: '',
  mortalityCount: '',
  treatmentCost: '',
  isDiseaseReported: false,
  notes: '',
  isVaccination: false,
  stockItemId: '',
  quantityUsed: '',
  withdrawalDays: '',
});

/* ──────────────────────────────────────────────
   Health-record form modal (portal)
────────────────────────────────────────────── */
function HealthModal({
  batches,
  stockItems,
  defaultBatchId,
  onClose,
  onSuccess,
}: {
  batches: BatchResponse[];
  stockItems: StockItemResponse[];
  defaultBatchId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<FormState>(makeInitialForm(defaultBatchId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = todayStr();

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selectedStock = stockItems.find((s) => s.id === Number(form.stockItemId)) ?? null;
  const vaccineItems = stockItems.filter((s) => s.type === StockType.VACCINE);
  const usableStockItems = form.isVaccination ? vaccineItems : stockItems;
  const mortalityCount = Number(form.mortalityCount);
  const requiresApproval = form.isDiseaseReported || mortalityCount >= 10;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    if (form.stockItemId && !form.quantityUsed) {
      setError("Veuillez indiquer la quantite utilisee pour l'article de stock selectionne");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateHealthRecordRequest = {
        batchId: Number(form.batchId),
        diagnosis: form.customDiagnosis.trim() || form.diagnosis,
        treatment: form.treatment.trim() || undefined,
        examinationDate: form.examinationDate,
        nextVisitDate: form.nextVisitDate || undefined,
        mortalityCount: form.mortalityCount ? Number(form.mortalityCount) : undefined,
        treatmentCost: form.treatmentCost ? Number(form.treatmentCost) : undefined,
        isDiseaseReported: form.isDiseaseReported,
        notes: form.notes.trim() || undefined,
        isVaccination: form.isVaccination || undefined,
        stockItemId: form.stockItemId ? Number(form.stockItemId) : undefined,
        quantityUsed: form.quantityUsed ? Number(form.quantityUsed) : undefined,
        withdrawalDays: form.withdrawalDays ? Number(form.withdrawalDays) : undefined,
      };
      await apiRequest('/api/vet/health-records', { method: 'POST', body: JSON.stringify(payload), token });
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative w-full sm:max-w-2xl max-h-[95dvh] overflow-y-auto bg-[var(--color-surface-1)] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <p className="text-white/70 text-xs font-medium">Veterinaire</p>
            <h2 className="text-lg font-bold text-white">Nouveau Rapport de Sante</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}

          {/* Lot */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">Lot *</label>
            <select required value={form.batchId} onChange={(e) => setField('batchId', e.target.value)} className={inputCls}>
              <option value="">Selectionner un lot actif</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.batchNumber} — {b.strain} ({b.chickenCount.toLocaleString()} poussins)</option>
              ))}
            </select>
          </div>

          {/* Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">Diagnostic *</label>
              <select value={form.diagnosis} onChange={(e) => setField('diagnosis', e.target.value)} className={inputCls}>
                <option value="">Selectionner...</option>
                {DIAGNOSES.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">Diagnostic personnalise</label>
              <input
                type="text"
                value={form.customDiagnosis}
                onChange={(e) => setField('customDiagnosis', e.target.value)}
                placeholder="Ou saisissez un diagnostic..."
                className={inputCls}
              />
            </div>
          </div>

          {/* Treatment */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">Protocole de traitement</label>
            <textarea
              value={form.treatment}
              onChange={(e) => setField('treatment', e.target.value)}
              rows={2}
              placeholder="Antibiotique 5 jours, isolation..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">Date d&apos;examen *</label>
              <input type="date" required value={form.examinationDate} max={today} onChange={(e) => setField('examinationDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">Prochaine visite</label>
              <input type="date" value={form.nextVisitDate} min={today} onChange={(e) => setField('nextVisitDate', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">Mortalite (nb)</label>
              <input
                type="number" min={0}
                value={form.mortalityCount}
                onChange={(e) => setField('mortalityCount', e.target.value)}
                placeholder="0"
                className={`${inputCls} ${mortalityCount >= 10 ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400' : ''}`}
              />
              {mortalityCount >= 10 && <p className="text-xs text-red-500 mt-1">Approbation admin requise</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">Cout traitement (MAD)</label>
              <input
                type="number" min={0} step={0.01}
                value={form.treatmentCost}
                onChange={(e) => setField('treatmentCost', e.target.value)}
                placeholder="0.00"
                disabled={!!form.stockItemId}
                className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {form.stockItemId && <p className="text-xs text-emerald-600 mt-1">Calcule depuis le stock</p>}
            </div>
          </div>

          {/* Sanitary & Security */}
          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs font-bold text-emerald-800">Sante &amp; Securite Sanitaire</span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => {
                  const next = !form.isVaccination;
                  setField('isVaccination', next);
                  if (!next) { setField('stockItemId', ''); setField('quantityUsed', ''); }
                }}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${form.isVaccination ? 'bg-emerald-500 border-emerald-500' : 'border-emerald-300'}`}
              >
                {form.isVaccination && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                )}
              </div>
              <span className="text-xs font-semibold text-emerald-900">Acte de vaccination</span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-emerald-900 mb-1.5">
                Article de stock{form.isVaccination ? ' (vaccin)' : ' (optionnel)'}
              </label>
              <select
                value={form.stockItemId}
                onChange={(e) => setField('stockItemId', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 bg-white text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              >
                <option value="">-- Aucun article --</option>
                {usableStockItems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.quantity} {s.unit}{s.unitPrice ? ` (${s.unitPrice} MAD/${s.unit})` : ''}
                  </option>
                ))}
              </select>
              {form.isVaccination && vaccineItems.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Aucun vaccin en stock.</p>
              )}
            </div>

            {form.stockItemId && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1.5">
                    Quantite ({selectedStock?.unit || 'unites'}) *
                  </label>
                  <input
                    type="number" required min={0.001} step={0.001}
                    value={form.quantityUsed}
                    onChange={(e) => setField('quantityUsed', e.target.value)}
                    placeholder="0.000"
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white text-[var(--color-text-body)] focus:outline-none focus:ring-2 transition-all text-sm ${selectedStock && Number(form.quantityUsed) > Number(selectedStock.quantity) ? 'border-red-400 focus:ring-red-400/20' : 'border-emerald-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
                  />
                  {selectedStock && Number(form.quantityUsed) > Number(selectedStock.quantity) && (
                    <p className="text-xs text-red-500 mt-1">Stock insuff. — {selectedStock.quantity} {selectedStock.unit}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1.5">Retrait (j)</label>
                  <input
                    type="number" min={0}
                    value={form.withdrawalDays}
                    onChange={(e) => setField('withdrawalDays', e.target.value)}
                    placeholder="7"
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 bg-white text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  />
                  <p className="text-xs text-emerald-700 mt-1">Bloque la vente</p>
                </div>
              </div>
            )}
          </div>

          {/* Disease checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              onClick={() => setField('isDiseaseReported', !form.isDiseaseReported)}
              className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${form.isDiseaseReported ? 'bg-emerald-500 border-emerald-500' : 'border-[var(--color-border)] group-hover:border-emerald-400'}`}
            >
              {form.isDiseaseReported && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">Maladie declaree a l&apos;ONSSA</p>
              <p className="text-xs text-[var(--color-text-muted)]">Necessite approbation admin</p>
            </div>
          </label>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={2}
              placeholder="Isoler les oiseaux, surveiller..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {requiresApproval && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs text-amber-800">Ce rapport necessitera une approbation administrateur.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1 sticky bottom-0 bg-[var(--color-surface-1)] pb-1">
            <button
              type="submit"
              disabled={submitting || (!form.diagnosis && !form.customDiagnosis.trim()) || !form.batchId}
              className="flex-1 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Envoi...
                </span>
              ) : 'Soumettre le rapport'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-3 border-2 border-[var(--color-border)] text-[var(--color-text-body)] text-sm font-semibold rounded-xl hover:bg-[var(--color-surface-2)] transition-all">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ──────────────────────────────────────────────
   Main dashboard page
────────────────────────────────────────────── */
export default function VeterianaireDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [stockItems, setStockItems] = useState<StockItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [modalOpen, setModalOpen] = useState(false);
  const [modalBatchId, setModalBatchId] = useState<string | undefined>(undefined);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setError(null);
      const [allBatches, sanitaryStock] = await Promise.all([
        getVetActiveBatches(token),
        getVetSanitaryStock(token),
      ]);
      setBatches(allBatches);
      setStockItems(sanitaryStock);
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

  function openModal(batchId?: string) {
    setModalBatchId(batchId);
    setModalOpen(true);
  }

  function handleSuccess() {
    setModalOpen(false);
    setSuccessMsg('Rapport soumis avec succes !');
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          {successMsg}
        </div>
      )}

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
          <button
            onClick={() => openModal()}
            className="px-4 py-2.5 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all text-sm shadow-lg"
          >
            + Nouveau Rapport
          </button>
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
          <button onClick={() => openModal()} className="text-xs text-emerald-600 font-semibold hover:underline">
            Nouveau rapport →
          </button>
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
                  <button
                    onClick={() => openModal(String(batch.id))}
                    className="block w-full text-center py-2 bg-emerald-500 text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 active:scale-[0.97] transition-all"
                  >
                    Creer rapport
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating action button (mobile) */}
      <button
        onClick={() => openModal()}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-all z-40"
        aria-label="Nouveau rapport"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {modalOpen && (
        <HealthModal
          batches={batches}
          stockItems={stockItems}
          defaultBatchId={modalBatchId}
          onClose={() => setModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
