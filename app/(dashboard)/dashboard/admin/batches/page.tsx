'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import Cookies from 'js-cookie';
import { createBatch, getBuildings, validateBatchCapacity } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import { batchSchema, type BatchFormData } from '@/lib/validations';
import { Button, Input, Select } from '@/components/ui';
import {
  AdminPageShell,
  AdminPanel,
} from '@/components/dashboard/AdminPageShell';
import type { BuildingResponse } from '@/types/admin';

function getToken(): string | null {
  return Cookies.get('djajbladi_token') || localStorage.getItem('djajbladi_token');
}

export default function AdminBatchesPage() {
  const [buildings, setBuildings] = useState<BuildingResponse[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getBuildings(token)
      .then(setBuildings)
      .catch(() => setBuildings([]))
      .finally(() => setBuildingsLoading(false));
  }, []);

  const buildingOptions = [
    { value: '', label: 'No building' },
    ...buildings.map((b) => ({ value: String(b.id), label: `${b.name} (max ${b.maxCapacity})` })),
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema) as Resolver<BatchFormData>,
    defaultValues: {
      batchNumber: '',
      strain: '',
      chickenCount: 1000,
      arrivalDate: '',
      purchasePrice: 1,
      buildingId: '',
      notes: '',
    },
  });

  const onSubmit = async (data: BatchFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    const token = getToken();
    if (!token) return;
    const buildingId = data.buildingId?.trim() ? Number(data.buildingId) : null;
    try {
      if (buildingId != null && buildingId > 0) {
        await validateBatchCapacity(token, buildingId, data.chickenCount);
      }
      await createBatch(token, {
        batchNumber: data.batchNumber,
        strain: data.strain,
        chickenCount: data.chickenCount,
        arrivalDate: data.arrivalDate,
        purchasePrice: data.purchasePrice,
        ...(buildingId != null && { buildingId }),
        ...(data.notes?.trim() && { notes: data.notes.trim() }),
      });
      setSuccessMessage('Batch registered successfully.');
      reset({
        batchNumber: '',
        strain: '',
        chickenCount: 1000,
        arrivalDate: '',
        purchasePrice: 1,
        buildingId: '',
        notes: '',
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Failed to register batch. Please try again.');
      }
    }
  };

  return (
    <AdminPageShell
      title="Batches (Lots)"
      subtitle="Register a new batch with strain, quantity, purchase price and arrival date. If you assign a building, capacity is checked: the lot cannot exceed remaining space."
      accent="batches"
    >
      <div className="max-w-2xl">
        <AdminPanel
          title="Register batch"
          description="Batch number, strain, chicken count, arrival date, purchase price. Optional: building (capacity checked) and notes."
          accent="batches"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[var(--space-lg)]">
            {serverError && (
              <div className="p-4 text-sm text-[var(--color-brand)] bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl">
                {serverError}
              </div>
            )}
            {successMessage && (
              <div className="p-4 text-sm text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                {successMessage}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Batch number"
                placeholder="e.g. BL-2026-001"
                error={errors.batchNumber?.message}
                {...register('batchNumber')}
              />
              <Input
                label="Strain"
                placeholder="e.g. Cobb 500"
                error={errors.strain?.message}
                {...register('strain')}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Chicken count"
                type="number"
                min={1}
                placeholder="2000"
                error={errors.chickenCount?.message}
                {...register('chickenCount', { valueAsNumber: true })}
              />
              <Input
                label="Arrival date"
                type="date"
                error={errors.arrivalDate?.message}
                {...register('arrivalDate')}
              />
            </div>
            <Input
              label="Purchase price"
              type="number"
              min={0}
              step={0.01}
              placeholder="15000.00"
              error={errors.purchasePrice?.message}
              {...register('purchasePrice', { valueAsNumber: true })}
            />
            <Select
              label="Building (optional)"
              options={buildingOptions}
              placeholder="Select a building"
              error={errors.buildingId?.message}
              disabled={buildingsLoading}
              {...register('buildingId')}
            />
            <div>
              <label
                htmlFor="notes"
                className="block mb-2 text-sm font-semibold text-[var(--color-text-primary)]"
              >
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                className="w-full px-4 py-3 text-base text-[var(--color-text-body)] bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 placeholder:text-[var(--color-text-muted)] transition-shadow"
                placeholder="Premier lot de l'annee"
                {...register('notes')}
              />
              {errors.notes?.message && (
                <p className="mt-2 text-sm text-[var(--color-brand)]">{errors.notes.message}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="submit" isLoading={isSubmitting}>
                Register batch
              </Button>
              <Button type="button" variant="secondary" onClick={() => reset()}>
                Reset
              </Button>
            </div>
          </form>
        </AdminPanel>
      </div>
    </AdminPageShell>
  );
}
