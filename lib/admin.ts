/* Admin API Service - Buildings, Batches, Stock, Users, Dashboard, Profile */

import { apiRequest } from './api';
import type { UserResponse } from '@/types/auth';
import type {
  BuildingResponse,
  CreateBuildingRequest,
  BatchResponse,
  CreateBatchRequest,
  StockItemResponse,
  CreateStockRequest,
  AdminCreateUserRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  SupervisionDashboardResponse,
  HealthRecordResponse,
  MortalityResponse,
  CreateMortalityRequest,
  FeedingResponse,
  CreateFeedingRequest,
  CreateHealthRecordRequest,
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
  body: AdminCreateUserRequest
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

/* Dashboard Supervision */
export async function getSupervisionDashboard(
  token: string,
  startDate?: string
): Promise<SupervisionDashboardResponse> {
  const params = startDate ? `?startDate=${startDate}` : '';
  return apiRequest<SupervisionDashboardResponse>(
    `/admin/dashboard/supervision${params}`,
    { token }
  );
}

export async function getDashboardAlerts(
  token: string
): Promise<HealthRecordResponse[]> {
  return apiRequest<HealthRecordResponse[]>('/admin/dashboard/alerts', {
    token,
  });
}

export async function approveHealthRecord(
  token: string,
  id: number
): Promise<HealthRecordResponse> {
  return apiRequest<HealthRecordResponse>(
    `/admin/dashboard/health-records/${id}/approve`,
    { method: 'POST', token }
  );
}

export async function rejectHealthRecord(
  token: string,
  id: number
): Promise<HealthRecordResponse> {
  return apiRequest<HealthRecordResponse>(
    `/admin/dashboard/health-records/${id}/reject`,
    { method: 'POST', token }
  );
}

/* Profile (authenticated user) */
export async function getProfile(token: string): Promise<UserResponse> {
  return apiRequest<UserResponse>('/users/me', { token });
}

export async function updateProfile(
  token: string,
  body: UpdateProfileRequest
): Promise<UserResponse> {
  return apiRequest<UserResponse>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
    token,
  });
}

export async function changePassword(
  token: string,
  body: ChangePasswordRequest
): Promise<void> {
  return apiRequest<void>('/users/me/password', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

/* Mortality (Ouvrier / Admin) */
export async function createMortality(
  token: string,
  body: CreateMortalityRequest
): Promise<MortalityResponse> {
  return apiRequest<MortalityResponse>('/ouvrier/mortality', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getMortalities(
  token: string,
  batchId?: number
): Promise<MortalityResponse[]> {
  const params = batchId ? `?batchId=${batchId}` : '';
  return apiRequest<MortalityResponse[]>(`/ouvrier/mortality${params}`, {
    token,
  });
}

/* Feeding (Ouvrier / Admin) */
export async function createFeeding(
  token: string,
  body: CreateFeedingRequest
): Promise<FeedingResponse> {
  return apiRequest<FeedingResponse>('/ouvrier/feeding', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getFeedings(
  token: string,
  batchId?: number
): Promise<FeedingResponse[]> {
  const params = batchId ? `?batchId=${batchId}` : '';
  return apiRequest<FeedingResponse[]>(`/ouvrier/feeding${params}`, { token });
}

/* Health Records (Veterinaire) */
export async function createHealthRecord(
  token: string,
  body: CreateHealthRecordRequest
): Promise<HealthRecordResponse> {
  return apiRequest<HealthRecordResponse>('/vet/health-records', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}
