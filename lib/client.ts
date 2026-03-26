/* Client API Service - Purchase System */

import { apiRequest } from './api';
import type {
  AvailableBatchResponse,
  PurchaseOrderRequest,
  PurchaseOrderResponse,
  ClientOrderSummary,
  PaymentStatus,
} from '@/types/client';

/* Catalog */

export async function getAvailableBatches(
  token: string
): Promise<AvailableBatchResponse[]> {
  return apiRequest<AvailableBatchResponse[]>('/api/client/batches', { token });
}

export async function getAvailableBatch(
  token: string,
  batchId: number
): Promise<AvailableBatchResponse> {
  return apiRequest<AvailableBatchResponse>(`/api/client/batches/${batchId}`, {
    token,
  });
}

/* Orders */

export async function placeOrder(
  token: string,
  body: PurchaseOrderRequest
): Promise<PurchaseOrderResponse> {
  return apiRequest<PurchaseOrderResponse>('/api/client/orders', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getMyOrders(
  token: string,
  status?: PaymentStatus
): Promise<PurchaseOrderResponse[]> {
  const qs = status ? `?status=${status}` : '';
  return apiRequest<PurchaseOrderResponse[]>(`/api/client/orders${qs}`, {
    token,
  });
}

export async function getMyOrder(
  token: string,
  orderId: number
): Promise<PurchaseOrderResponse> {
  return apiRequest<PurchaseOrderResponse>(`/api/client/orders/${orderId}`, {
    token,
  });
}

export async function cancelOrder(
  token: string,
  orderId: number
): Promise<PurchaseOrderResponse> {
  return apiRequest<PurchaseOrderResponse>(`/api/client/orders/${orderId}`, {
    method: 'DELETE',
    token,
  });
}

/* Dashboard */

export async function getClientDashboard(
  token: string
): Promise<ClientOrderSummary> {
  return apiRequest<ClientOrderSummary>('/api/client/dashboard', { token });
}
