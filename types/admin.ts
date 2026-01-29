/* Admin Types - DjajBladi API (Buildings, Batches, Stock) */

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
export interface BatchResponse {
  id: number;
  batchNumber: string;
  strain: string;
  chickenCount: number;
  arrivalDate: string;
  purchasePrice: number;
  buildingId: number | null;
  buildingName: string | null;
  status: string;
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
