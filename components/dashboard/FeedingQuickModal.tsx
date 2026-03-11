'use client';

import { useEffect, useRef, useState } from 'react';
import { createFeeding, getAllStockFlat } from '@/lib/admin';
import { getToken } from '@/lib/jwt';
import { ApiError } from '@/lib/api';
import type { BatchResponse, StockItemResponse } from '@/types/admin';

const FEED_TYPES = [
  { value: 'Pre-Starter', label: 'Pre-Demarrage' },
  { value: 'Starter',     label: 'Demarrage' },
  { value: 'Grower',      label: 'Croissance' },
  { value: 'Finisher',    label: 'Finition' },
];

interface Props {
  batch: BatchResponse;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  stockItemId: string;
  feedType: string;
  quantity: string;
  feedingDate: string;
  notes: string;
}

interface FormErrors {
  stockItemId?: string;
  feedType?: string;
  quantity?: string;
  feedingDate?: string;
  global?: string;
}

export default function FeedingQuickModal({ batch, onClose, onSuccess }: Props) {
  const [stock, setStock] = useState<StockItemResponse[]>([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<FormState>({
    stockItemId: '',
    feedType: 'Starter',
    quantity: '',
    feedingDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setStockLoading(true);
    getAllStockFlat(token)
      .then((items) => {
        const feedStock = items.filter(
          (s) => s.type === 'Feed' && s.quantity > 0
        );
        setStock(feedStock);
        if (feedStock.length > 0) {
          setForm((f) => ({ ...f, stockItemId: String(feedStock[0].id) }));
        }
      })
      .catch(() => setStock([]))
      .finally(() => setStockLoading(false));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.stockItemId) errs.stockItemId = 'Selectionnez un article de stock';
    if (!form.feedType) errs.feedType = 'Selectionnez le type d\'aliment';
    const qty = parseFloat(form.quantity);
    if (!form.quantity || isNaN(qty) || qty <= 0)
      errs.quantity = 'Saisissez une quantite valide (> 0 kg)';
    if (qty > 10000) errs.quantity = 'Quantite trop elevee (max 10 000 kg)';
    if (!form.feedingDate) errs.feedingDate = 'La date est obligatoire';
    const today = new Date().toISOString().split('T')[0];
    if (form.feedingDate > today) errs.feedingDate = 'La date ne peut pas etre dans le futur';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setErrors({});
    try {
      await createFeeding(token, {
        batchId: batch.id,
        stockItemId: parseInt(form.stockItemId, 10),
        feedType: form.feedType,
        quantity: parseFloat(form.quantity),
        feedingDate: form.feedingDate,
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
    } finally {
      setSubmitting(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  function set(field: keyof FormState) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((er) => ({ ...er, [field]: undefined, global: undefined }));
    };
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(batch.arrivalDate).getTime()) / 86400000
  );

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feeding-modal-title"
    >
      <div className="modal-panel">
        {/* Header */}
        <div className="modal-header-feed">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-widest text-white/70"
                  style={{ letterSpacing: '0.12em' }}
                >
                  Distribution d&apos;Aliment
                </span>
              </div>
              <h2
                id="feeding-modal-title"
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
              style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
              Distribution enregistree
            </h3>
            <p className="text-[var(--color-text-muted)] text-sm">
              L&apos;aliment a ete distribue avec succes pour le lot {batch.batchNumber}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body" noValidate>
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

            {/* Stock Item */}
            <div className="form-field">
              <label className="form-label">
                Article de stock (aliment)
              </label>
              {stockLoading ? (
                <div className="skeleton h-[44px] w-full" />
              ) : stock.length === 0 ? (
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'var(--color-action-feed-bg)',
                    color: 'var(--color-action-feed-text)',
                    border: '1px solid var(--color-action-feed-border)',
                  }}
                >
                  Aucun article de type Aliment en stock. Approvisionnez d&apos;abord.
                </div>
              ) : (
                <div className="relative">
                  <select
                    className={`form-select form-input-feed ${errors.stockItemId ? 'border-[var(--color-action-mortality)]' : ''}`}
                    value={form.stockItemId}
                    onChange={set('stockItemId')}
                    disabled={submitting}
                  >
                    {stock.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || `Aliment #${s.id}`} — {s.quantity} {s.unit} disponible(s)
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
              {errors.stockItemId && (
                <span className="form-error">{errors.stockItemId}</span>
              )}
            </div>

            {/* Feed Type + Quantity on same row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field">
                <label className="form-label">Type d&apos;aliment</label>
                <div className="relative">
                  <select
                    className={`form-select form-input-feed ${errors.feedType ? 'border-[var(--color-action-mortality)]' : ''}`}
                    value={form.feedType}
                    onChange={set('feedType')}
                    disabled={submitting}
                  >
                    {FEED_TYPES.map((ft) => (
                      <option key={ft.value} value={ft.value}>
                        {ft.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {errors.feedType && <span className="form-error">{errors.feedType}</span>}
              </div>

              <div className="form-field">
                <label className="form-label">Quantite (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  max="10000"
                  step="0.1"
                  placeholder="Ex: 150"
                  className={`form-input form-input-feed ${errors.quantity ? 'border-[var(--color-action-mortality)]' : ''}`}
                  value={form.quantity}
                  onChange={set('quantity')}
                  disabled={submitting}
                />
                {errors.quantity && <span className="form-error">{errors.quantity}</span>}
              </div>
            </div>

            {/* Date */}
            <div className="form-field">
              <label className="form-label">Date de distribution</label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                className={`form-input form-input-feed ${errors.feedingDate ? 'border-[var(--color-action-mortality)]' : ''}`}
                value={form.feedingDate}
                onChange={set('feedingDate')}
                disabled={submitting}
              />
              {errors.feedingDate && <span className="form-error">{errors.feedingDate}</span>}
            </div>

            {/* Notes */}
            <div className="form-field">
              <label className="form-label">Notes (optionnel)</label>
              <textarea
                rows={2}
                placeholder="Observations sur la distribution..."
                className="form-input form-input-feed resize-none"
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
                className="btn-modal-submit-feed"
                disabled={submitting || stockLoading || stock.length === 0}
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
                  'Confirmer la distribution'
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
          </form>
        )}
      </div>
    </div>
  );
}
