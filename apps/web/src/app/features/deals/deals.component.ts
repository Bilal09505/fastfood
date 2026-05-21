// src/app/features/deals/deals.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

import { LoadingComponent } from '../../shared/components/loading-spinner.component';

import type { Deal, MenuItem } from '../../core/models';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    CurrencyPipe,
    ReactiveFormsModule,
    LoadingComponent,
  ],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Deals</h1>

        <button
          *ngIf="auth.isAdmin()"
          (click)="openCreate()"
          class="btn-primary"
        >
          + Add Deal
        </button>
      </div>

      <app-loading *ngIf="loading()" />

      <!-- Deals Grid -->
      <div
        *ngIf="!loading()"
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        <div
          *ngFor="let deal of deals()"
          class="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold text-lg text-gray-900">
                {{ deal.name }}
              </h3>

              <p class="text-sm text-gray-500">
                {{ deal.description || 'No description' }}
              </p>
            </div>

            <span
              [ngClass]="
                deal.isActive
                  ? 'badge bg-green-100 text-green-700'
                  : 'badge bg-gray-100 text-gray-500'
              "
            >
              {{ deal.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <!-- Items -->
          <div class="bg-gray-50 rounded-xl p-3">
            <p class="text-xs uppercase tracking-wide text-gray-400 mb-2">
              Included Items
            </p>

            <div class="space-y-2">
              <div
                *ngFor="let item of deal.items"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-700">
                  {{ item.menuItem?.name }}
                </span>

                <span class="font-medium text-gray-500">
                  x{{ item.quantity }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-primary-600 font-bold text-lg">
              {{ deal.price | currency }}
            </span>
          </div>

          <div
            *ngIf="auth.isAdmin()"
            class="flex gap-2 pt-2 border-t border-gray-100"
          >
            <button
              (click)="editDeal(deal)"
              class="btn-ghost flex-1 text-sm"
            >
              Edit
            </button>

            <button
              (click)="deactivate(deal.id)"
              class="btn-ghost flex-1 text-sm text-red-500"
            >
              Deactivate
            </button>
          </div>
        </div>

        <p
          *ngIf="!deals().length"
          class="col-span-full text-center text-gray-400 py-8"
        >
          No deals found
        </p>
      </div>
    </div>

    <!-- Modal -->
    <div
      *ngIf="showModal()"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-black/40"
        (click)="closeModal()"
      ></div>

      <div
        class="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
      >
        <h2 class="font-semibold text-lg mb-5">
          {{ editingId() ? 'Edit Deal' : 'New Deal' }}
        </h2>

        <form
          [formGroup]="form"
          (ngSubmit)="save()"
          class="space-y-4"
        >
          <div>
            <label class="label">Deal Name *</label>
            <input formControlName="name" class="input" />
          </div>

          <div>
            <label class="label">Description</label>
            <textarea
              formControlName="description"
              rows="3"
              class="input"
            ></textarea>
          </div>

          <div>
            <label class="label">Price *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              formControlName="price"
              class="input"
            />
          </div>

          <!-- Items -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="label">Deal Items</label>

              <button
                type="button"
                (click)="addItem()"
                class="btn-secondary text-sm"
              >
                + Add Item
              </button>
            </div>

            <div formArrayName="items" class="space-y-3">
              <div
                *ngFor="let item of items.controls; let i = index"
                [formGroupName]="i"
                class="grid grid-cols-12 gap-3 items-end bg-gray-50 p-3 rounded-xl"
              >
                <div class="col-span-8">
                  <label class="label">Menu Item</label>

                  <select
                    formControlName="menuItemId"
                    class="input"
                  >
                    <option value="">Select Item</option>

                    <option
                      *ngFor="let m of menuItems()"
                      [value]="m.id"
                    >
                      {{ m.name }}
                    </option>
                  </select>
                </div>

                <div class="col-span-3">
                  <label class="label">Qty</label>

                  <input
                    type="number"
                    min="1"
                    formControlName="quantity"
                    class="input"
                  />
                </div>

                <div class="col-span-1">
                  <button
                    type="button"
                    (click)="removeItem(i)"
                    class="text-red-500 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="formError()" class="alert-danger">
            {{ formError() }}
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              (click)="closeModal()"
              class="btn-secondary flex-1"
            >
              Cancel
            </button>

            <button
              type="submit"
              [disabled]="saving()"
              class="btn-primary flex-1 justify-center"
            >
              {{ saving() ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class DealsComponent implements OnInit {
  auth = inject(AuthService);

  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  deals = signal<Deal[]>([]);
  menuItems = signal<MenuItem[]>([]);

  loading = signal(true);
  saving = signal(false);

  showModal = signal(false);
  editingId = signal<string | null>(null);

  formError = signal('');

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    items: this.fb.array([]),
  });

  get items() {
    return this.form.get('items') as FormArray;
  }

  ngOnInit() {
    this.load();

    this.api.getMenuItems().subscribe({
      next: (res) => this.menuItems.set(res),
    });
  }

  load() {
    this.api.getDeals().subscribe({
      next: (res) => {
        this.deals.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  createItem(item?: any) {
    return this.fb.nonNullable.group({
      menuItemId: [item?.menuItemId || '', Validators.required],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
    });
  }

  addItem() {
    this.items.push(this.createItem());
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  openCreate() {
    this.editingId.set(null);

    this.form.reset({
      name: '',
      description: '',
      price: 0,
    });

    this.items.clear();
    this.addItem();

    this.formError.set('');
    this.showModal.set(true);
  }

  editDeal(deal: Deal) {
    this.editingId.set(deal.id);

    this.form.patchValue({
      name: deal.name,
      description: deal.description || '',
      price: deal.price,
    });

    this.items.clear();

    deal.items.forEach((item) => {
      this.items.push(
        this.createItem({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })
      );
    });

    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  deactivate(id: string) {
    this.api.deactivateDeal(id).subscribe({
      next: () => {
        this.toast.success('Deal deactivated');
        this.load();
      },
      error: () => {
        this.toast.error('Failed');
      },
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const payload = this.form.getRawValue();

    const req = this.editingId()
      ? this.api.updateDeal(this.editingId()!, payload)
      : this.api.createDeal(payload);

    req.subscribe({
      next: () => {
        this.toast.success('Deal saved');

        this.closeModal();
        this.load();

        this.saving.set(false);
      },

      error: (e) => {
        this.formError.set(e?.error?.message ?? 'Error');
        this.saving.set(false);
      },
    });
  }
}