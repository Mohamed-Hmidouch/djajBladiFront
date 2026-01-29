'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = Cookies.get('djajbladi_token') || localStorage.getItem('djajbladi_token');
    const role = Cookies.get('djajbladi_role') || localStorage.getItem('djajbladi_role');

    if (!token) {
      router.replace('/login');
      return;
    }

    if (role !== 'Admin') {
      router.replace('/dashboard');
      return;
    }

    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
