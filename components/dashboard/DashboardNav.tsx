'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function DashboardNav() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const role = Cookies.get('djajbladi_role') || localStorage.getItem('djajbladi_role');
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    Cookies.remove('djajbladi_token');
    Cookies.remove('djajbladi_refresh_token');
    Cookies.remove('djajbladi_role');
    Cookies.remove('djajbladi_email');
    localStorage.removeItem('djajbladi_token');
    localStorage.removeItem('djajbladi_refresh_token');
    localStorage.removeItem('djajbladi_role');
    localStorage.removeItem('djajbladi_email');
    router.push('/login');
  };

  return (
    <nav className="flex items-center gap-[var(--space-md)]">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-[var(--space-lg)]">
        <Link
          href="/dashboard"
          className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium"
        >
          Dashboard
        </Link>

        {userRole === 'Admin' && (
          <>
            <Link
              href="/dashboard/users"
              className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              Users
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              Settings
            </Link>
          </>
        )}

        {userRole === 'Veterinaire' && (
          <>
            <Link
              href="/dashboard/health"
              className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              Health Records
            </Link>
            <Link
              href="/dashboard/vaccinations"
              className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              Vaccinations
            </Link>
          </>
        )}

        {userRole === 'Ouvrier' && (
          <>
            <Link
              href="/dashboard/tasks"
              className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              Tasks
            </Link>
            <Link
              href="/dashboard/inventory"
              className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              Inventory
            </Link>
          </>
        )}

        {userRole === 'Client' && (
          <>
            <Link
              href="/dashboard/orders"
              className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              Orders
            </Link>
            <Link
              href="/dashboard/products"
              className="text-[var(--color-text-body)] hover:text-[var(--color-primary)] transition-colors font-medium"
            >
              Products
            </Link>
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
              href="/dashboard/profile"
              className="block px-4 py-2 text-sm text-[var(--color-text-body)] hover:bg-[var(--color-surface-2)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              My Profile
            </Link>
            <Link
              href="/dashboard/settings"
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
