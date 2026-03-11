'use client';

import { useEffect, useRef, useState } from 'react';
import { createMortality } from '@/lib/admin';
import { getToken } from '@/lib/jwt';
import { ApiError } from '@/lib/api';
import type { BatchResponse } from '@/types/admin';

interface Props {
  batch: BatchResponse;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  recordDate: string;
  mortalityCount: string;
  notes: string;
}

interface FormErrors {
  recordDate?: string;
  mortalityCount?: string;
  global?: string;
}

const HIGH_MORTALITY_THRESHOLD = 10;

export default function MortalityQuickModal({ batch, onClose, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showHighWarning, setShowHighWarning] = useState(false);

  const [form, setForm] = useState<FormState>({
    recordDate: new Date().toISOString().split('T')[0],
    mortalityCount: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showHighWarning) {
          setShowHighWarning(false);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, showHighWarning]);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.recordDate) errs.recordDate = 'La date est obligatoire';
    const today = new Date().toISOString().split('T')[0];
    if (form.recordDate > today) errs.recordDate = 'La date ne peut pas etre dans le futur';
    if (form.recordDate < batch.arrivalDate)
      errs.recordDate = `La date doit etre apres l'arrivee du lot (${batch.arrivalDate})`;

    const count = parseInt(form.mortalityCount, 10);
    if (!form.mortalityCount || isNaN(count) || count < 1)
      errs.mortalityCount = 'Saisissez un nombre valide (minimum 1)';
    if (count > batch.chickenCount)
      errs.mortalityCount = `Depasse le nombre de poussins du lot (${batch.chickenCount.toLocaleString()})`;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function doSubmit() {
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setErrors({});
    try {
      await createMortality(token, {
        batchId: batch.id,
        recordDate: form.recordDate,
        mortalityCount: parseInt(form.mortalityCount, 10),
        notes: form.notes.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Erreur lors de l\'enregistrement';
      setErrors({ global: msg });
      setShowHighWarning(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const count = parseInt(form.mortalityCount, 10);
    if (count > HIGH_MORTALITY_THRESHOLD && !showHighWarning) {
      setShowHighWarning(true);
      return;
    }
    doSubmit();
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function set(field: keyof FormState) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((er) => ({ ...er, [field]: undefined, global: undefined }));
      if (field === 'mortalityCount') setShowHighWarning(false);
    };
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(batch.arrivalDate).getTime()) / 86400000
  );

  const mortalityPct =
    form.mortalityCount && !isNaN(parseInt(form.mortalityCount, 10))
      ? ((parseInt(form.mortalityCount, 10) / batch.chickenCount) * 100).toFixed(2)
      : null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mortality-modal-title"
    >
      <div className="modal-panel">
        {/* Header */}
        <div className="modal-header-mortality">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-widest text-white/70"
                  style={{ letterSpacing: '0.12em' }}
                >
                  Signalement de Mortalite
                </span>
              </div>
              <h2
                id="mortality-modal-title"
                className="text-xl font-bold text-white"
              >
                {batch.batchNumber}
              </h2>
              <p className="text-white/75 text-sm mt-0.5">
                {batch.strain} — {batch.chickenCount.toLocaleString()} pcs — J{daysSince}
                {batch.buildingName && (
                  <span className="ml-1 opacity-80">— {batch.buildingName}</span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center flex-shrink-0 mt-1"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Success State */}
        {success ? (
          <div className="modal-body flex flex-col items-center text-center py-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)' }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
              Mortalite enregistree
            </h3>
            <p className="text-[var(--color-text-muted)] text-sm">
              Le signalement a ete soumis pour le lot {batch.batchNumber}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body" noValidate>
            {/* High Mortality Confirmation Screen */}
            {showHighWarning && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{ background: 'linear-gradient(135deg, #ea580c, #dc2626)' }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">Attention — Mortalite elevee</h3>
                </div>

                <div className="px-4 py-4 rounded-xl border-2 border-orange-300 bg-orange-50 text-sm text-orange-900">
                  <p className="font-medium leading-relaxed">
                    Tu as saisi <span className="font-bold text-red-700">{form.mortalityCount} morts</span>.
                    {mortalityPct && (
                      <> Cela represente <span className="font-bold text-red-700">{mortalityPct}%</span> de l&apos;effectif du lot.</>
                    )}
                  </p>
                  <p className="mt-2 font-semibold">Est-ce bien correct ?</p>
                </div>

                {errors.global && (
                  <div
                    className="px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--color-action-mortality-bg)', color: 'var(--color-action-mortality-text)', border: '1px solid var(--color-action-mortality-border)' }}
                  >
                    {errors.global}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => doSubmit()}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all"
                  style={{ background: 'linear-gradient(135deg, #ea580c, #dc2626)' }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enregistrement...
                    </span>
                  ) : (
                    `Oui, confirmer ${form.mortalityCount} morts`
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowHighWarning(false)}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-all"
                >
                  Non, corriger le chiffre
                </button>
              </div>
            )}

            {/* Main Form */}
            {!showHighWarning && (
            <>
            {errors.global && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--color-action-mortality-bg)',
                  color: 'var(--color-action-mortality-text)',
                  border: '1px solid var(--color-action-mortality-border)',
                }}
              >
                {errors.global}
              </div>
            )}

            {/* Alert banner */}
            <div
              className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{
                background: 'var(--color-action-mortality-bg)',
                border: '1px solid var(--color-action-mortality-border)',
              }}
            >
              <svg
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: 'var(--color-action-mortality)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p
                className="text-xs font-medium leading-relaxed"
                style={{ color: 'var(--color-action-mortality-text)' }}
              >
                Cette action est irreversible. Verifiez les informations avant de confirmer.
                Toute mortalite superieure a 5% sur un lot peut declencher une alerte veterinaire.
              </p>
            </div>

            {/* Date + Count on same row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field">
                <label className="form-label">Date de constat</label>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  min={batch.arrivalDate}
                  className={`form-input form-input-mortality ${errors.recordDate ? 'border-[var(--color-action-mortality)]' : ''}`}
                  value={form.recordDate}
                  onChange={set('recordDate')}
                  disabled={submitting}
                />
                {errors.recordDate && <span className="form-error">{errors.recordDate}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Nombre de morts</label>
                <input
                  type="number"
                  min="1"
                  max={batch.chickenCount}
                  step="1"
                  placeholder="Ex: 12"
                  className={`form-input form-input-mortality ${errors.mortalityCount ? 'border-[var(--color-action-mortality)]' : ''}`}
                  value={form.mortalityCount}
                  onChange={set('mortalityCount')}
                  disabled={submitting}
                />
                {errors.mortalityCount && (
                  <span className="form-error">{errors.mortalityCount}</span>
                )}
              </div>
            </div>

            {/* Live percentage indicator */}
            {mortalityPct !== null && (
              <>
              <div
                className="mb-2 px-4 py-2.5 rounded-xl flex items-center justify-between"
                style={{
                  background:
                    parseFloat(mortalityPct) >= 5
                      ? 'var(--color-action-mortality-bg)'
                      : 'var(--color-surface-2)',
                  border: `1px solid ${parseFloat(mortalityPct) >= 5 ? 'var(--color-action-mortality-border)' : 'var(--color-border)'}`,
                }}
              >
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Taux de mortalite du lot
                </span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color:
                      parseFloat(mortalityPct) >= 5
                        ? 'var(--color-action-mortality)'
                        : parseFloat(mortalityPct) >= 2
                        ? 'var(--color-action-feed)'
                        : 'var(--color-text-primary)',
                  }}
                >
                  {mortalityPct}%
                  {parseFloat(mortalityPct) >= 5 && ' — Alerte'}
                </span>
              </div>
              {parseInt(form.mortalityCount, 10) > HIGH_MORTALITY_THRESHOLD && (
                <div className="mb-4 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-[10px] font-semibold text-orange-700">
                  Chiffre eleve — une confirmation sera demandee
                </div>
              )}
              </>
            )}

            {/* Notes */}
            <div className="form-field">
              <label className="form-label">Cause probable (optionnel)</label>
              <textarea
                rows={2}
                placeholder="Maladie observee, conditions anormales..."
                className="form-input form-input-mortality resize-none"
                value={form.notes}
                onChange={set('notes')}
                disabled={submitting}
                style={{ lineHeight: '1.5' }}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-6">
              <button
                type="submit"
                className="btn-modal-submit-mortality"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enregistrement...
                  </span>
                ) : (
                  'Confirmer le signalement'
                )}
              </button>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={onClose}
                disabled={submitting}
              >
                Annuler
              </button>
            </div>
            </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
