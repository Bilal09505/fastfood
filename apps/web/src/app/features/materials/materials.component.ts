// src/app/features/materials/materials.component.ts
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { NgFor, NgIf, NgClass, DecimalPipe, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingComponent } from '../../shared/components/loading-spinner.component';
import type { Material } from '../../core/models';

@Component({
  selector: 'app-materials',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DecimalPipe, CurrencyPipe, ReactiveFormsModule, LoadingComponent],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Inventory / Materials</h1>
        <button *ngIf="auth.isAdmin()" (click)="openCreate()" class="btn-primary">+ Add Material</button>
      </div>

      <!-- Low stock banner -->
      <div *ngIf="lowStock().length" class="alert-warning mb-4 flex items-center gap-2">
        <span>⚠️</span>
        <span><strong>{{ lowStock().length }}</strong> material(s) below minimum stock level</span>
      </div>

      <app-loading *ngIf="loading()" />

      <div *ngIf="!loading()" class="card p-0 overflow-hidden">
        <div class="table-container">
          <table class="table">
            <thead><tr>
              <th>Name</th><th>Unit</th><th>Current Stock</th><th>Min Level</th>
              <th>Cost/Unit</th><th>Status</th>
              <th *ngIf="auth.isAdmin()">Actions</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let m of materials()" [ngClass]="isLow(m) ? 'bg-red-50/50' : ''">
                <td class="font-medium">{{ m.name }}</td>
                <td class="text-gray-500">{{ m.unit }}</td>
                <td [ngClass]="isLow(m) ? 'text-red-700 font-semibold' : ''">
                  {{ m.currentStock | number:'1.0-3' }}
                </td>
                <td class="text-gray-500">{{ m.minStockLevel | number:'1.0-3' }}</td>
                <td>{{ m.costPerUnit | currency }}</td>
                <td>
                  <span [ngClass]="isLow(m)
                    ? 'badge bg-red-100 text-red-700'
                    : 'badge bg-green-100 text-green-700'">
                    {{ isLow(m) ? '⚠️ Low' : '✅ OK' }}
                  </span>
                </td>
                <td *ngIf="auth.isAdmin()">
                  <button (click)="edit(m)" class="btn-ghost text-xs py-1 px-2">Edit</button>
                </td>
              </tr>
              <tr *ngIf="!materials().length">
                <td [attr.colspan]="auth.isAdmin() ? 7 : 6" class="text-center text-gray-400 py-8">
                  No materials found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" (click)="closeModal()"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="font-semibold text-gray-900 text-lg mb-5">
          {{ editingId() ? 'Edit Material' : 'Add Material' }}
        </h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="label">Material Name</label>
              <input formControlName="name" class="input" placeholder="e.g. Burger Buns" />
            </div>
            <div>
              <label class="label">Unit</label>
              <input formControlName="unit" class="input" placeholder="pcs / kg / liters" />
            </div>
            <div>
              <label class="label">Cost per Unit ($)</label>
              <input formControlName="costPerUnit" type="number" step="0.01" min="0" class="input" />
            </div>
            <div>
              <label class="label">Current Stock</label>
              <input formControlName="currentStock" type="number" step="0.001" min="0" class="input" />
            </div>
            <div>
              <label class="label">Min Stock Level</label>
              <input formControlName="minStockLevel" type="number" step="0.001" min="0" class="input" />
            </div>
          </div>
          <div *ngIf="formError()" class="alert-danger">{{ formError() }}</div>
          <div class="flex gap-3">
            <button type="button" (click)="closeModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1 justify-center">
              {{ saving() ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class MaterialsComponent implements OnInit {
  auth  = inject(AuthService);
  private api   = inject(ApiService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  materials = signal<Material[]>([]);
  loading   = signal(true);
  saving    = signal(false);
  showModal = signal(false);
  editingId = signal<string | null>(null);
  formError = signal('');

  lowStock = computed(() => this.materials().filter(m => this.isLow(m)));
  isLow = (m: Material) => Number(m.currentStock) < Number(m.minStockLevel);

  form = this.fb.nonNullable.group({
    name:          ['', Validators.required],
    unit:          ['', Validators.required],
    currentStock:  [0, [Validators.required, Validators.min(0)]],
    minStockLevel: [0, [Validators.required, Validators.min(0)]],
    costPerUnit:   [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() { this.load(); }

  load() {
    this.api.getMaterials().subscribe({
      next: m => { this.materials.set(m); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form.reset({ currentStock: 0, minStockLevel: 0, costPerUnit: 0 });
    this.formError.set('');
    this.showModal.set(true);
  }

  edit(m: Material) {
    this.editingId.set(m.id);
    this.form.patchValue(m);
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const req = this.editingId()
      ? this.api.updateMaterial(this.editingId()!, v)
      : this.api.createMaterial(v);
    req.subscribe({
      next: () => {
        this.toast.success(this.editingId() ? 'Material updated' : 'Material added');
        this.closeModal(); this.load(); this.saving.set(false);
      },
      error: (e) => { this.formError.set(e?.error?.message ?? 'Error'); this.saving.set(false); },
    });
  }
}
