import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { NgFor, NgIf, NgClass, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { LoadingComponent } from '../../shared/components/loading-spinner.component';
import type { Order, OrderStatus, MenuItem, Client, User, Deal } from '../../core/models';

const STATUS_FLOW: Record<string, OrderStatus> = {
  ASSIGNED: 'IN_PROGRESS', IN_PROGRESS: 'READY', READY: 'COMPLETED',
};

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, CurrencyPipe, DatePipe, ReactiveFormsModule,
            StatusBadgeComponent, LoadingComponent],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Orders</h1>
        <button *ngIf="auth.isAdmin() || auth.isSalesman()"
                (click)="openCreate()" class="btn-primary">
          + New Order
        </button>
      </div>

      <!-- Status filter -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <button *ngFor="let s of statusFilters"
                (click)="filterStatus.set(s.value)"
                [ngClass]="filterStatus() === s.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
          {{ s.label }}
        </button>
      </div>

      <app-loading *ngIf="loading()" />

      <div *ngIf="!loading()" class="card p-0 overflow-hidden">
        <div class="table-container">
          <table class="table">
            <thead><tr>
              <th>#</th>
              <th>Client</th>
              <th *ngIf="auth.isAdmin()">Salesman</th>
              <th *ngIf="auth.isAdmin()">Maker</th>
              <th>Deal / Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let o of filtered()">
                <td class="font-mono text-xs text-gray-400">#{{ o.id.slice(-6) }}</td>
                <td>{{ o.client?.name ?? 'Walk-in' }}</td>
                <td *ngIf="auth.isAdmin()">{{ o.salesman?.name }}</td>
                <td *ngIf="auth.isAdmin()">{{ o.maker?.name ?? '—' }}</td>
                <td>
                  <!-- show deal badge if order came from a deal -->
                  <span *ngIf="o.deal"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                               bg-orange-100 text-orange-700 text-xs font-medium">
                    🎁 {{ o.deal.name }}
                  </span>
                  <span *ngIf="!o.deal" class="text-gray-500 text-sm">
                    {{ o.items.length }} item(s)
                  </span>
                </td>
                <td class="font-semibold">{{ o.totalAmount | currency }}</td>
                <td><app-status-badge [status]="o.status" /></td>
                <td class="text-xs text-gray-400">{{ o.createdAt | date:'MMM d, HH:mm' }}</td>
                <td>
                  <div class="flex gap-1.5 flex-wrap">
                    <button *ngIf="auth.isAdmin() && o.status === 'PENDING'"
                            (click)="openAssign(o)"
                            class="btn-ghost text-xs py-1 px-2">
                      Assign
                    </button>
                    <button *ngIf="auth.isMaker() && canAdvance(o.status)"
                            (click)="advance(o)"
                            class="btn-primary text-xs py-1 px-2">
                      → {{ nextStatus(o.status) }}
                    </button>
                    <button *ngIf="canCancel(o)"
                            (click)="cancel(o)"
                            class="btn-ghost text-xs py-1 px-2 text-red-600">
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!filtered().length">
                <td [attr.colspan]="auth.isAdmin() ? 9 : 7"
                    class="text-center text-gray-400 py-8">
                  No orders found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── Create Order Modal ──────────────────────────────────────────── -->
    <div *ngIf="showCreate()" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" (click)="showCreate.set(false)"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6
                  max-h-[90vh] overflow-y-auto">
        <h2 class="font-semibold text-gray-900 text-lg mb-5">New Order</h2>

        <form [formGroup]="createForm" (ngSubmit)="submitOrder()" class="space-y-4">

          <!-- Client -->
          <div>
            <label class="label">Client (optional)</label>
            <select formControlName="clientId" class="input">
              <option value="">Walk-in / no client</option>
              <option *ngFor="let c of clients()" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>

          <!-- Notes -->
          <div>
            <label class="label">Notes</label>
            <textarea formControlName="notes" class="input" rows="2"
                      placeholder="Special instructions..."></textarea>
          </div>

          <!-- Toggle: Deal vs Manual -->
          <div class="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            <button type="button"
                    (click)="orderMode.set('deal')"
                    [ngClass]="orderMode() === 'deal'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'"
                    class="flex-1 py-2 transition-colors">
              🎁 Pick a Deal
            </button>
            <button type="button"
                    (click)="orderMode.set('manual')"
                    [ngClass]="orderMode() === 'manual'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'"
                    class="flex-1 py-2 transition-colors border-l border-gray-200">
              🧾 Manual Items
            </button>
          </div>

          <!-- DEAL MODE -->
          <div *ngIf="orderMode() === 'deal'">
            <label class="label">Select Deal</label>
            <div *ngIf="!deals().length" class="text-sm text-gray-400 text-center py-4 border
                        border-gray-200 rounded-lg">
              No active deals available
            </div>
            <div class="space-y-2 max-h-56 overflow-y-auto">
              <div *ngFor="let d of deals()"
                   (click)="selectedDealId.set(d.id)"
                   [ngClass]="selectedDealId() === d.id
                     ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                     : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'"
                   class="border rounded-xl p-3 cursor-pointer transition-all">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-sm text-gray-800">{{ d.name }}</span>
                  <span class="text-primary-600 font-semibold text-sm">
                    {{ d.price | currency }}
                  </span>
                </div>
                <p *ngIf="d.description" class="text-xs text-gray-400 mt-0.5">
                  {{ d.description }}
                </p>
                <!-- deal items preview -->
                <div class="flex flex-wrap gap-1 mt-2">
                  <span *ngFor="let item of d.items"
                        class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {{ item.menuItem?.name }} ×{{ item.quantity }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- MANUAL MODE -->
          <div *ngIf="orderMode() === 'manual'">
            <label class="label">Menu Items</label>
            <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-200
                        rounded-lg p-3">
              <div *ngFor="let m of menuItems()" class="flex items-center gap-3">
                <input type="checkbox" [id]="m.id"
                       (change)="toggleItem(m, $event)"
                       class="rounded border-gray-300 text-primary-600" />
                <label [for]="m.id" class="flex-1 text-sm text-gray-700 cursor-pointer">
                  {{ m.name }}
                  <span class="text-gray-400 ml-1">{{ m.price | currency }}</span>
                </label>
                <input type="number" min="1" value="1"
                       [id]="'qty-' + m.id"
                       class="input w-16 text-center py-1 text-sm" />
              </div>
              <p *ngIf="!menuItems().length"
                 class="text-sm text-gray-400 text-center py-3">
                No menu items available
              </p>
            </div>
          </div>

          <div *ngIf="orderError()" class="alert-danger">{{ orderError() }}</div>

          <div class="flex gap-3 pt-1">
            <button type="button" (click)="showCreate.set(false)"
                    class="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" [disabled]="saving()"
                    class="btn-primary flex-1 justify-center">
              {{ saving() ? 'Placing...' : 'Place Order' }}
            </button>
          </div>

        </form>
      </div>
    </div>

    <!-- ── Assign Maker Modal ─────────────────────────────────────────── -->
    <div *ngIf="showAssign()" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" (click)="showAssign.set(false)"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 class="font-semibold text-gray-900 text-lg mb-5">Assign Maker</h2>
        <div class="space-y-2">
          <button *ngFor="let m of makers()"
                  (click)="doAssign(m.id)"
                  class="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200
                         hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
            <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700
                        flex items-center justify-center font-semibold text-sm">
              {{ m.name.charAt(0) }}
            </div>
            <div>
              <p class="text-sm font-medium">{{ m.name }}</p>
              <p class="text-xs text-gray-400">{{ m.email }}</p>
            </div>
          </button>
          <p *ngIf="!makers().length"
             class="text-sm text-gray-400 text-center py-4">
            No active makers
          </p>
        </div>
        <button (click)="showAssign.set(false)" class="btn-secondary w-full mt-4">
          Cancel
        </button>
      </div>
    </div>
  `,
})
export class OrdersComponent implements OnInit {
  auth          = inject(AuthService);
  private api   = inject(ApiService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  orders        = signal<Order[]>([]);
  clients       = signal<Client[]>([]);
  makers        = signal<User[]>([]);
  menuItems     = signal<MenuItem[]>([]);
  deals         = signal<Deal[]>([]);
  loading       = signal(true);
  saving        = signal(false);
  showCreate    = signal(false);
  showAssign    = signal(false);
  assignTarget  = signal<Order | null>(null);
  filterStatus  = signal<string>('ALL');
  orderError    = signal('');

  // 'deal' = salesman picks a bundle | 'manual' = salesman picks items
  orderMode     = signal<'deal' | 'manual'>('deal');
  selectedDealId = signal<string>('');
  selectedItems  = new Map<string, number>();

  createForm = this.fb.nonNullable.group({
    clientId: [''],
    notes:    [''],
  });

  statusFilters = [
    { label: 'All',         value: 'ALL'         },
    { label: 'Pending',     value: 'PENDING'      },
    { label: 'Assigned',    value: 'ASSIGNED'     },
    { label: 'In Progress', value: 'IN_PROGRESS'  },
    { label: 'Ready',       value: 'READY'        },
    { label: 'Completed',   value: 'COMPLETED'    },
  ];

  filtered = computed(() =>
    this.filterStatus() === 'ALL'
      ? this.orders()
      : this.orders().filter(o => o.status === this.filterStatus())
  );

  ngOnInit() {
    this.loadOrders();
    if (this.auth.isAdmin() || this.auth.isSalesman()) {
      this.api.getClients().subscribe(c  => this.clients.set(c));
      this.api.getMenuItems().subscribe(m => this.menuItems.set(m.filter(i => i.isAvailable)));
      this.api.getDeals().subscribe(d    => this.deals.set(d));
    }
    if (this.auth.isAdmin()) {
      this.api.getUsers('MAKER').subscribe(u => this.makers.set(u.filter(m => m.isActive)));
    }
  }

  loadOrders() {
    this.loading.set(true);
    this.api.getOrders().subscribe({
      next:  o  => { this.orders.set(o); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.createForm.reset();
    this.selectedItems.clear();
    this.selectedDealId.set('');
    this.orderMode.set('deal');
    this.orderError.set('');
    this.showCreate.set(true);
  }

  toggleItem(item: MenuItem, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) this.selectedItems.set(item.id, 1);
    else         this.selectedItems.delete(item.id);
  }

  submitOrder() {
    this.orderError.set('');
    const { clientId, notes } = this.createForm.getRawValue();

    // ── deal order ───────────────────────────────────────────────────────────
    if (this.orderMode() === 'deal') {
      if (!this.selectedDealId()) {
        this.orderError.set('Please select a deal.'); return;
      }
      this.saving.set(true);
      this.api.createOrder({
        clientId: clientId || undefined,
        notes,
        dealId: this.selectedDealId(),
      }).subscribe({
        next:  () => this.onOrderSuccess(),
        error: (e) => this.onOrderError(e),
      });
      return;
    }

    // ── manual order ─────────────────────────────────────────────────────────
    if (this.selectedItems.size === 0) {
      this.orderError.set('Select at least one menu item.'); return;
    }
    this.saving.set(true);
    const items = Array.from(this.selectedItems.keys()).map(menuItemId => {
      const input = document.getElementById('qty-' + menuItemId) as HTMLInputElement;
      return { menuItemId, quantity: input ? parseInt(input.value) || 1 : 1 };
    });
    this.api.createOrder({ clientId: clientId || undefined, notes, items }).subscribe({
      next:  () => this.onOrderSuccess(),
      error: (e) => this.onOrderError(e),
    });
  }

  private onOrderSuccess() {
    this.toast.success('Order placed!');
    this.showCreate.set(false);
    this.loadOrders();
    this.saving.set(false);
  }

  private onOrderError(e: any) {
    this.orderError.set(e?.error?.message ?? 'Failed to place order.');
    this.saving.set(false);
  }

  openAssign(o: Order) { this.assignTarget.set(o); this.showAssign.set(true); }

  doAssign(makerId: string) {
    const o = this.assignTarget();
    if (!o) return;
    this.api.assignMaker(o.id, makerId).subscribe({
      next:  () => { this.toast.success('Maker assigned'); this.showAssign.set(false); this.loadOrders(); },
      error: ()  => this.toast.error('Failed to assign'),
    });
  }

  canAdvance(status: OrderStatus)  { return !!STATUS_FLOW[status]; }
  nextStatus(status: OrderStatus)  { return STATUS_FLOW[status] ?? ''; }

  advance(o: Order) {
    const next = STATUS_FLOW[o.status] as OrderStatus;
    if (!next) return;
    this.api.updateOrderStatus(o.id, next).subscribe({
      next:  () => { this.toast.success(`Order → ${next}`); this.loadOrders(); },
      error: ()  => this.toast.error('Failed to update status'),
    });
  }

  canCancel(o: Order) {
    if (this.auth.isAdmin())    return !['COMPLETED', 'CANCELLED'].includes(o.status);
    if (this.auth.isSalesman()) return o.status === 'PENDING';
    return false;
  }

  cancel(o: Order) {
    this.api.cancelOrder(o.id).subscribe({
      next:  () => { this.toast.success('Order cancelled'); this.loadOrders(); },
      error: ()  => this.toast.error('Failed to cancel'),
    });
  }
}