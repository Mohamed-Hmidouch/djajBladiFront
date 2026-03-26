/* Client Types - DjajBladi Purchase System */

export type PaymentStatus = 'Pending' | 'Paid' | 'Cancelled';

export interface AvailableBatchResponse {
  batchId: number;
  batchNumber: string;
  strain: string;
  availableQuantity: number;
  pricePerUnit: number;
  minimumOrderQuantity: number;
  arrivalDate: string;
  ageInDays: number;
  buildingName: string | null;
  minimumOrderPrice: number | null;
}

export interface PurchaseOrderRequest {
  batchId: number;
  quantity: number;
  deliveryAddress: string;
  notes?: string;
}

export interface PurchaseOrderResponse {
  orderId: number;
  batchNumber: string;
  strain: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleDate: string;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  notes: string | null;
  createdAt: string;
}

export interface ClientOrderSummary {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  pendingAmount: number;
  totalChickensPurchased: number;
  latestOrder: PurchaseOrderResponse | null;
  recentOrders: PurchaseOrderResponse[];
}
