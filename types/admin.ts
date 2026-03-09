/* Admin Types - DjajBladi API (Buildings, Batches, Stock, Dashboard, Mortality, Feeding, Health) */

/* Pagination */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}


/* Buildings */
export interface BuildingResponse {
  id: number;
  name: string;
  maxCapacity: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildingRequest {
  name: string;
  maxCapacity: number;
  imageUrl?: string;
}

/* Batches */
export type BatchStatus = 'Active' | 'Completed' | 'Cancelled';

export interface BatchResponse {
  id: number;
  batchNumber: string;
  strain: string;
  chickenCount: number;
  arrivalDate: string;
  purchasePrice: number;
  buildingId: number | null;
  buildingName: string | null;
  status: BatchStatus;
  notes: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchRequest {
  batchNumber: string;
  strain: string;
  chickenCount: number;
  arrivalDate: string;
  purchasePrice: number;
  buildingId?: number;
  notes?: string;
}

/* Stock */
export enum StockType {
  Feed = 'Feed',
  Vaccine = 'Vaccine',
  Vitamin = 'Vitamin',
}

export interface StockItemResponse {
  id: number;
  type: StockType;
  name: string | null;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockRequest {
  type: StockType;
  name?: string;
  quantity: number;
  unit: string;
}

/* Admin Create User */
export interface AdminCreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: string;
}

/* Profile */
export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  city?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/* Mortality */
export interface CreateMortalityRequest {
  batchId: number;
  recordDate: string;
  mortalityCount: number;
  notes?: string;
}

export interface MortalityResponse {
  id: number;
  batchId: number;
  batchNumber: string;
  recordDate: string;
  mortalityCount: number;
  notes: string | null;
  recordedById: number;
  recordedByName: string;
  createdAt: string;
  updatedAt: string;
}

/* Feeding */
export interface CreateFeedingRequest {
  batchId: number;
  stockItemId: number;
  feedType: string;
  quantity: number;
  feedingDate: string;
  notes?: string;
}

export interface FeedingResponse {
  id: number;
  batchId: number;
  batchNumber: string;
  stockItemId: number | null;
  stockItemName: string | null;
  feedType: string;
  quantity: number;
  feedingDate: string;
  notes: string | null;
  recordedById: number;
  recordedByName: string;
  createdAt: string;
  updatedAt: string;
}

/* Health Records */
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface CreateHealthRecordRequest {
  batchId: number;
  diagnosis: string;
  treatment?: string;
  examinationDate: string;
  nextVisitDate?: string;
  mortalityCount?: number;
  treatmentCost?: number;
  isDiseaseReported?: boolean;
  notes?: string;
}

export interface HealthRecordResponse {
  id: number;
  batchId: number;
  batchNumber: string;
  veterinarianId: number;
  veterinarianName: string;
  diagnosis: string;
  treatment: string | null;
  examinationDate: string;
  nextVisitDate: string | null;
  mortalityCount: number;
  treatmentCost: number | null;
  requiresApproval: boolean;
  approvalStatus: ApprovalStatus;
  approvedById: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/* Dashboard Supervision */
export interface BatchDailySummary {
  batchId: number;
  batchNumber: string;
  date: string;
  totalQuantityEaten: number;
  mortalityCount: number;
  recordedByName: string;
  abnormalConsumption: boolean;
  // FCR fields
  ageInDays: number | null;
  estimatedWeightKg: number | null;
  actualWeightKg: number | null;
  cumulativeFeedKg: number | null;
  cumulativeFcr: number | null;
  dailyFcr: number | null;
  fcrAlert: boolean;
}

export interface HealthAlertSummary {
  healthRecordId: number;
  batchId: number;
  batchNumber: string;
  diagnosis: string;
  treatment: string | null;
  treatmentCost: number | null;
  examinationDate: string;
  veterinarianName: string;
  createdAt: string;
}

export type FcrStatus = 'EXCELLENT' | 'BON' | 'ALERTE' | 'CRITIQUE' | 'INCONNU';

export interface BatchFcrSummary {
  batchId: number;
  batchNumber: string;
  strain: string | null;
  ageInDays: number;
  aliveChickens: number;
  totalFeedConsumedKg: number;
  estimatedWeightKg: number;
  actualWeightKg: number | null;
  cumulativeFcr: number | null;
  fcrAlert: boolean;
  fcrThreshold: number;
  fcrStatus: FcrStatus;
}

export interface SupervisionDashboardResponse {
  startDate: string;
  endDate: string;
  batchSummaries: BatchDailySummary[];
  pendingAlerts: HealthAlertSummary[];
  fcrSummaries: BatchFcrSummary[];
}
