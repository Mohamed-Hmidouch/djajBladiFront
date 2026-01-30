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
import { Button, Input } from '@/components/ui';
import {
  AdminPageShell,
  AdminPanel,
  AdminBentoGrid,
  AdminBentoForm,
  AdminBentoList,
} from '@/components/dashboard/AdminPageShell';
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
    <AdminPageShell
      title="Buildings"
      subtitle="Define buildings and their maximum capacity for placing chicks. Add a new building or browse the list below."
      accent="primary"
    >
      <AdminBentoGrid>
        <AdminBentoForm>
          <AdminPanel
            title="Add building"
            description="Name, capacity and optional image URL."
            accent="primary"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-[var(--space-lg)]">
              {serverError && (
                <div className="p-4 text-sm text-[var(--color-brand)] bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl">
                  {serverError}
                </div>
              )}
              {successMessage && (
                <div className="p-4 text-sm text-[var(--color-primary)] bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-xl">
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
              <div className="flex gap-3">
                <Button type="submit" isLoading={isSubmitting}>
                  Add building
                </Button>
                <Button type="button" variant="secondary" onClick={() => reset()}>
                  Reset
                </Button>
              </div>
            </form>
          </AdminPanel>
        </AdminBentoForm>
        <AdminBentoList>
          <AdminPanel
            title="All buildings"
            description="Buildings and their capacity."
            accent="primary"
          >
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
              </div>
            ) : list.length === 0 ? (
              <p className="py-16 text-[var(--color-text-muted)] text-center">
                No buildings yet. Add one in the form.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {list.map((b) => (
                  <article
                    key={b.id}
                    className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]/50 p-4 transition-all duration-300 hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {b.imageUrl ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-3 bg-[var(--color-surface-3)]">
                        <Image
                          src={b.imageUrl}
                          alt={b.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-brand)]/5 flex items-center justify-center mb-3">
                        <svg
                          className="w-14 h-14 text-[var(--color-text-muted)]"
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
                      Max: {b.maxCapacity.toLocaleString()} poussins
                    </p>
                  </article>
                ))}
              </div>
            )}
          </AdminPanel>
        </AdminBentoList>
      </AdminBentoGrid>
    </AdminPageShell>
  );
}
