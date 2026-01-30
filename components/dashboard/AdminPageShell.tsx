'use client';

import type { ReactNode } from 'react';

type AccentVariant = 'brand' | 'primary' | 'batches' | 'stock';

const accentStyles: Record<AccentVariant, { gradient: string; border: string; badge: string }> = {
  brand: {
    gradient: 'from-[var(--color-brand)]/15 via-transparent to-[var(--color-primary)]/10',
    border: 'border-[var(--color-brand)]/30',
    badge: 'bg-[var(--color-brand)]/20 text-[var(--color-brand)]',
  },
  primary: {
    gradient: 'from-[var(--color-primary)]/20 via-transparent to-[var(--color-brand)]/10',
    border: 'border-[var(--color-primary)]/30',
    badge: 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]',
  },
  batches: {
    gradient: 'from-emerald-500/15 via-transparent to-[var(--color-primary)]/10',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-700',
  },
  stock: {
    gradient: 'from-amber-500/15 via-transparent to-[var(--color-brand)]/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-800',
  },
};

interface AdminPageShellProps {
  title: string;
  subtitle: string;
  accent?: AccentVariant;
  children: ReactNode;
}

export function AdminPageShell({
  title,
  subtitle,
  accent = 'primary',
  children,
}: AdminPageShellProps) {
  const styles = accentStyles[accent];
  return (
    <div className="min-h-[60vh]">
      <header
        className={`relative overflow-hidden rounded-2xl border ${styles.border} bg-gradient-to-br ${styles.gradient} px-[var(--space-xl)] py-[var(--space-2xl)] mb-[var(--space-xl)]`}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2MkgyNHYtMmgxMnoiLz48L2g+PC9nPjwvc3ZnPg==')] opacity-60" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-[var(--color-text-muted)] max-w-2xl">
            {subtitle}
          </p>
        </div>
      </header>
      <div className="space-y-[var(--space-xl)]">{children}</div>
    </div>
  );
}

interface AdminPanelProps {
  title: string;
  description?: string;
  accent?: AccentVariant;
  children: ReactNode;
  className?: string;
}

export function AdminPanel({
  title,
  description,
  accent = 'primary',
  children,
  className = '',
}: AdminPanelProps) {
  const styles = accentStyles[accent];
  return (
    <section
      className={`rounded-2xl border ${styles.border} bg-[var(--color-surface-1)]/90 backdrop-blur-sm shadow-[var(--shadow-lg)] overflow-hidden transition-all duration-300 hover:shadow-xl ${className}`}
    >
      <div className={`border-b ${styles.border} px-[var(--space-xl)] py-[var(--space-lg)] bg-gradient-to-r ${styles.gradient}`}>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
        )}
      </div>
      <div className="p-[var(--space-xl)]">{children}</div>
    </section>
  );
}

export function AdminBentoGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--space-xl)]">
      {children}
    </div>
  );
}

export function AdminBentoForm({ children }: { children: ReactNode }) {
  return <div className="lg:col-span-5 xl:col-span-4">{children}</div>;
}

export function AdminBentoList({ children }: { children: ReactNode }) {
  return <div className="lg:col-span-7 xl:col-span-8">{children}</div>;
}
