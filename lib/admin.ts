/* Admin API Service - Buildings, Batches, Stock, Users */

import { apiRequest } from './api';
import type { RegisterRequest, UserResponse } from '@/types/auth';
import type {
  BuildingResponse,
  CreateBuildingRequest,
  BatchResponse,
  CreateBatchRequest,
  StockItemResponse,
  CreateStockRequest,
} from '@/types/admin';

/* Buildings */
export async function createBuilding(
  token: string,
  body: CreateBuildingRequest
): Promise<BuildingResponse> {
  return apiRequest<BuildingResponse>('/admin/buildings', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getBuildings(token: string): Promise<BuildingResponse[]> {
  return apiRequest<BuildingResponse[]>('/admin/buildings', { token });
}

export async function getBuildingById(
  token: string,
  id: number
): Promise<BuildingResponse> {
  return apiRequest<BuildingResponse>(`/admin/buildings/${id}`, { token });
}

/* Batches */
export async function getBatches(token: string): Promise<BatchResponse[]> {
  return apiRequest<BatchResponse[]>('/admin/batches', { token });
}

export async function createBatch(
  token: string,
  body: CreateBatchRequest
): Promise<BatchResponse> {
  return apiRequest<BatchResponse>('/admin/batches', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

/**
 * Business rule: building capacity.
 * If the building has maxCapacity 900 and already contains batches totalling X chickens,
 * the new batch chickenCount must not exceed (maxCapacity - X).
 * Throws if chickenCount > available capacity.
 */
export async function validateBatchCapacity(
  token: string,
  buildingId: number,
  chickenCount: number
): Promise<void> {
  const [building, batches] = await Promise.all([
    getBuildingById(token, buildingId),
    getBatches(token),
  ]);
  const batchesInBuilding = batches.filter(
    (b) => b.buildingId === buildingId && b.chickenCount != null
  );
  const currentChickens = batchesInBuilding.reduce((sum, b) => sum + b.chickenCount, 0);
  const available = building.maxCapacity - currentChickens;
  if (chickenCount > available) {
    throw new Error(
      `Batiment "${building.name}" accepte max ${building.maxCapacity} poussins. Deja ${currentChickens} places occupees. Capacite restante: ${available}. Vous ne pouvez pas enregistrer ${chickenCount} poussins.`
    );
  }
}

/* Stock */
export async function createStockItem(
  token: string,
  body: CreateStockRequest
): Promise<StockItemResponse> {
  return apiRequest<StockItemResponse>('/admin/stock', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getStock(token: string): Promise<StockItemResponse[]> {
  return apiRequest<StockItemResponse[]>('/admin/stock', { token });
}

export async function getStockItemById(
  token: string,
  id: number
): Promise<StockItemResponse> {
  return apiRequest<StockItemResponse>(`/admin/stock/${id}`, { token });
}

/* Users (Admin creates Ouvrier / Veterinaire) */
export async function createUser(
  token: string,
  body: RegisterRequest
): Promise<UserResponse> {
  return apiRequest<UserResponse>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getUsers(token: string): Promise<UserResponse[]> {
  return apiRequest<UserResponse[]>('/admin/users', { token });
}
