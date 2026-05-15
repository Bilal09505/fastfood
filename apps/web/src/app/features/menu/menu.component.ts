// src/app/features/menu/menu.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingComponent } from '../../shared/components/loading-spinner.component';
import type { MenuItem, Category } from '../../core/models';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, CurrencyPipe, ReactiveFormsModule, LoadingComponent],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Menu</h1>
        <button *ngIf="auth.isAdmin()" (click)="openCreate()" class="btn-primary">+ Add Item</button>
      </div>

      <!-- Category filter -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <button (click)="filterCat.set('')"
                [ngClass]="filterCat() === '' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium">All</button>
        <button *ngFor="let c of categories()" (click)="filterCat.set(c.id)"
                [ngClass]="filterCat() === c.id ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium">{{ c.name }}</button>
      </div>

      <app-loading *ngIf="loading()" />

      <!-- Cards grid -->
      <div *ngIf="!loading()" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div *ngFor="let item of filtered()"
             class="card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
          <div class="w-full h-24 bg-gradient-to-br from-primary-50 to-orange-50 rounded-lg
                      flex items-center justify-center text-4xl">
            🍔
          </div>
          <div class="flex-1">
            <p class="font-semibold text-gray-900 text-sm leading-tight">{{ item.name }}</p>
            <p class="text-xs text-gray-400">{{ item.category?.name }}</p>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-primary-600 font-bold">{{ item.price | currency }}</span>
            <span [ngClass]="item.isAvailable ? 'badge bg-green-100 text-green-700' : 'badge bg-gray-100 text-gray-400'">
              {{ item.isAvailable ? 'Active' : 'Off' }}
            </span>
          </div>
          <div *ngIf="auth.isAdmin()" class="flex gap-2 pt-1 border-t border-gray-50">
            <button (click)="editItem(item)" class="btn-ghost flex-1 text-xs py-1">Edit</button>
            <button (click)="toggleAvailable(item)" class="btn-ghost flex-1 text-xs py-1"
                    [ngClass]="item.isAvailable ? 'text-red-500' : 'text-green-600'">
              {{ item.isAvailable ? 'Disable' : 'Enable' }}
            </button>
          </div>
        </div>
        <p *ngIf="!filtered().length" class="col-span-full text-center text-gray-400 py-8">
          No menu items found
        </p>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" (click)="closeModal()"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="font-semibold text-gray-900 text-lg mb-5">{{ editingId() ? 'Edit Item' : 'New Menu Item' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
          <div><label class="label">Item Name *</label><input formControlName="name" class="input" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Category *</label>
              <select formControlName="categoryId" class="input">
                <option value="">Select</option>
                <option *ngFor="let c of categories()" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div><label class="label">Price ($)</label><input formControlName="price" type="number" step="0.01" min="0" class="input" /></div>
          </div>
          <div *ngIf="formError()" class="alert-danger">{{ formError() }}</div>
          <div class="flex gap-3">
            <button type="button" (click)="closeModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1 justify-center">{{ saving() ? 'Saving...' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class MenuComponent implements OnInit {
  auth  = inject(AuthService);
  private api   = inject(ApiService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  items      = signal<MenuItem[]>([]);
  categories = signal<Category[]>([]);
  loading    = signal(true);
  saving     = signal(false);
  showModal  = signal(false);
  editingId  = signal<string|null>(null);
  filterCat  = signal('');
  formError  = signal('');

  filtered = () => this.filterCat()
    ? this.items().filter(i => i.categoryId === this.filterCat())
    : this.items();

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', Validators.required],
  });

  ngOnInit() {
    this.api.getCategories().subscribe(c => this.categories.set(c));
    this.load();
  }

  load() {
    this.api.getMenuItems().subscribe({
      next: m => { this.items.set(m); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() { this.editingId.set(null); this.form.reset({ price: 0 }); this.formError.set(''); this.showModal.set(true); }
  editItem(m: MenuItem) { this.editingId.set(m.id); this.form.patchValue(m); this.formError.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  toggleAvailable(m: MenuItem) {
    this.api.updateMenuItem(m.id, { isAvailable: !m.isAvailable }).subscribe({
      next: () => { this.toast.success('Updated'); this.load(); },
      error: () => this.toast.error('Failed'),
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const req = this.editingId() ? this.api.updateMenuItem(this.editingId()!, v) : this.api.createMenuItem(v);
    req.subscribe({
      next: () => { this.toast.success('Saved'); this.closeModal(); this.load(); this.saving.set(false); },
      error: (e) => { this.formError.set(e?.error?.message ?? 'Error'); this.saving.set(false); },
    });
  }
}
