// src/app/features/workers/workers.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, SlicePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingComponent } from '../../shared/components/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import type { User } from '../../core/models';

const ROLES = ['SALESMAN', 'MAKER', 'SUPPLIER'] as const;

@Component({
  selector: 'app-workers',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, SlicePipe, ReactiveFormsModule, LoadingComponent, ConfirmModalComponent],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Workers</h1>
        <button (click)="openCreate()" class="btn-primary">+ Add Worker</button>
      </div>

      <app-loading *ngIf="loading()" />

      <!-- Filter tabs -->
      <div *ngIf="!loading()" class="flex gap-2 mb-4 flex-wrap">
        <button *ngFor="let r of allRoleFilters"
                (click)="filterRole.set(r)"
                [ngClass]="filterRole() === r
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
          {{ r }}
        </button>
      </div>

      <!-- Table -->
      <div *ngIf="!loading()" class="card p-0 overflow-hidden">
        <div class="table-container">
          <table class="table">
            <thead><tr>
              <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let w of filtered()">
                <td class="font-medium">{{ w.name }}</td>
                <td class="text-gray-500">{{ w.email }}</td>
                <td>
                  <span class="badge bg-gray-100 text-gray-700">{{ w.role }}</span>
                </td>
                <td>
                  <span [ngClass]="w.isActive ? 'badge bg-green-100 text-green-700' : 'badge bg-red-100 text-red-700'">
                    {{ w.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="text-gray-400 text-xs">{{ w.createdAt | slice:0:10 }}</td>
                <td>
                  <div class="flex gap-2">
                    <button (click)="editWorker(w)" class="btn-ghost text-xs py-1 px-2">Edit</button>
                    <button *ngIf="w.isActive" (click)="confirmDeactivate(w)"
                            class="btn-ghost text-xs py-1 px-2 text-red-600 hover:bg-red-50">
                      Deactivate
                    </button>
                    <button *ngIf="!w.isActive" (click)="activate(w)"
                            class="btn-ghost text-xs py-1 px-2 text-green-600 hover:bg-green-50">
                      Activate
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!filtered().length">
                <td colspan="6" class="text-center text-gray-400 py-8">No workers found</td>
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
          {{ editingId() ? 'Edit Worker' : 'Add Worker' }}
        </h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
          <div>
            <label class="label">Full Name</label>
            <input formControlName="name" class="input" placeholder="John Smith" />
          </div>
          <div>
            <label class="label">Email</label>
            <input formControlName="email" type="email" class="input" placeholder="john@example.com" [attr.disabled]="editingId() ? true : null" />
          </div>
          <div *ngIf="!editingId()">
            <label class="label">Password</label>
            <input formControlName="password" type="password" class="input" placeholder="Min 6 characters" />
          </div>
          <div>
            <label class="label">Role</label>
            <select formControlName="role" class="input">
              <option value="">Select role</option>
              <option *ngFor="let r of ROLES" [value]="r">{{ r }}</option>
            </select>
          </div>
          <div *ngIf="formError()" class="alert-danger">{{ formError() }}</div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="closeModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1 justify-center">
              {{ saving() ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <app-confirm-modal
      [open]="confirmOpen()"
      title="Deactivate Worker"
      message="This worker will lose access to the system."
      confirmLabel="Deactivate"
      (confirm)="doDeactivate()"
      (cancel)="confirmOpen.set(false)"
    />
  `,
})
export class WorkersComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly ROLES = ROLES;
  readonly allRoleFilters = ['ALL', ...ROLES];

  workers   = signal<User[]>([]);
  loading   = signal(true);
  saving    = signal(false);
  showModal = signal(false);
  editingId = signal<string | null>(null);
  confirmOpen = signal(false);
  deactivateTarget = signal<User | null>(null);
  filterRole = signal<string>('ALL');
  formError = signal('');

  form = this.fb.nonNullable.group({
    name:     ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    password: [''],
    role:     ['', Validators.required],
  });

  filtered = () => this.filterRole() === 'ALL'
    ? this.workers()
    : this.workers().filter(w => w.role === this.filterRole());

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getUsers().subscribe({
      next: w => { this.workers.set(w); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form.reset();
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.formError.set('');
    this.showModal.set(true);
  }

  editWorker(w: User) {
    this.editingId.set(w.id);
    this.form.patchValue({ name: w.name, email: w.email, role: w.role });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();

    const req = this.editingId()
      ? this.api.updateUser(this.editingId()!, { name: v.name, role: v.role })
      : this.api.createUser(v);

    req.subscribe({
      next: () => {
        this.toast.success(this.editingId() ? 'Worker updated' : 'Worker created');
        this.closeModal();
        this.load();
        this.saving.set(false);
      },
      error: (e) => {
        this.formError.set(e?.error?.message ?? 'Error saving worker');
        this.saving.set(false);
      },
    });
  }

  confirmDeactivate(w: User) {
    this.deactivateTarget.set(w);
    this.confirmOpen.set(true);
  }

  doDeactivate() {
    const t = this.deactivateTarget();
    if (!t) return;
    this.api.deactivateUser(t.id).subscribe({
      next: () => { this.toast.success('Worker deactivated'); this.confirmOpen.set(false); this.load(); },
      error: () => this.toast.error('Failed to deactivate'),
    });
  }

  activate(w: User) {
    this.api.activateUser(w.id).subscribe({
      next: () => { this.toast.success('Worker activated'); this.load(); },
      error: () => this.toast.error('Failed to activate'),
    });
  }
}
