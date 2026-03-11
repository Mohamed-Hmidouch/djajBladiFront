'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearTokens, getToken } from '@/lib/jwt';
import { getAllBatchesFlat } from '@/lib/admin';
import { apiRequest } from '@/lib/api';
import { ApiError } from '@/lib/api';
import type { BatchResponse, CreateHealthRecordRequest } from '@/types/admin';

const DIAGNOSES = [
  { group: 'Respiratoire (Declarable)', options: ['Newcastle Disease', 'Avian Influenza', 'Infectious Bronchitis'] },
  { group: 'Digestif', options: ['Coccidiosis', 'Salmonellosis', 'Necrotic Enteritis'] },
  { group: 'Autre', options: ['Gumboro Disease', 'Heat Stress', 'Routine Checkup'] },
];

const today = new Date().toISOString().split('T')[0];

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
}

const initialForm: FormState = {
  batchId: '',
  diagnosis: '',
  customDiagnosis: '',
  treatment: '',
  examinationDate: today,
  nextVisitDate: '',
  mortalityCount: '',
  treatmentCost: '',
  isDiseaseReported: false,
  notes: '',
};

export default function VetHealthPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const all = await getAllBatchesFlat(token);
      setBatches(all.filter((b) => b.status === 'Active'));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { clearTokens(); router.replace('/login'); return; }
    fetchBatches();
  }, [router, fetchBatches]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
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
      };
      await apiRequest('/api/vet/health-records', { method: 'POST', body: JSON.stringify(payload), token });
      setSuccess(true);
      setForm(initialForm);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  }

  const mortalityCount = Number(form.mortalityCount);
  const requiresApproval = form.isDiseaseReported || mortalityCount >= 10;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 text-white">
        <div className="relative">
          <p className="text-white/70 text-xs font-medium mb-1">Veterinaire — Sante</p>
          <h1 className="text-2xl font-bold mb-1">Rapport de Sante</h1>
          <p className="text-white/80 text-sm">Enregistrez un examen clinique pour un lot actif</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-6">
        {success && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            Rapport soumis avec succes !{requiresApproval ? ' En attente d\'approbation admin.' : ''}
          </div>
        )}
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Lot */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Lot *</label>
            <select
              required
              value={form.batchId}
              onChange={(e) => setField('batchId', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="">Selectionner un lot actif</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.batchNumber} — {b.strain} ({b.chickenCount.toLocaleString()} poussins)</option>
              ))}
            </select>
          </div>

          {/* Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Diagnostic *</label>
              <select
                value={form.diagnosis}
                onChange={(e) => setField('diagnosis', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="">Selectionner...</option>
                {DIAGNOSES.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Diagnostic personnalise</label>
              <input
                type="text"
                value={form.customDiagnosis}
                onChange={(e) => setField('customDiagnosis', e.target.value)}
                placeholder="Ou saisissez un diagnostic..."
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Treatment */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Protocole de traitement</label>
            <textarea
              value={form.treatment}
              onChange={(e) => setField('treatment', e.target.value)}
              rows={3}
              placeholder="Antibiotique 5 jours, isolation..."
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Date d&apos;examen *</label>
              <input
                type="date"
                required
                value={form.examinationDate}
                max={today}
                onChange={(e) => setField('examinationDate', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Prochaine visite</label>
              <input
                type="date"
                value={form.nextVisitDate}
                min={today}
                onChange={(e) => setField('nextVisitDate', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Mortalite (nb)</label>
              <input
                type="number"
                min={0}
                value={form.mortalityCount}
                onChange={(e) => setField('mortalityCount', e.target.value)}
                placeholder="0"
                className={`w-full px-4 py-3 rounded-xl border bg-[var(--color-surface-2)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 transition-all ${mortalityCount >= 10 ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400' : 'border-[var(--color-border)] focus:ring-emerald-500/20 focus:border-emerald-500'}`}
              />
              {mortalityCount >= 10 && (
                <p className="text-xs text-red-500 mt-1">Rapport d&apos;approbation requis</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Cout du traitement (MAD)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.treatmentCost}
                onChange={(e) => setField('treatmentCost', e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Checkbox */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={form.isDiseaseReported}
                  onChange={(e) => setField('isDiseaseReported', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.isDiseaseReported ? 'bg-emerald-500 border-emerald-500' : 'border-[var(--color-border)] group-hover:border-emerald-400'}`}>
                  {form.isDiseaseReported && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--color-text-primary)]">Maladie declaree a l&apos;ONSSA</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Necessite une approbation de l&apos;administrateur</p>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Notes supplementaires</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={2}
              placeholder="Isoler les oiseaux, surveiller..."
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {requiresApproval && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm text-amber-800">Ce rapport necessitera une approbation de l&apos;administrateur avant d&apos;etre finalise.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || (!form.diagnosis && !form.customDiagnosis.trim()) || !form.batchId}
              className="flex-1 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Envoi en cours...
                </span>
              ) : 'Soumettre le rapport'}
            </button>
            <button
              type="button"
              onClick={() => setForm(initialForm)}
              className="px-6 py-3.5 border-2 border-[var(--color-border)] text-[var(--color-text-body)] font-semibold rounded-xl hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all"
            >
              Reinitialiser
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
