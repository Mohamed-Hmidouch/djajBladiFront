'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, clearTokens } from '@/lib/jwt';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      clearTokens();
      router.replace('/login');
      return;
    }
    const user = getCurrentUser();
    if (!user || user.isExpired) {
      clearTokens();
      router.replace('/login');
      return;
    }
    switch (user.role) {
      case 'Admin':
        router.replace('/admin');
        break;
      case 'Ouvrier':
        router.replace('/ouvrier');
        break;
      case 'Veterinaire':
        router.replace('/veterinaire');
        break;
      case 'Client':
        router.replace('/client');
        break;
      default:
        clearTokens();
        router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
    </div>
  );
}
