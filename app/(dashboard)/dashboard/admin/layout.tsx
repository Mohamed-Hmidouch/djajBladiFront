import type { ReactNode } from 'react';
import { AdminGuard } from '@/components/dashboard/AdminGuard';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminGuard>{children}</AdminGuard>;
}
