'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect to the vet dashboard.
 * Health records are now created via the inline modal on the dashboard.
 */
export default function VetHealthRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/veterinaire');
  }, [router]);
  return null;
}
