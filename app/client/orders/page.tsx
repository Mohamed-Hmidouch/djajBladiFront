'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getToken } from '@/lib/jwt';
import { ApiError } from '@/lib/api';
import { cancelOrder } from '@/lib/client';
import { useClientData } from '@/hooks/useClientData';
import type { PaymentStatus, PurchaseOrderResponse } from '@/types/client';

type FilterKey = 'all' | PaymentStatus;

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'Pending', label: 'En attente' },
  { key: 'Paid', label: 'Payees' },
  { key: 'Cancelled', label: 'Annulees' },
];

const statusBadgeClass: Record<PaymentStatus, string> = {
  Pending: 'client-badge--pending',
  Paid: 'client-badge--paid',
  Cancelled: 'client-badge--cancelled',
};

const statusLabel: Record<PaymentStatus, string> = {
  Pending: 'En attente',
  Paid: 'Payee',
  Cancelled: 'Annulee',
};

function formatPrice(value: number) {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function OrderCard({
  order,
  onCancel,
}: {
  order: PurchaseOrderResponse;
  onCancel: (id: number) => void;
}) {
  return (
    <div className="client-order-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)', margin: 0 }}>
            {order.strain}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
            Lot {order.batchNumber}
          </p>
        </div>
        <span className={`client-badge ${statusBadgeClass[order.paymentStatus]}`}>
          {statusLabel[order.paymentStatus]}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', fontSize: '13px', color: 'var(--color-text-body)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Quantite</span>
          <span style={{ fontWeight: 600 }}>{order.quantity} unites</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Prix unitaire</span>
          <span style={{ fontWeight: 600 }}>{formatPrice(order.unitPrice)} DH</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total</span>
          <span style={{ fontWeight: 700, color: 'var(--color-brand)' }}>{formatPrice(order.totalPrice)} DH</span>
        </div>
      </div>

      {order.deliveryAddress && (
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
          Livraison : {order.deliveryAddress}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>

        {order.paymentStatus === 'Pending' && (
          <button
            className="client-cta client-cta--danger client-cta--sm"
            onClick={() => onCancel(order.orderId)}
          >
            Annuler
          </button>
        )}
      </div>

      {order.notes && (
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0, paddingTop: '4px', borderTop: '1px solid var(--color-border)' }}>
          {order.notes}
        </p>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--space-sm)' }}>
      <div className="skeleton" style={{ height: '42px', borderRadius: '12px' }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton client-skeleton-card" />
      ))}
      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '8px' }}>
        Chargement de vos commandes...
      </p>
    </div>
  );
}

export default function OrdersPage() {
  const { orders, loading, error, refresh } = useClientData();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const filtered = activeFilter === 'all'
    ? orders
    : orders.filter((o) => o.paymentStatus === activeFilter);

  const handleCancel = async (orderId: number) => {
    const token = getToken();
    if (!token) return;

    setCancellingId(orderId);
    try {
      await cancelOrder(token, orderId);
      toast.success('Commande annulee');
      await refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Impossible d\'annuler cette commande.';
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
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
          Mes commandes
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
          {orders.length} commande{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Segmented Filter */}
      <div className="client-segments">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`client-segment ${activeFilter === f.key ? 'client-segment--active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Order List */}
      {filtered.length === 0 ? (
        <div className="client-empty">
          <div className="client-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="client-empty-title">
            {activeFilter === 'all' ? 'Aucune commande' : 'Aucun resultat'}
          </p>
          <p className="client-empty-text">
            {activeFilter === 'all'
              ? 'Vos commandes apparaitront ici apres votre premier achat'
              : 'Aucune commande ne correspond a ce filtre'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
            style={{ gap: 'var(--space-sm)' }}
          >
            {filtered.map((order, i) => (
              <motion.div
                key={order.orderId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
              >
                <OrderCard
                  order={order}
                  onCancel={cancellingId !== null ? () => {} : handleCancel}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
