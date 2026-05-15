// src/app/features/purchases/purchases.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingComponent } from '../../shared/components/loading-spinner.component';
import type { Purchase, Material } from '../../core/models';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, DatePipe, DecimalPipe, ReactiveFormsModule, LoadingComponent],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Purchases</h1>
        <button (click)="openCreate()" class="btn-primary">+ Record Purchase</button>
      </div>
      <app-loading *ngIf="loading()" />
      <div *ngIf="!loading()" class="card p-0 overflow-hidden">
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Material</th><th>Quantity</th><th>Cost/Unit</th><th>Total</th><th>Date</th><th>Notes</th></tr></thead>
            <tbody>
              <tr *ngFor="let p of purchases()">
                <td class="font-medium">{{ p.material?.name }}</td>
                <td>{{ p.quantity | number:'1.0-3' }} {{ p.material?.unit }}</td>
                <td>{{ p.costPerUnit | currency }}</td>
                <td class="font-semibold text-green-700">{{ p.totalCost | currency }}</td>
                <td class="text-xs text-gray-400">{{ p.purchaseDate | date:'MMM d, y' }}</td>
                <td class="text-gray-400 text-xs">{{ p.notes ?? '—' }}</td>
              </tr>
              <tr *ngIf="!purchases().length">
                <td colspan="6" class="text-center text-gray-400 py-8">No purchases yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" (click)="showModal.set(false)"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="font-semibold text-gray-900 text-lg mb-5">Record Purchase</h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
          <div>
            <label class="label">Material *</label>
            <select formControlName="materialId" class="input">
              <option value="">Select material</option>
              <option *ngFor="let m of materials()" [value]="m.id">{{ m.name }} ({{ m.unit }})</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="label">Quantity</label><input formControlName="quantity" type="number" step="0.001" min="0.001" class="input" /></div>
            <div><label class="label">Cost per Unit</label><input formControlName="costPerUnit" type="number" step="0.01" min="0" class="input" /></div>
          </div>
          <div><label class="label">Notes</label><textarea formControlName="notes" class="input" rows="2"></textarea></div>
          <div *ngIf="form.valid && form.get('quantity')?.value && form.get('costPerUnit')?.value"
               class="p-3 rounded-lg bg-green-50 text-green-800 text-sm">
            Total: {{ (form.get('quantity')!.value * form.get('costPerUnit')!.value) | currency }}
          </div>
          <div *ngIf="formError()" class="alert-danger">{{ formError() }}</div>
          <div class="flex gap-3">
            <button type="button" (click)="showModal.set(false)" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1 justify-center">
              {{ saving() ? 'Saving...' : 'Record' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class PurchasesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  purchases = signal<Purchase[]>([]); materials = signal<Material[]>([]);
  loading = signal(true); saving = signal(false);
  showModal = signal(false); formError = signal('');

  form = this.fb.nonNullable.group({
    materialId: ['', Validators.required],
    quantity:   [0, [Validators.required, Validators.min(0.001)]],
    costPerUnit:[0, [Validators.required, Validators.min(0)]],
    notes: [''],
  });

  ngOnInit() {
    this.api.getPurchases().subscribe({ next: p => { this.purchases.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.api.getMaterials().subscribe(m => this.materials.set(m));
  }

  openCreate() { this.form.reset({ quantity: 0, costPerUnit: 0 }); this.formError.set(''); this.showModal.set(true); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.api.createPurchase(this.form.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Purchase recorded — stock updated');
        this.showModal.set(false);
        this.api.getPurchases().subscribe(p => this.purchases.set(p));
        this.saving.set(false);
      },
      error: (e) => { this.formError.set(e?.error?.message ?? 'Error'); this.saving.set(false); },
    });
  }
}
