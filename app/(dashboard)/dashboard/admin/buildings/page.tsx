'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { createBuilding, getBuildings } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import { buildingSchema, type BuildingFormData } from '@/lib/validations';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import type { BuildingResponse } from '@/types/admin';

function getToken(): string | null {
  return Cookies.get('djajbladi_token') || localStorage.getItem('djajbladi_token');
}

export default function AdminBuildingsPage() {
  const [list, setList] = useState<BuildingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchBuildings = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await getBuildings(token);
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema) as Resolver<BuildingFormData>,
    defaultValues: {
      name: '',
      maxCapacity: 1,
      imageUrl: '',
    },
  });

  const onSubmit = async (data: BuildingFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    const token = getToken();
    if (!token) return;
    try {
      await createBuilding(token, {
        name: data.name,
        maxCapacity: data.maxCapacity,
        ...(data.imageUrl?.trim() && { imageUrl: data.imageUrl.trim() }),
      });
      setSuccessMessage('Building created successfully.');
      reset({ name: '', maxCapacity: 1, imageUrl: '' });
      await fetchBuildings();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Failed to create building. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-[var(--space-xl)]">
      <div>
        <h1 className="text-[var(--text-h1-size)] font-bold text-[var(--color-text-primary)] leading-tight">
          Buildings
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Define buildings and their maximum capacity for placing chicks.
        </p>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>Add building</CardTitle>
          <CardDescription>Name, capacity and optional image URL.</CardDescription>
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
            <Input
              label="Name"
              placeholder="e.g. Batiment A"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Max capacity (poussins)"
              type="number"
              min={1}
              placeholder="5000"
              error={errors.maxCapacity?.message}
              {...register('maxCapacity', { valueAsNumber: true })}
            />
            <Input
              label="Image URL (optional)"
              placeholder="https://..."
              error={errors.imageUrl?.message}
              {...register('imageUrl')}
            />
            <div className="flex gap-[var(--space-md)]">
              <Button type="submit" isLoading={isSubmitting}>
                Add building
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
          <CardTitle>All buildings</CardTitle>
          <CardDescription>Buildings and their capacity.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-[var(--space-2xl)]">
              <div className="animate-spin w-8 h-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-[var(--space-2xl)] text-[var(--color-text-muted)] text-center">
              No buildings yet. Add one above.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-lg)]">
              {list.map((b) => (
                <div
                  key={b.id}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--space-lg)] transition-all duration-200 hover:shadow-[var(--shadow-md)]"
                >
                  {b.imageUrl ? (
                    <div className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden mb-[var(--space-md)] bg-[var(--color-surface-3)]">
                      <Image
                        src={b.imageUrl}
                        alt={b.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video rounded-[var(--radius-md)] bg-[var(--color-surface-3)] flex items-center justify-center mb-[var(--space-md)]">
                      <svg
                        className="w-12 h-12 text-[var(--color-text-muted)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  )}
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{b.name}</h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Max capacity: {b.maxCapacity.toLocaleString()} poussins
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
