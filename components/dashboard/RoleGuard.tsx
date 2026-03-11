'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUserRole, isTokenExpired, clearTokens } from '@/lib/jwt';

interface RoleGuardProps {
  allowedRole: string;
  children: ReactNode;
}

export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      clearTokens();
      router.replace('/login');
      return;
    }
    const role = getUserRole();
    if (role !== allowedRole) {
      router.replace('/');
      return;
    }
    setAllowed(true);
    setChecking(false);
  }, [router, allowedRole]);

  if (checking || !allowed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
