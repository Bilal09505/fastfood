// libs/shared-types/src/user.types.ts
import { Role } from './auth.types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  salesmanId: string;
  salesman?: { id: string; name: string };
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  costPerUnit: number;
  isLowStock?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  category?: { id: string; name: string };
  isAvailable: boolean;
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  materialId: string;
  material?: { id: string; name: string; unit: string };
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  purchaseDate: string;
  notes?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  recordedById: string;
  recordedBy?: { id: string; name: string };
}
