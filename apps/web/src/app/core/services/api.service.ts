// src/app/core/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type {
  User, Client, Category, MenuItem, Material, Order, Purchase,
  Expense, AdminDashboard, SalesmanDashboard, MakerDashboard, SupplierDashboard,
  OrderStatus, ExpenseCategory
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ── Users ────────────────────────────────────────────────────────────
  getUsers(role?: string) {
    const params = role ? new HttpParams().set('role', role) : undefined;
    return this.http.get<User[]>(`${this.base}/users`, { params });
  }
  createUser(data: any) { return this.http.post<User>(`${this.base}/users`, data); }
  updateUser(id: string, data: any) { return this.http.patch<User>(`${this.base}/users/${id}`, data); }
  deactivateUser(id: string) { return this.http.patch<User>(`${this.base}/users/${id}/deactivate`, {}); }
  activateUser(id: string)   { return this.http.patch<User>(`${this.base}/users/${id}/activate`, {}); }

  // ── Clients ──────────────────────────────────────────────────────────
  getClients()                   { return this.http.get<Client[]>(`${this.base}/clients`); }
  getClient(id: string)          { return this.http.get<Client>(`${this.base}/clients/${id}`); }
  createClient(data: any)        { return this.http.post<Client>(`${this.base}/clients`, data); }
  updateClient(id: string, d: any) { return this.http.patch<Client>(`${this.base}/clients/${id}`, d); }
  deleteClient(id: string)       { return this.http.delete(`${this.base}/clients/${id}`); }

  // ── Categories ───────────────────────────────────────────────────────
  getCategories()           { return this.http.get<Category[]>(`${this.base}/categories`); }
  createCategory(data: any) { return this.http.post<Category>(`${this.base}/categories`, data); }
  deleteCategory(id: string){ return this.http.delete(`${this.base}/categories/${id}`); }

  // ── Menu Items ───────────────────────────────────────────────────────
  getMenuItems()                   { return this.http.get<MenuItem[]>(`${this.base}/menu-items`); }
  getMenuItem(id: string)          { return this.http.get<MenuItem>(`${this.base}/menu-items/${id}`); }
  createMenuItem(data: any)        { return this.http.post<MenuItem>(`${this.base}/menu-items`, data); }
  updateMenuItem(id: string, d: any) { return this.http.patch<MenuItem>(`${this.base}/menu-items/${id}`, d); }
  deleteMenuItem(id: string)       { return this.http.delete(`${this.base}/menu-items/${id}`); }
  setRecipe(id: string, data: any) { return this.http.post(`${this.base}/menu-items/${id}/materials`, data); }

  // ── Materials ────────────────────────────────────────────────────────
  getMaterials()      { return this.http.get<Material[]>(`${this.base}/materials`); }
  getLowStock()       { return this.http.get<Material[]>(`${this.base}/materials/low-stock`); }
  createMaterial(d: any)         { return this.http.post<Material>(`${this.base}/materials`, d); }
  updateMaterial(id: string, d: any) { return this.http.patch<Material>(`${this.base}/materials/${id}`, d); }
  deleteMaterial(id: string)     { return this.http.delete(`${this.base}/materials/${id}`); }

  // ── Orders ───────────────────────────────────────────────────────────
  getOrders(status?: OrderStatus, date?: string) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (date)   params = params.set('date', date);
    return this.http.get<Order[]>(`${this.base}/orders`, { params });
  }
  getOrder(id: string)           { return this.http.get<Order>(`${this.base}/orders/${id}`); }
  createOrder(data: any)         { return this.http.post<Order>(`${this.base}/orders`, data); }
  assignMaker(id: string, makerId: string) {
    return this.http.patch<Order>(`${this.base}/orders/${id}/assign`, { makerId });
  }
  updateOrderStatus(id: string, status: OrderStatus) {
    return this.http.patch<Order>(`${this.base}/orders/${id}/status`, { status });
  }
  cancelOrder(id: string) { return this.http.patch<Order>(`${this.base}/orders/${id}/cancel`, {}); }
  getOrderStats()         { return this.http.get<any>(`${this.base}/orders/stats/summary`); }

  // ── Purchases ────────────────────────────────────────────────────────
  getPurchases()          { return this.http.get<Purchase[]>(`${this.base}/purchases`); }
  createPurchase(data: any) { return this.http.post<Purchase>(`${this.base}/purchases`, data); }
  getPurchaseSummary()    { return this.http.get<any>(`${this.base}/purchases/summary`); }

  // ── Expenses ─────────────────────────────────────────────────────────
  getExpenses(month?: string, category?: ExpenseCategory) {
    let params = new HttpParams();
    if (month)    params = params.set('month', month);
    if (category) params = params.set('category', category);
    return this.http.get<Expense[]>(`${this.base}/expenses`, { params });
  }
  createExpense(data: any)           { return this.http.post<Expense>(`${this.base}/expenses`, data); }
  updateExpense(id: string, data: any) { return this.http.patch<Expense>(`${this.base}/expenses/${id}`, data); }
  deleteExpense(id: string)          { return this.http.delete(`${this.base}/expenses/${id}`); }
  getExpenseSummary(start?: string, end?: string) {
    let params = new HttpParams();
    if (start) params = params.set('startDate', start);
    if (end)   params = params.set('endDate', end);
    return this.http.get<any>(`${this.base}/expenses/summary`, { params });
  }

  // ── Dashboard ────────────────────────────────────────────────────────
  getAdminDashboard()    { return this.http.get<AdminDashboard>(`${this.base}/dashboard/admin`); }
  getSalesmanDashboard() { return this.http.get<SalesmanDashboard>(`${this.base}/dashboard/salesman`); }
  getMakerDashboard()    { return this.http.get<MakerDashboard>(`${this.base}/dashboard/maker`); }
  getSupplierDashboard() { return this.http.get<SupplierDashboard>(`${this.base}/dashboard/supplier`); }
}
