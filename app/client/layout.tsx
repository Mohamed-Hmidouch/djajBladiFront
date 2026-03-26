'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Toaster } from 'react-hot-toast';
import { RoleGuard } from '@/components/dashboard/RoleGuard';
import { ClientDataProvider } from '@/hooks/useClientData';

const tabs = [
  {
    href: '/client',
    label: 'Accueil',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--color-brand)' : 'none'} stroke={active ? 'var(--color-brand)' : 'var(--color-text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/client/catalog',
    label: 'Catalogue',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--color-brand)' : 'var(--color-text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    href: '/client/orders',
    label: 'Commandes',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--color-brand)' : 'var(--color-text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: '/client/profile',
    label: 'Profil',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--color-brand)' : 'var(--color-text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/client') return pathname === '/client';
    return pathname.startsWith(href);
  };

  return (
    <RoleGuard allowedRole="Client">
      <ClientDataProvider>
        <div className="client-shell">
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                borderRadius: '12px',
                padding: '12px 16px',
              },
              success: {
                style: { background: '#065F46', color: '#fff' },
                duration: 3000,
              },
              error: {
                style: { background: '#991B1B', color: '#fff' },
                duration: 4000,
              },
            }}
          />

          {/* Compact Top Bar */}
          <header className="client-topbar">
            <Link href="/client" className="client-topbar-logo">
              <Image
                src="/djajbladiLogo.png"
                alt="DjajBladi"
                width={110}
                height={36}
                priority
                style={{ width: '110px', height: 'auto' }}
              />
            </Link>
          </header>

          {/* Main Content */}
          <main className="client-main">
            {children}
          </main>

          {/* Bottom Tab Navigation */}
          <nav className="client-bottom-nav">
            {tabs.map((tab) => {
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`client-tab ${active ? 'client-tab--active' : ''}`}
                >
                  {tab.icon(active)}
                  <span className="client-tab-label">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </ClientDataProvider>
    </RoleGuard>
  );
}
