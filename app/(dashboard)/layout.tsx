import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { ProtectedRoute } from '@/components/dashboard';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-2)]">
      {/* Navbar */}
      <header className="h-[var(--navbar-height)] bg-[var(--color-surface-1)] border-b border-[var(--color-border)] sticky top-0 z-50 backdrop-blur-[10px]">
        <div className="h-full w-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/djajbladiLogo.png"
              alt="DjajBladi"
              width={140}
              height={46}
              priority
              style={{ width: '140px', height: 'auto' }}
            />
          </Link>

          {/* Navigation */}
          <DashboardNav />
        </div>
      </header>

      {/* Main Content */}
      <ProtectedRoute>
        <main className="w-full px-6 py-6">
          {children}
        </main>
      </ProtectedRoute>
    </div>
  );
}
