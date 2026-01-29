'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import Cookies from 'js-cookie';
import { createStockItem, getStock } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import { stockSchema, type StockFormData } from '@/lib/validations';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { StockType } from '@/types/admin';
import type { StockItemResponse } from '@/types/admin';

function getToken(): string | null {
  return Cookies.get('djajbladi_token') || localStorage.getItem('djajbladi_token');
}

const stockTypeOptions = [
  { value: StockType.Feed, label: 'Feed (Aliment)' },
  { value: StockType.Vaccine, label: 'Vaccine' },
  { value: StockType.Vitamin, label: 'Vitamin' },
];

export default function AdminStockPage() {
  const [list, setList] = useState<StockItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchStock = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await getStock(token);
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockFormData>({
    resolver: zodResolver(stockSchema) as Resolver<StockFormData>,
    defaultValues: {
      type: StockType.Feed,
      name: '',
      quantity: 1,
      unit: 'sac',
    },
  });

  const onSubmit = async (data: StockFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    const token = getToken();
    if (!token) return;
    try {
      await createStockItem(token, {
        type: data.type,
        quantity: data.quantity,
        ...(data.name?.trim() && { name: data.name.trim() }),
        unit: data.unit,
      });
      setSuccessMessage('Stock item added successfully.');
      reset({ type: StockType.Feed, name: '', quantity: 1, unit: 'sac' });
      await fetchStock();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Failed to add stock. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-[var(--space-xl)]">
      <div>
        <h1 className="text-[var(--text-h1-size)] font-bold text-[var(--color-text-primary)] leading-tight">
          Stock (Inventory)
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Add and list stock: feed, vaccines, vitamins for workers and veterinarians.
        </p>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>Add stock</CardTitle>
          <CardDescription>Type (Feed, Vaccine, Vitamin), optional name, quantity and unit (e.g. sac, dose, flacon).</CardDescription>
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
            <Select
              label="Type"
              options={stockTypeOptions}
              error={errors.type?.message}
              {...register('type')}
            />
            <Input
              label="Name (optional)"
              placeholder="e.g. Aliment demarrage"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Quantity"
              type="number"
              min={0.01}
              step={0.01}
              placeholder="100.5"
              error={errors.quantity?.message}
              {...register('quantity', { valueAsNumber: true })}
            />
            <Input
              label="Unit"
              placeholder="e.g. sac, dose, flacon"
              error={errors.unit?.message}
              {...register('unit')}
            />
            <div className="flex gap-[var(--space-md)]">
              <Button type="submit" isLoading={isSubmitting}>
                Add stock
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
          <CardTitle>Stock list</CardTitle>
          <CardDescription>Items ordered by type then name.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-[var(--space-2xl)]">
              <div className="animate-spin w-8 h-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-[var(--space-2xl)] text-[var(--color-text-muted)] text-center">
              No stock items yet. Add one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">Type</th>
                    <th className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">Name</th>
                    <th className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">Quantity</th>
                    <th className="py-3 px-4 font-semibold text-[var(--color-text-primary)]">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-[var(--radius-sm)] ${
                            item.type === StockType.Feed
                              ? 'bg-[var(--color-surface-3)] text-[var(--color-text-body)]'
                              : item.type === StockType.Vaccine
                                ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                                : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-body)]">
                        {item.name ?? '-'}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-text-body)]">{item.quantity}</td>
                      <td className="py-3 px-4 text-[var(--color-text-body)]">{item.unit}</td>
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
