// libs/shared-types/src/order.types.ts

export type OrderStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem?: { id: string; name: string };
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  salesmanId: string;
  salesman?: { id: string; name: string };
  clientId?: string;
  client?: { id: string; name: string };
  makerId?: string;
  maker?: { id: string; name: string };
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  clientId?: string;
  notes?: string;
  items: { menuItemId: string; quantity: number }[];
}
