// src/app/core/models/index.ts

export type Role = 'ADMIN' | 'SALESMAN' | 'MAKER' | 'SUPPLIER';

export type OrderStatus =
  | 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type ExpenseCategory =
  | 'RENT' | 'UTILITIES' | 'SALARIES' | 'MAINTENANCE' | 'SUPPLIES' | 'OTHER';

// ── Auth ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ── Users ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

// ── Clients ─────────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  salesmanId: string;
  salesman?: { id: string; name: string };
  createdAt: string;
}

// ── Menu ────────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  category?: Category;
  isAvailable: boolean;
  imageUrl?: string;
  materials?: MenuItemMaterial[];
}

export interface MenuItemMaterial {
  id: string;
  menuItemId: string;
  materialId: string;
  quantityNeeded: number;
  material?: Material;
}

// ── Materials ────────────────────────────────────────────────────────────────
export interface Material {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  costPerUnit: number;
  createdAt: string;
  updatedAt: string;
}

// ── Orders ───────────────────────────────────────────────────────────────────
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
  deal?: Deal;
}

// ── Purchases ────────────────────────────────────────────────────────────────
export interface Purchase {
  id: string;
  supplierId: string;
  supplier?: { id: string; name: string };
  materialId: string;
  material?: { id: string; name: string; unit: string };
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  purchaseDate: string;
  notes?: string;
}

// ── Expenses ─────────────────────────────────────────────────────────────────
export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  recordedById: string;
  recordedBy?: { id: string; name: string };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface AdminDashboard {
  today: { sales: number; expenses: number; netProfit: number };
  thisMonth: {
    sales: number; expenses: number; netProfit: number;
    orderCount: number; purchaseCost: number; purchaseCount: number;
  };
  ordersByStatus: { status: OrderStatus; count: number }[];
  topMenuItems: { menuItemId: string; name: string; totalQuantity: number }[];
  lowStockMaterials: Material[];
  recentOrders: Order[];
  salesBySalesman: { salesmanId: string; name: string; totalSales: number; orderCount: number }[];
  dailyRevenueLast30: { date: string; revenue: number }[];
}

export interface SalesmanDashboard {
  todayOrderCount: number;
  thisMonth: { totalSales: number; completedOrders: number };
  topClients: { clientId: string; name: string; orderCount: number; totalSpent: number }[];
  recentOrders: Order[];
}

export interface MakerDashboard {
  assignedOrders: Order[];
  inProgressOrders: Order[];
  completedToday: number;
  completedThisMonth: number;
}

export interface SupplierDashboard {
  lowStockMaterials: Material[];
  allMaterials: Material[];
  recentPurchases: Purchase[];
  thisMonth: { totalSpent: number; purchaseCount: number };
}

export interface DealItem {
  id?:        string;
  quantity:   number;
  menuItemId: string;
  menuItem?:  MenuItem;  
}

export interface Deal {
  id:           string;
  name:         string;
  description?: string;
  price:        number;
  isActive:     boolean;
  createdAt?:   string;
  updatedAt?:   string;
  items:        DealItem[];
}