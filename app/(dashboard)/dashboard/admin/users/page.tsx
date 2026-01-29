'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Cookies from 'js-cookie';
import { createUser, getUsers } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import { adminUserCreateSchema, type AdminUserCreateFormData } from '@/lib/validations';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Role } from '@/types/auth';
import type { UserResponse } from '@/types/auth';

function getToken(): string | null {
  return Cookies.get('djajbladi_token') || localStorage.getItem('djajbladi_token');
}

const roleOptions = [
  { value: Role.Ouvrier, label: 'Ouvrier' },
  { value: Role.Veterinaire, label: 'Veterinaire' },
];

export default function AdminUsersPage() {
  const [list, setList] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await getUsers(token);
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminUserCreateFormData>({
    resolver: zodResolver(adminUserCreateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      role: Role.Ouvrier,
    },
  });

  const onSubmit = async (data: AdminUserCreateFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    const token = getToken();
    if (!token) return;
    try {
      await createUser(token, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
        ...(data.phoneNumber?.trim() && { phoneNumber: data.phoneNumber.trim() }),
      });
      setSuccessMessage('User created successfully.');
      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        role: Role.Ouvrier,
      });
      await fetchUsers();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          Object.entries(err.errors).forEach(([field, message]) => {
            setError(field as keyof AdminUserCreateFormData, { message });
          });
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError('Failed to create user. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-[var(--space-xl)]">
      <div>
        <h1 className="text-[var(--text-h1-size)] font-bold text-[var(--color-text-primary)] leading-tight">
          Team (Users)
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Create accounts for Ouvriers and Veterinaires with restricted permissions.
        </p>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>Create user</CardTitle>
          <CardDescription>First name, last name, email, password and role (Ouvrier or Veterinaire).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[var(--space-lg)] max-w-lg">
            {serverError && (
              <div className="p-4 text-sm text-[var(--color-brand)] bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-[var(--radius-md)]">
                {serverError}
              </div>
            )}
            {successMessage && (
              <div className="p-4 text-sm text-[var(--color-primary)] bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
                {successMessage}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-md)]">
              <Input
                label="First name"
                placeholder="Jean"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Last name"
                placeholder="Dupont"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="jean@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Confirm password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Input
              label="Phone (optional)"
              placeholder="+212600000001"
              error={errors.phoneNumber?.message}
              {...register('phoneNumber')}
            />
            <Select
              label="Role"
              options={roleOptions}
              error={errors.role?.message}
              {...register('role')}
            />
            <div className="flex gap-[var(--space-md)]">
              <Button type="submit" isLoading={isSubmitting}>
                Create user
              </Button>
              <Button type="button" variant="secondary" onClick={() => reset()}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Team members created by Admin.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-[var(--space-2xl)]">
              <div className="animate-spin w-8 h-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-[var(--space-2xl)] text-[var(--color-text-muted)] text-center">
              No users yet, or the list endpoint is not available. Create a user above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">Name</th>
                    <th className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">Email</th>
                    <th className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">Role</th>
                    <th className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-3 px-4 text-[var(--color-text-body)]">{u.fullName}</td>
                      <td className="py-3 px-4 text-[var(--color-text-body)]">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--color-surface-3)] text-[var(--color-text-body)]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-body)]">
                        {u.isActive ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
