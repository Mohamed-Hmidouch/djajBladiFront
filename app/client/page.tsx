'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, clearTokens } from '@/lib/jwt';

export default function ClientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; firstName: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!isAuthenticated()) { clearTokens(); router.replace('/login'); return; }
    const decoded = getCurrentUser();
    if (!decoded || decoded.isExpired) { clearTokens(); router.replace('/login'); return; }
    const name = decoded.email.split('@')[0] || 'Client';
    setUser({ email: decoded.email, firstName: name.charAt(0).toUpperCase() + name.slice(1) });
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [router]);

  const greeting = currentTime.getHours() < 12 ? 'Bonjour' : currentTime.getHours() < 18 ? 'Bon apres-midi' : 'Bonsoir';

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 px-8 py-6 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative">
          <p className="text-white/70 text-xs font-medium mb-1">
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold mb-1">{greeting}, {user?.firstName}!</h1>
          <p className="text-white/80 text-sm">Espace Client DjajBladi</p>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-12 text-center">
        <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Espace Client</h2>
        <p className="text-[var(--color-text-muted)] text-sm max-w-sm mx-auto">
          La gestion des commandes et produits sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}
