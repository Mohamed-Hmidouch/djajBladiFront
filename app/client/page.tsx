'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getCurrentUser } from '@/lib/jwt';
import { useClientData } from '@/hooks/useClientData';
import type { PaymentStatus } from '@/types/client';

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon apres-midi';
  return 'Bonsoir';
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="skeleton client-skeleton-hero" />
      <div className="client-stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton client-skeleton-stat" />
        ))}
      </div>
      <div className="skeleton client-skeleton-card" />
      <div className="skeleton client-skeleton-card" />
      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '8px' }}>
        On prepare vos donnees...
      </p>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

export default function ClientHomePage() {
  const { summary, orders, batches, loading, error } = useClientData();
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const name = user.email.split('@')[0] || 'Client';
      setFirstName(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }, []);

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

  const stats = [
    { label: 'Commandes', value: summary?.totalOrders ?? 0 },
    { label: 'Poulets achetes', value: summary?.totalChickensPurchased ?? 0 },
    { label: 'Total depense', value: `${formatPrice(summary?.totalSpent ?? 0)} DH` },
    { label: 'Montant en attente', value: `${formatPrice(summary?.pendingAmount ?? 0)} DH` },
  ];

  const recentOrders = (summary?.recentOrders ?? orders).slice(0, 3);

  return (
    <div className="flex flex-col" style={{ gap: 'var(--space-lg)' }}>
      {/* Hero greeting */}
      <motion.div
        className="client-hero"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-heading)', margin: 0, lineHeight: 1.3 }}>
          {getGreeting()}, {firstName}
        </h1>
        <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px', fontFamily: 'var(--font-body)' }}>
          Bienvenue sur votre espace client
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="client-stats-grid">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="client-stat-card"
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <span className="client-stat-value">{s.value}</span>
            <span className="client-stat-label">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Available batches count */}
      {batches.length > 0 && (
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            background: 'var(--color-surface-1)',
            borderRadius: '14px',
            padding: 'var(--space-md)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
              {batches.length} lot{batches.length > 1 ? 's' : ''} disponible{batches.length > 1 ? 's' : ''}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Prets pour la vente
            </p>
          </div>
          <Link href="/client/catalog" className="client-cta client-cta--sm">
            Voir
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </motion.div>
      )}

      {/* Recent Orders */}
      <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
          <h2 className="client-section-title" style={{ margin: 0 }}>Commandes recentes</h2>
          {orders.length > 3 && (
            <Link href="/client/orders" style={{ fontSize: '13px', color: 'var(--color-brand)', fontWeight: 600, textDecoration: 'none' }}>
              Tout voir
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="client-empty" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
            <div className="client-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="client-empty-title">Aucune commande</p>
            <p className="client-empty-text">Parcourez le catalogue pour passer votre premiere commande</p>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: 'var(--space-sm)' }}>
            {recentOrders.map((order) => (
              <div key={order.orderId} className="client-order-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
                    {order.strain}
                  </span>
                  <span className={`client-badge ${statusBadgeClass[order.paymentStatus]}`}>
                    {statusLabel[order.paymentStatus]}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  <span>{order.quantity} unite{order.quantity > 1 ? 's' : ''}</span>
                  <span>{formatPrice(order.totalPrice)} DH</span>
                  <span>{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* CTA */}
      <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp}>
        <Link href="/client/catalog" className="client-cta">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          Parcourir le catalogue
        </Link>
      </motion.div>
    </div>
  );
}
