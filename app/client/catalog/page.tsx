'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getToken } from '@/lib/jwt';
import { placeOrder } from '@/lib/client';
import { useClientData } from '@/hooks/useClientData';
import type { AvailableBatchResponse, PurchaseOrderRequest } from '@/types/client';

function formatPrice(value: number) {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BatchCard({
  batch,
  onOrder,
}: {
  batch: AvailableBatchResponse;
  onOrder: (b: AvailableBatchResponse) => void;
}) {
  return (
    <div className="client-batch-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)', margin: 0 }}>
            {batch.strain}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
            Lot {batch.batchNumber}
          </p>
        </div>
        <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-brand)', fontFamily: 'var(--font-heading)' }}>
          {formatPrice(batch.pricePerUnit)} DH
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <span className="client-badge client-badge--stock">
          {batch.availableQuantity} disponibles
        </span>
        <span className="client-badge" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-body)' }}>
          {batch.ageInDays} jours
        </span>
        {batch.minimumOrderQuantity > 1 && (
          <span className="client-badge" style={{ background: '#FEF3C7', color: '#92400E' }}>
            Min. {batch.minimumOrderQuantity}
          </span>
        )}
      </div>

      {batch.buildingName && (
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
          Batiment : {batch.buildingName}
        </p>
      )}

      <button className="client-cta" onClick={() => onOrder(batch)}>
        Commander
      </button>
    </div>
  );
}

function OrderSheet({
  batch,
  onClose,
  onSuccess,
}: {
  batch: AvailableBatchResponse;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState(batch.minimumOrderQuantity);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = quantity * batch.pricePerUnit;

  const handleSubmit = async () => {
    if (!address.trim()) {
      toast.error('Veuillez saisir une adresse de livraison');
      return;
    }
    const token = getToken();
    if (!token) return;

    setSubmitting(true);
    try {
      const body: PurchaseOrderRequest = {
        batchId: batch.batchId,
        quantity,
        deliveryAddress: address.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
      await placeOrder(token, body);
      toast.success('Commande passee avec succes !');
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la commande';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="client-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="client-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        <div className="client-sheet-handle" />

        <div className="client-sheet-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)', margin: 0 }}>
              Commander
            </h2>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
              aria-label="Fermer"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            {batch.strain} - Lot {batch.batchNumber}
          </p>
        </div>

        <div className="client-sheet-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Quantity stepper */}
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="form-label">Quantite</label>
            <div className="client-stepper">
              <button
                className="client-stepper-btn"
                onClick={() => setQuantity((q) => Math.max(batch.minimumOrderQuantity, q - 1))}
                disabled={quantity <= batch.minimumOrderQuantity}
                type="button"
              >
                -
              </button>
              <span className="client-stepper-value">{quantity}</span>
              <button
                className="client-stepper-btn"
                onClick={() => setQuantity((q) => Math.min(batch.availableQuantity, q + 1))}
                disabled={quantity >= batch.availableQuantity}
                type="button"
              >
                +
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              Min. {batch.minimumOrderQuantity} / Max. {batch.availableQuantity} unites
            </p>
          </div>

          {/* Address */}
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="form-label">Adresse de livraison</label>
            <textarea
              className="form-input"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Saisissez votre adresse complete"
              style={{ resize: 'none', fontFamily: 'var(--font-body)' }}
            />
          </div>

          {/* Notes */}
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes (optionnel)</label>
            <textarea
              className="form-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions supplementaires..."
              style={{ resize: 'none', fontFamily: 'var(--font-body)' }}
            />
          </div>

          {/* Total */}
          <div
            style={{
              background: 'var(--color-surface-2)',
              borderRadius: '12px',
              padding: 'var(--space-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand)', fontFamily: 'var(--font-heading)' }}>
              {formatPrice(total)} DH
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <button
              className="client-cta"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Envoi en cours...' : 'Confirmer la commande'}
            </button>
            <button className="client-cta client-cta--outline" onClick={onClose} type="button">
              Annuler
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--space-sm)' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton client-skeleton-card" />
      ))}
      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '8px' }}>
        Chargement du catalogue...
      </p>
    </div>
  );
}

export default function CatalogPage() {
  const { batches, loading, error, refresh } = useClientData();
  const [selectedBatch, setSelectedBatch] = useState<AvailableBatchResponse | null>(null);

  const handleOrderSuccess = async () => {
    setSelectedBatch(null);
    await refresh();
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="client-empty">
        <div className="client-empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-action-mortality)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <p className="client-empty-title">Erreur de chargement</p>
        <p className="client-empty-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--space-md)' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary)', margin: 0 }}>
          Catalogue
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
          {batches.length} lot{batches.length !== 1 ? 's' : ''} disponible{batches.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Batch list */}
      {batches.length === 0 ? (
        <div className="client-empty">
          <div className="client-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <p className="client-empty-title">Aucun lot disponible</p>
          <p className="client-empty-text">Revenez bientot, de nouveaux lots seront disponibles prochainement</p>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 'var(--space-sm)' }}>
          {batches.map((batch, i) => (
            <motion.div
              key={batch.batchId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <BatchCard batch={batch} onOrder={setSelectedBatch} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Order Bottom Sheet */}
      <AnimatePresence>
        {selectedBatch && (
          <OrderSheet
            batch={selectedBatch}
            onClose={() => setSelectedBatch(null)}
            onSuccess={handleOrderSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
