'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { getToken } from '@/lib/jwt';
import { getClientDashboard, getAvailableBatches, getMyOrders } from '@/lib/client';
import type { ClientOrderSummary, AvailableBatchResponse, PurchaseOrderResponse } from '@/types/client';

interface ClientDataContextValue {
  summary: ClientOrderSummary | null;
  batches: AvailableBatchResponse[];
  orders: PurchaseOrderResponse[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ClientDataContext = createContext<ClientDataContextValue>({
  summary: null,
  batches: [],
  orders: [],
  loading: true,
  error: null,
  refresh: async () => {},
});

export function useClientData() {
  return useContext(ClientDataContext);
}

export function ClientDataProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<ClientOrderSummary | null>(null);
  const [batches, setBatches] = useState<AvailableBatchResponse[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [dashData, batchData, orderData] = await Promise.all([
        getClientDashboard(token),
        getAvailableBatches(token),
        getMyOrders(token),
      ]);
      setSummary(dashData);
      setBatches(batchData);
      setOrders(orderData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ClientDataContext.Provider value={{ summary, batches, orders, loading, error, refresh }}>
      {children}
    </ClientDataContext.Provider>
  );
}
