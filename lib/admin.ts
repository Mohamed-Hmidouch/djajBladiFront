/* Admin API Service - Buildings, Batches, Stock, Users, Dashboard, Profile */

import { apiRequest } from './api';
import type { UserResponse } from '@/types/auth';
import type {
  PageResponse,
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
  BatchCostBreakdownResponse,
} from '@/types/admin';

/* Buildings */
export async function createBuilding(
  token: string,
  body: CreateBuildingRequest
): Promise<BuildingResponse> {
  return apiRequest<BuildingResponse>('/api/admin/buildings', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getBuildings(
  token: string,
  page = 0,
  size = 5
): Promise<PageResponse<BuildingResponse>> {
  return apiRequest<PageResponse<BuildingResponse>>(
    `/api/admin/buildings?page=${page}&size=${size}`,
    { token }
  );
}

export async function getBuildingById(
  token: string,
  id: number
): Promise<BuildingResponse> {
  return apiRequest<BuildingResponse>(`/api/admin/buildings/${id}`, { token });
}

/* Batches */
export async function getBatches(
  token: string,
  page = 0,
  size = 5
): Promise<PageResponse<BatchResponse>> {
  return apiRequest<PageResponse<BatchResponse>>(
    `/api/admin/batches?page=${page}&size=${size}`,
    { token }
  );
}

/** Fetch ALL batches without pagination — used for capacity validation and dropdowns */
export async function getAllBatchesFlat(token: string): Promise<BatchResponse[]> {
  return apiRequest<PageResponse<BatchResponse>>(
    '/api/admin/batches?page=0&size=1000',
    { token }
  ).then((r) => r.content);
}

export async function createBatch(
  token: string,
  body: CreateBatchRequest
): Promise<BatchResponse> {
  return apiRequest<BatchResponse>('/api/admin/batches', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

/**
 * Business rule: building capacity.
 * Uses getAllBatchesFlat to check real capacity across all batches.
 */
export async function validateBatchCapacity(
  token: string,
  buildingId: number,
  chickenCount: number
): Promise<void> {
  const [building, batches] = await Promise.all([
    getBuildingById(token, buildingId),
    getAllBatchesFlat(token),
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
  return apiRequest<StockItemResponse>('/api/admin/stock', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getStock(
  token: string,
  page = 0,
  size = 5
): Promise<PageResponse<StockItemResponse>> {
  return apiRequest<PageResponse<StockItemResponse>>(
    `/api/admin/stock?page=${page}&size=${size}`,
    { token }
  );
}

/** Fetch ALL stock without pagination — used for feeding form dropdown */
export async function getAllStockFlat(token: string): Promise<StockItemResponse[]> {
  return apiRequest<PageResponse<StockItemResponse>>(
    '/api/admin/stock?page=0&size=1000',
    { token }
  ).then((r) => r.content);
}

/** Ouvrier: read-only batch list — uses /api/ouvrier/batches (accessible by OUVRIER + ADMIN) */
export async function getOuvrierBatchesFlat(token: string): Promise<BatchResponse[]> {
  return apiRequest<PageResponse<BatchResponse>>(
    '/api/ouvrier/batches?page=0&size=1000',
    { token }
  ).then((r) => r.content);
}

/** Ouvrier: read-only stock list — uses /api/ouvrier/stock (accessible by OUVRIER + ADMIN) */
export async function getOuvrierStockFlat(token: string): Promise<StockItemResponse[]> {
  return apiRequest<PageResponse<StockItemResponse>>(
    '/api/ouvrier/stock?page=0&size=1000',
    { token }
  ).then((r) => r.content);
}

export async function getStockItemById(
  token: string,
  id: number
): Promise<StockItemResponse> {
  return apiRequest<StockItemResponse>(`/api/admin/stock/${id}`, { token });
}

/* Users (Admin creates Ouvrier / Veterinaire) */
export async function createUser(
  token: string,
  body: AdminCreateUserRequest
): Promise<UserResponse> {
  return apiRequest<UserResponse>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getUsers(
  token: string,
  page = 0,
  size = 5
): Promise<PageResponse<UserResponse>> {
  return apiRequest<PageResponse<UserResponse>>(
    `/api/admin/users?page=${page}&size=${size}`,
    { token }
  );
}

export async function adminChangeUserPassword(
  token: string,
  userId: number,
  newPassword: string
): Promise<void> {
  return apiRequest<void>(`/api/admin/users/${userId}/change-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
    token,
  });
}

/* Dashboard Supervision */
export async function getSupervisionDashboard(
  token: string,
  startDate?: string
): Promise<SupervisionDashboardResponse> {
  const params = startDate ? `?startDate=${startDate}` : '';
  return apiRequest<SupervisionDashboardResponse>(
    `/api/admin/dashboard/supervision${params}`,
    { token }
  );
}

export async function getDashboardAlerts(
  token: string
): Promise<HealthRecordResponse[]> {
  return apiRequest<HealthRecordResponse[]>('/api/admin/dashboard/alerts', {
    token,
  });
}

export async function approveHealthRecord(
  token: string,
  id: number
): Promise<HealthRecordResponse> {
  return apiRequest<HealthRecordResponse>(
    `/api/admin/dashboard/health-records/${id}/approve`,
    { method: 'POST', token }
  );
}

export async function rejectHealthRecord(
  token: string,
  id: number
): Promise<HealthRecordResponse> {
  return apiRequest<HealthRecordResponse>(
    `/api/admin/dashboard/health-records/${id}/reject`,
    { method: 'POST', token }
  );
}

/* Profile (authenticated user) */
export async function getProfile(token: string): Promise<UserResponse> {
  return apiRequest<UserResponse>('/api/users/me', { token });
}

export async function updateProfile(
  token: string,
  body: UpdateProfileRequest
): Promise<UserResponse> {
  return apiRequest<UserResponse>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
    token,
  });
}

export async function changePassword(
  token: string,
  body: ChangePasswordRequest
): Promise<void> {
  return apiRequest<void>('/api/users/me/password', {
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
  return apiRequest<MortalityResponse>('/api/ouvrier/mortality', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getMortalities(
  token: string,
  options?: { startDate?: string; endDate?: string; batchId?: number },
  page = 0,
  size = 5
): Promise<PageResponse<MortalityResponse>> {
  const endDate = options?.endDate || new Date().toISOString().split('T')[0];
  const start =
    options?.startDate ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      return d.toISOString().split('T')[0];
    })();
  const params = new URLSearchParams({
    startDate: start,
    endDate,
    page: String(page),
    size: String(size),
  });
  if (options?.batchId) params.set('batchId', String(options.batchId));
  return apiRequest<PageResponse<MortalityResponse>>(
    `/api/ouvrier/mortality?${params.toString()}`,
    { token }
  );
}

/** Fetch today's feedings + mortalities for daily progress tracking */
export async function getTodayProgress(
  token: string
): Promise<{ feedings: FeedingResponse[]; mortalities: MortalityResponse[] }> {
  const today = new Date().toISOString().split('T')[0];
  const [feedPage, mortPage] = await Promise.all([
    getFeedings(token, { startDate: today, endDate: today }, 0, 1000),
    getMortalities(token, { startDate: today, endDate: today }, 0, 1000),
  ]);
  return { feedings: feedPage.content, mortalities: mortPage.content };
}

/** Fetch mortalities over the last 365 days — used to compute cumulative loss per batch.
 *  The backend enforces a 366-day max range, so we stay safely within that limit. */
export async function getAllMortalitiesFlat(
  token: string
): Promise<MortalityResponse[]> {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const from = new Date(today);
  from.setDate(from.getDate() - 364);
  const startDate = from.toISOString().split('T')[0];
  return getMortalities(token, { startDate, endDate }, 0, 5000)
    .then((r) => r.content);
}

/* Feeding (Ouvrier / Admin) */
export async function createFeeding(
  token: string,
  body: CreateFeedingRequest
): Promise<FeedingResponse> {
  return apiRequest<FeedingResponse>('/api/ouvrier/feeding', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function getFeedings(
  token: string,
  options?: { batchId?: number; startDate?: string; endDate?: string },
  page = 0,
  size = 5
): Promise<PageResponse<FeedingResponse>> {
  const endDate = options?.endDate || new Date().toISOString().split('T')[0];
  const start =
    options?.startDate ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      return d.toISOString().split('T')[0];
    })();
  const params = new URLSearchParams({
    startDate: start,
    endDate,
    page: String(page),
    size: String(size),
  });
  if (options?.batchId) params.set('batchId', String(options.batchId));
  return apiRequest<PageResponse<FeedingResponse>>(
    `/api/ouvrier/feeding?${params.toString()}`,
    { token }
  );
}

/* Health Records (Veterinaire) */
export async function createHealthRecord(
  token: string,
  body: CreateHealthRecordRequest
): Promise<HealthRecordResponse> {
  return apiRequest<HealthRecordResponse>('/api/vet/health-records', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

/* Financial */
export async function getBatchCost(
  token: string,
  batchId: number,
  fixedCharges?: number
): Promise<BatchCostBreakdownResponse> {
  const params = fixedCharges != null ? `?fixedCharges=${fixedCharges}` : '';
  return apiRequest<BatchCostBreakdownResponse>(
    `/api/admin/batches/${batchId}/cost${params}`,
    { token }
  );
}
