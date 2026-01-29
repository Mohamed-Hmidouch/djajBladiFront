'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

interface UserInfo {
  email: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('djajbladi_token') || localStorage.getItem('djajbladi_token');
    const userRole = Cookies.get('djajbladi_role') || localStorage.getItem('djajbladi_role');
    const userEmail = Cookies.get('djajbladi_email') || localStorage.getItem('djajbladi_email');

    if (!token) {
      router.push('/login');
      return;
    }

    setUser({
      email: userEmail || 'User',
      role: userRole || 'Client',
    });
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-xl)]">
      {/* Welcome Section */}
      <div>
        <h1 className="text-[var(--text-h1-size)] font-bold text-[var(--color-text-primary)] leading-tight">
          Welcome back!
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Logged in as <span className="font-medium text-[var(--color-text-body)]">{user?.email}</span>
          {' '} - Role: <span className="font-semibold text-[var(--color-brand)]">{user?.role}</span>
        </p>
      </div>

      {/* Dashboard Cards based on Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-lg)]">
        {/* Common Card for all roles */}
        <Card hover>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>View and edit your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--color-text-body)]">
              Manage your account settings and preferences.
            </p>
          </CardContent>
        </Card>

        {/* Admin Cards */}
        {user?.role === 'Admin' && (
          <>
            <Link href="/dashboard/admin/users">
              <Card hover>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage all users in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[var(--color-text-body)]">
                    Add, edit, or remove users and manage their roles.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/admin/buildings">
              <Card hover>
                <CardHeader>
                  <CardTitle>Buildings</CardTitle>
                  <CardDescription>Define buildings and capacity</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[var(--color-text-body)]">
                    Add buildings and set max capacity for placing chicks.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/admin/batches">
              <Card hover>
                <CardHeader>
                  <CardTitle>Batches</CardTitle>
                  <CardDescription>Register new batches (lots)</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[var(--color-text-body)]">
                    Record strain, quantity, purchase price and arrival date.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/admin/stock">
              <Card hover>
                <CardHeader>
                  <CardTitle>Stock</CardTitle>
                  <CardDescription>Inventory: feed, vaccines, vitamins</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[var(--color-text-body)]">
                    Add and list stock for workers and veterinarians.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/settings">
              <Card hover>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure system parameters</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-[var(--color-text-body)]">
                    Manage application settings and configurations.
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Card hover>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>View system reports and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-body)]">
                  Access detailed reports and business analytics.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Veterinaire Cards */}
        {user?.role === 'Veterinaire' && (
          <>
            <Card hover>
              <CardHeader>
                <CardTitle>Health Records</CardTitle>
                <CardDescription>Manage animal health records</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-body)]">
                  View and update health records for all animals.
                </p>
              </CardContent>
            </Card>
            <Card hover>
              <CardHeader>
                <CardTitle>Vaccinations</CardTitle>
                <CardDescription>Track vaccination schedules</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-body)]">
                  Manage vaccination schedules and records.
                </p>
              </CardContent>
            </Card>
            <Card hover>
              <CardHeader>
                <CardTitle>Consultations</CardTitle>
                <CardDescription>View consultation history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-body)]">
                  Access past consultations and add new ones.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Ouvrier Cards */}
        {user?.role === 'Ouvrier' && (
          <>
            <Card hover>
              <CardHeader>
                <CardTitle>Daily Tasks</CardTitle>
                <CardDescription>View your assigned tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-body)]">
                  Check and complete your daily work tasks.
                </p>
              </CardContent>
            </Card>
            <Card hover>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
                <CardDescription>Manage stock and supplies</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-body)]">
                  Track inventory levels and request supplies.
                </p>
              </CardContent>
            </Card>
            <Card hover>
              <CardHeader>
                <CardTitle>Work Schedule</CardTitle>
                <CardDescription>View your work schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-body)]">
                  Check your shifts and upcoming work days.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Client Cards */}
        {user?.role === 'Client' && (
          <>
            <Card hover>
              <CardHeader>
                <CardTitle>My Orders</CardTitle>
                <CardDescription>View your order history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-body)]">
                  Track your orders and view purchase history.
                </p>
              </CardContent>
            </Card>
            <Card hover>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Browse available products</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-body)]">
                  Explore our range of poultry products.
                </p>
              </CardContent>
            </Card>
            <Card hover>
              <CardHeader>
                <CardTitle>Support</CardTitle>
                <CardDescription>Get help and support</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--color-text-body)]">
                  Contact our support team for assistance.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--space-md)]">
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--space-lg)] text-center">
          <p className="text-3xl font-bold text-[var(--color-brand)]">0</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Notifications</p>
        </div>
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--space-lg)] text-center">
          <p className="text-3xl font-bold text-[var(--color-primary)]">0</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Messages</p>
        </div>
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--space-lg)] text-center">
          <p className="text-3xl font-bold text-[var(--color-primary)]">0</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Tasks</p>
        </div>
        <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--space-lg)] text-center">
          <p className="text-3xl font-bold text-[var(--color-primary)]">0</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Pending</p>
        </div>
      </div>
    </div>
  );
}
