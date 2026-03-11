'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserRole, clearTokens } from '@/lib/jwt';

/* ============================================
   SECURE DASHBOARD NAV
   ============================================
   
   Le rôle est extrait du JWT en temps réel.
   Plus de lecture depuis localStorage/cookies.
   
   ============================================ */

export function DashboardNav() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const role = getUserRole();
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    clearTokens();
    window.location.href = '/login';
  };

  return (
    <nav className="flex items-center gap-[var(--space-md)]">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-[var(--space-lg)]">
        {userRole === 'Admin' && (
          <>
            <Link href="/admin" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Hub</Link>
            <Link href="/admin/users" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Equipe</Link>
            <Link href="/admin/buildings" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Batiments</Link>
            <Link href="/admin/batches" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Lots</Link>
            <Link href="/admin/stock" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Stock</Link>
            <Link href="/admin/finances" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Finances</Link>
          </>
        )}

        {userRole === 'Veterinaire' && (
          <>
            <Link href="/veterinaire" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Dashboard</Link>
            <Link href="/veterinaire/health" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Dossiers Sante</Link>
          </>
        )}

        {userRole === 'Ouvrier' && (
          <>
            <Link href="/ouvrier" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Dashboard</Link>
            <Link href="/ouvrier/feeding" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Alimentation</Link>
            <Link href="/ouvrier/tasks" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Mortalite</Link>
          </>
        )}

        {userRole === 'Client' && (
          <>
            <Link href="/client" className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium">Dashboard</Link>
          </>
        )}
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {userRole?.charAt(0) || 'U'}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] py-2 z-50">
            <div className="px-4 py-2 border-b border-[var(--color-border)]">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{userRole}</p>
            </div>
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-[var(--color-text-body)] hover:bg-[var(--color-surface-2)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              My Profile
            </Link>
            <Link
              href="/settings"
              className="block px-4 py-2 text-sm text-[var(--color-text-body)] hover:bg-[var(--color-surface-2)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Settings
            </Link>
            <hr className="my-2 border-[var(--color-border)]" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden p-2 text-[var(--color-text-body)]"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </nav>
  );
}
