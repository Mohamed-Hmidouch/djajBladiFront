'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getCurrentUser, clearTokens } from '@/lib/jwt';
import { useClientData } from '@/hooks/useClientData';

function formatPrice(value: number) {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProfilePage() {
  const router = useRouter();
  const { summary } = useClientData();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setEmail(user.email);
      const n = user.email.split('@')[0] || 'Client';
      setName(n.charAt(0).toUpperCase() + n.slice(1));
    }
  }, []);

  const handleLogout = () => {
    clearTokens();
    router.replace('/login');
  };

  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col" style={{ gap: 'var(--space-lg)' }}>
      {/* Avatar + name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)', paddingTop: 'var(--space-md)' }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-inverse)',
            fontSize: '22px',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
          }}
        >
          {initials}
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)', margin: 0 }}>
            {name}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
            {email}
          </p>
        </div>
      </motion.div>

      {/* Summary stats */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          style={{
            background: 'var(--color-surface-1)',
            borderRadius: '14px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)', margin: 0 }}>
              Activite
            </p>
          </div>
          {[
            { label: 'Commandes passees', value: String(summary.totalOrders) },
            { label: 'Poulets achetes', value: String(summary.totalChickensPurchased) },
            { label: 'Total depense', value: `${formatPrice(summary.totalSpent)} DH` },
            { label: 'Commandes en attente', value: String(summary.pendingOrders) },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px var(--space-md)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span style={{ fontSize: '14px', color: 'var(--color-text-body)' }}>{item.label}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
                {item.value}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="flex flex-col"
        style={{ gap: 'var(--space-sm)' }}
      >
        <button
          className="client-cta client-cta--danger"
          onClick={handleLogout}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Se deconnecter
        </button>
      </motion.div>
    </div>
  );
}
