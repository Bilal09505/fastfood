// src/app/features/expenses/expenses.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingComponent } from '../../shared/components/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import type { Expense, ExpenseCategory } from '../../core/models';

const CATEGORIES: ExpenseCategory[] = ['RENT','UTILITIES','SALARIES','MAINTENANCE','SUPPLIES','OTHER'];

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, DatePipe, FormsModule, ReactiveFormsModule, LoadingComponent, ConfirmModalComponent],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Expenses</h1>
        <button (click)="openCreate()" class="btn-primary">+ Add Expense</button>
      </div>

      <!-- Month filter -->
      <div class="flex gap-3 mb-4">
        <input type="month" [(ngModel)]="selectedMonth" (change)="load()"
               class="input w-44" [ngModel]="selectedMonth" />
        <span *ngIf="total() > 0" class="flex items-center text-sm font-medium text-gray-600">
          Total: <strong class="ml-1 text-red-600">{{ total() | currency }}</strong>
        </span>
      </div>

      <app-loading *ngIf="loading()" />

      <div *ngIf="!loading()" class="card p-0 overflow-hidden">
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Category</th><th>Description</th><th>Amount</th><th>Date</th><th>Recorded By</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let e of expenses()">
                <td><span class="badge bg-gray-100 text-gray-700">{{ e.category }}</span></td>
                <td>{{ e.description }}</td>
                <td class="font-semibold text-red-600">{{ e.amount | currency }}</td>
                <td class="text-xs text-gray-400">{{ e.date | date:'MMM d, y' }}</td>
                <td class="text-gray-500">{{ e.recordedBy?.name }}</td>
                <td>
                  <div class="flex gap-2">
                    <button (click)="edit(e)" class="btn-ghost text-xs py-1 px-2">Edit</button>
                    <button (click)="confirmDel(e)" class="btn-ghost text-xs py-1 px-2 text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!expenses().length">
                <td colspan="6" class="text-center text-gray-400 py-8">No expenses this month</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" (click)="closeModal()"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="font-semibold text-gray-900 text-lg mb-5">{{ editingId() ? 'Edit Expense' : 'Add Expense' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
          <div>
            <label class="label">Category *</label>
            <select formControlName="category" class="input">
              <option value="">Select</option>
              <option *ngFor="let c of CATEGORIES" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div><label class="label">Description *</label><input formControlName="description" class="input" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="label">Amount ($)</label><input formControlName="amount" type="number" step="0.01" min="0.01" class="input" /></div>
            <div><label class="label">Date *</label><input formControlName="date" type="date" class="input" /></div>
          </div>
          <div *ngIf="formError()" class="alert-danger">{{ formError() }}</div>
          <div class="flex gap-3">
            <button type="button" (click)="closeModal()" class="btn-secondary flex-1">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn-primary flex-1 justify-center">{{ saving() ? 'Saving...' : 'Save' }}</button>
          </div>
        </form>
      </div>
    </div>
    <app-confirm-modal [open]="confirmOpen()" title="Delete Expense" message="This cannot be undone."
      confirmLabel="Delete" (confirm)="doDelete()" (cancel)="confirmOpen.set(false)" />
  `,
})
export class ExpensesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly CATEGORIES = CATEGORIES;
  expenses = signal<Expense[]>([]); loading = signal(true); saving = signal(false);
  showModal = signal(false); editingId = signal<string|null>(null);
  confirmOpen = signal(false); deleteTarget = signal<Expense|null>(null);
  formError = signal('');
  selectedMonth = new Date().toISOString().slice(0,7);

  total = () => this.expenses().reduce((s, e) => s + Number(e.amount), 0);

  form = this.fb.nonNullable.group({
    category: ['', Validators.required],
    description: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: ['', Validators.required],
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getExpenses(this.selectedMonth).subscribe({
      next: e => { this.expenses.set(e); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form.reset({ date: new Date().toISOString().slice(0,10), amount: 0 });
    this.formError.set(''); this.showModal.set(true);
  }
  edit(e: Expense) {
    this.editingId.set(e.id);
    this.form.patchValue({ ...e, date: e.date.slice(0,10), amount: Number(e.amount) });
    this.formError.set(''); this.showModal.set(true);
  }
  closeModal() { this.showModal.set(false); }
  confirmDel(e: Expense) { this.deleteTarget.set(e); this.confirmOpen.set(true); }
  doDelete() {
    const t = this.deleteTarget(); if (!t) return;
    this.api.deleteExpense(t.id).subscribe({ next: () => { this.toast.success('Deleted'); this.confirmOpen.set(false); this.load(); }, error: () => this.toast.error('Failed') });
  }
  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue() as any;
    const req = this.editingId() ? this.api.updateExpense(this.editingId()!, v) : this.api.createExpense(v);
    req.subscribe({ next: () => { this.toast.success('Saved'); this.closeModal(); this.load(); this.saving.set(false); }, error: (e: any) => { this.formError.set(e?.error?.message ?? 'Error'); this.saving.set(false); } });
  }
}
