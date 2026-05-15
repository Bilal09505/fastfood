// src/app/features/dashboard/dashboard.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading-spinner.component';
import type { AdminDashboard, SalesmanDashboard, MakerDashboard, SupplierDashboard } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, DecimalPipe, StatusBadgeComponent, LoadingComponent],
  template: `
    <div>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="text-sm text-gray-500 mt-0.5">Welcome back, {{ auth.currentUser()?.name }}</p>
        </div>
        <span class="text-xs text-gray-400">{{ today | date:'EEEE, MMMM d, y' }}</span>
      </div>

      <app-loading *ngIf="loading()" />

      <!-- ADMIN DASHBOARD -->
      <ng-container *ngIf="!loading() && auth.isAdmin() && adminData()">
        <!-- KPI Row -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="stat-card">
            <div class="stat-icon bg-green-50">💰</div>
            <div>
              <p class="stat-label">Sales Today</p>
              <p class="stat-value">{{ adminData()!.today.sales | currency }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-red-50">📤</div>
            <div>
              <p class="stat-label">Expenses Today</p>
              <p class="stat-value">{{ adminData()!.today.expenses | currency }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-blue-50">📈</div>
            <div>
              <p class="stat-label">Net Profit Today</p>
              <p class="stat-value" [class.text-red-600]="adminData()!.today.netProfit < 0">
                {{ adminData()!.today.netProfit | currency }}
              </p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-purple-50">📦</div>
            <div>
              <p class="stat-label">Orders This Month</p>
              <p class="stat-value">{{ adminData()!.thisMonth.orderCount }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <!-- Orders by status -->
          <div class="card">
            <h3 class="font-semibold text-gray-800 mb-4">Orders by Status</h3>
            <div class="space-y-2.5">
              <div *ngFor="let s of adminData()!.ordersByStatus"
                   class="flex items-center justify-between">
                <app-status-badge [status]="s.status" />
                <span class="font-semibold text-gray-800">{{ s.count }}</span>
              </div>
            </div>
          </div>

          <!-- Top menu items -->
          <div class="card">
            <h3 class="font-semibold text-gray-800 mb-4">🏆 Top Menu Items</h3>
            <div class="space-y-2.5">
              <div *ngFor="let item of adminData()!.topMenuItems; let i = index"
                   class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-700
                             text-xs font-bold flex items-center justify-center">
                  {{ i + 1 }}
                </span>
                <span class="flex-1 text-sm text-gray-700 truncate">{{ item.name }}</span>
                <span class="text-sm font-semibold text-gray-800">{{ item.totalQuantity }}</span>
              </div>
              <p *ngIf="!adminData()!.topMenuItems.length" class="text-sm text-gray-400">
                No data yet
              </p>
            </div>
          </div>

          <!-- Low stock alerts -->
          <div class="card border-red-100">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Low Stock Alerts
            </h3>
            <div class="space-y-2">
              <div *ngFor="let m of adminData()!.lowStockMaterials"
                   class="flex items-center justify-between p-2 rounded-lg bg-red-50">
                <span class="text-sm text-red-800 font-medium">{{ m.name }}</span>
                <span class="text-xs text-red-600">
                  {{ m.currentStock | number:'1.0-2' }} {{ m.unit }}
                </span>
              </div>
              <p *ngIf="!adminData()!.lowStockMaterials.length"
                 class="text-sm text-green-600">✅ All stock levels OK</p>
            </div>
          </div>
        </div>

        <!-- Monthly stats row -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="card">
            <p class="stat-label">Month Sales</p>
            <p class="stat-value text-xl">{{ adminData()!.thisMonth.sales | currency }}</p>
          </div>
          <div class="card">
            <p class="stat-label">Month Expenses</p>
            <p class="stat-value text-xl">{{ adminData()!.thisMonth.expenses | currency }}</p>
          </div>
          <div class="card">
            <p class="stat-label">Month Net Profit</p>
            <p class="stat-value text-xl" [class.text-red-600]="adminData()!.thisMonth.netProfit < 0">
              {{ adminData()!.thisMonth.netProfit | currency }}
            </p>
          </div>
          <div class="card">
            <p class="stat-label">Purchase Spend</p>
            <p class="stat-value text-xl">{{ adminData()!.thisMonth.purchaseCost | currency }}</p>
          </div>
        </div>

        <!-- Sales by salesman -->
        <div class="card mb-6">
          <h3 class="font-semibold text-gray-800 mb-4">Sales by Salesman (This Month)</h3>
          <div class="table-container">
            <table class="table">
              <thead><tr>
                <th>Salesman</th><th>Orders</th><th>Total Sales</th>
              </tr></thead>
              <tbody>
                <tr *ngFor="let s of adminData()!.salesBySalesman">
                  <td class="font-medium">{{ s.name }}</td>
                  <td>{{ s.orderCount }}</td>
                  <td class="font-semibold text-green-700">{{ s.totalSales | currency }}</td>
                </tr>
                <tr *ngIf="!adminData()!.salesBySalesman.length">
                  <td colspan="3" class="text-center text-gray-400">No sales this month</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Orders -->
        <div class="card">
          <h3 class="font-semibold text-gray-800 mb-4">Recent Orders</h3>
          <div class="table-container">
            <table class="table">
              <thead><tr>
                <th>Order</th><th>Client</th><th>Salesman</th><th>Status</th><th>Total</th><th>Date</th>
              </tr></thead>
              <tbody>
                <tr *ngFor="let o of adminData()!.recentOrders">
                  <td class="font-mono text-xs text-gray-400">#{{ o.id.slice(-6) }}</td>
                  <td>{{ o.client?.name ?? '—' }}</td>
                  <td>{{ o.salesman?.name }}</td>
                  <td><app-status-badge [status]="o.status" /></td>
                  <td class="font-semibold">{{ o.totalAmount | currency }}</td>
                  <td class="text-gray-400">{{ o.createdAt | date:'MMM d, HH:mm' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- SALESMAN DASHBOARD -->
      <ng-container *ngIf="!loading() && auth.isSalesman() && salesmanData()">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="stat-card">
            <div class="stat-icon bg-blue-50">📋</div>
            <div>
              <p class="stat-label">Orders Today</p>
              <p class="stat-value">{{ salesmanData()!.todayOrderCount }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-green-50">💰</div>
            <div>
              <p class="stat-label">Sales This Month</p>
              <p class="stat-value">{{ salesmanData()!.thisMonth.totalSales | currency }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-purple-50">✅</div>
            <div>
              <p class="stat-label">Completed Orders</p>
              <p class="stat-value">{{ salesmanData()!.thisMonth.completedOrders }}</p>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card">
            <h3 class="font-semibold text-gray-800 mb-4">Top Clients</h3>
            <div class="space-y-2">
              <div *ngFor="let c of salesmanData()!.topClients"
                   class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ c.name }}</p>
                  <p class="text-xs text-gray-400">{{ c.orderCount }} orders</p>
                </div>
                <span class="text-sm font-semibold text-green-700">{{ c.totalSpent | currency }}</span>
              </div>
              <p *ngIf="!salesmanData()!.topClients.length" class="text-sm text-gray-400">No clients yet</p>
            </div>
          </div>
          <div class="card">
            <h3 class="font-semibold text-gray-800 mb-4">Recent Orders</h3>
            <div class="space-y-2">
              <div *ngFor="let o of salesmanData()!.recentOrders"
                   class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div>
                  <p class="text-sm font-medium">#{{ o.id.slice(-6) }}</p>
                  <p class="text-xs text-gray-400">{{ o.client?.name ?? 'Walk-in' }}</p>
                </div>
                <div class="text-right">
                  <app-status-badge [status]="o.status" />
                  <p class="text-xs font-semibold mt-1">{{ o.totalAmount | currency }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- MAKER DASHBOARD -->
      <ng-container *ngIf="!loading() && auth.isMaker() && makerData()">
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="stat-card">
            <div class="stat-icon bg-blue-50">📋</div>
            <div>
              <p class="stat-label">Assigned to Me</p>
              <p class="stat-value">{{ makerData()!.assignedOrders.length }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-yellow-50">⚙️</div>
            <div>
              <p class="stat-label">In Progress</p>
              <p class="stat-value">{{ makerData()!.inProgressOrders.length }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-green-50">✅</div>
            <div>
              <p class="stat-label">Completed Today</p>
              <p class="stat-value">{{ makerData()!.completedToday }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-purple-50">📈</div>
            <div>
              <p class="stat-label">Completed This Month</p>
              <p class="stat-value">{{ makerData()!.completedThisMonth }}</p>
            </div>
          </div>
        </div>
        <div class="card">
          <h3 class="font-semibold text-gray-800 mb-4">My Active Orders</h3>
          <div class="space-y-3">
            <div *ngFor="let o of makerData()!.assignedOrders.concat(makerData()!.inProgressOrders)"
                 class="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-primary-200">
              <div>
                <p class="text-sm font-semibold">#{{ o.id.slice(-6) }}</p>
                <p class="text-xs text-gray-400">{{ o.items.length }} items</p>
              </div>
              <app-status-badge [status]="o.status" />
            </div>
            <p *ngIf="!makerData()!.assignedOrders.length && !makerData()!.inProgressOrders.length"
               class="text-sm text-gray-400 text-center py-4">No active orders right now</p>
          </div>
        </div>
      </ng-container>

      <!-- SUPPLIER DASHBOARD -->
      <ng-container *ngIf="!loading() && auth.isSupplier() && supplierData()">
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="stat-card">
            <div class="stat-icon bg-red-50">⚠️</div>
            <div>
              <p class="stat-label">Low Stock Items</p>
              <p class="stat-value text-red-600">{{ supplierData()!.lowStockMaterials.length }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-green-50">💰</div>
            <div>
              <p class="stat-label">Spent This Month</p>
              <p class="stat-value">{{ supplierData()!.thisMonth.totalSpent | currency }}</p>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card border-red-100">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Low Stock Materials
            </h3>
            <div class="space-y-2">
              <div *ngFor="let m of supplierData()!.lowStockMaterials"
                   class="flex justify-between items-center p-2 rounded-lg bg-red-50">
                <p class="text-sm font-medium text-red-800">{{ m.name }}</p>
                <p class="text-xs text-red-600">{{ m.currentStock }} / {{ m.minStockLevel }} {{ m.unit }}</p>
              </div>
              <p *ngIf="!supplierData()!.lowStockMaterials.length" class="text-sm text-green-600">
                ✅ All stock levels OK
              </p>
            </div>
          </div>
          <div class="card">
            <h3 class="font-semibold text-gray-800 mb-4">Recent Purchases</h3>
            <div class="space-y-2">
              <div *ngFor="let p of supplierData()!.recentPurchases"
                   class="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                <div>
                  <p class="text-sm font-medium">{{ p.material?.name }}</p>
                  <p class="text-xs text-gray-400">{{ p.quantity }} {{ p.material?.unit }}</p>
                </div>
                <span class="text-sm font-semibold text-gray-800">{{ p.totalCost | currency }}</span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  loading    = signal(true);
  adminData    = signal<AdminDashboard | null>(null);
  salesmanData = signal<SalesmanDashboard | null>(null);
  makerData    = signal<MakerDashboard | null>(null);
  supplierData = signal<SupplierDashboard | null>(null);

  today = new Date();

  ngOnInit() {
    const role = this.auth.currentUser()?.role;
    if (role === 'ADMIN') {
      this.api.getAdminDashboard().subscribe({
        next: d => { this.adminData.set(d); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else if (role === 'SALESMAN') {
      this.api.getSalesmanDashboard().subscribe({
        next: d => { this.salesmanData.set(d); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else if (role === 'MAKER') {
      this.api.getMakerDashboard().subscribe({
        next: d => { this.makerData.set(d); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    } else if (role === 'SUPPLIER') {
      this.api.getSupplierDashboard().subscribe({
        next: d => { this.supplierData.set(d); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    }
  }
}
