// src/app/features/clients/clients.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingComponent } from '../../shared/components/loading-spinner.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import type { Client } from '../../core/models';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, ReactiveFormsModule, LoadingComponent, ConfirmModalComponent],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Clients</h1>
        <button (click)="openCreate()" class="btn-primary">+ Add Client</button>
      </div>
      <app-loading *ngIf="loading()" />
      <div *ngIf="!loading()" class="card p-0 overflow-hidden">
        <div class="table-container">
          <table class="table">
            <thead><tr><th>Name</th><th>Phone</th><th>Address</th><th>Salesman</th><th>Added</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngFor="let c of clients()">
                <td class="font-medium">{{ c.name }}</td>
                <td class="text-gray-500">{{ c.phone ?? '—' }}</td>
                <td class="text-gray-500">{{ c.address ?? '—' }}</td>
                <td class="text-gray-500">{{ c.salesman?.name ?? '—' }}</td>
                <td class="text-xs text-gray-400">{{ c.createdAt | date:'MMM d, y' }}</td>
                <td>
                  <div class="flex gap-2">
                    <button (click)="edit(c)" class="btn-ghost text-xs py-1 px-2">Edit</button>
                    <button (click)="confirmDelete(c)" class="btn-ghost text-xs py-1 px-2 text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!clients().length">
                <td colspan="6" class="text-center text-gray-400 py-8">No clients yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" (click)="closeModal()"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="font-semibold text-gray-900 text-lg mb-5">{{ editingId() ? 'Edit Client' : 'Add Client' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
          <div><label class="label">Name *</label><input formControlName="name" class="input" /></div>
          <div><label class="label">Phone</label><input formControlName="phone" class="input" /></div>
          <div><label class="label">Address</label><input formControlName="address" class="input" /></div>
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

    <app-confirm-modal [open]="confirmOpen()" title="Delete Client" message="Are you sure?"
      confirmLabel="Delete" (confirm)="doDelete()" (cancel)="confirmOpen.set(false)" />
  `,
})
export class ClientsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  clients = signal<Client[]>([]); loading = signal(true); saving = signal(false);
  showModal = signal(false); editingId = signal<string|null>(null);
  confirmOpen = signal(false); deleteTarget = signal<Client|null>(null);
  formError = signal('');

  form = this.fb.nonNullable.group({
    name: ['', Validators.required], phone: [''], address: [''],
  });

  ngOnInit() { this.load(); }
  load() { this.api.getClients().subscribe({ next: c => { this.clients.set(c); this.loading.set(false); }, error: () => this.loading.set(false) }); }
  openCreate() { this.editingId.set(null); this.form.reset(); this.formError.set(''); this.showModal.set(true); }
  edit(c: Client) { this.editingId.set(c.id); this.form.patchValue(c); this.formError.set(''); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }
  confirmDelete(c: Client) { this.deleteTarget.set(c); this.confirmOpen.set(true); }
  doDelete() {
    const t = this.deleteTarget(); if (!t) return;
    this.api.deleteClient(t.id).subscribe({ next: () => { this.toast.success('Client deleted'); this.confirmOpen.set(false); this.load(); }, error: () => this.toast.error('Failed') });
  }
  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const req = this.editingId() ? this.api.updateClient(this.editingId()!, v) : this.api.createClient(v);
    req.subscribe({ next: () => { this.toast.success('Saved'); this.closeModal(); this.load(); this.saving.set(false); }, error: (e) => { this.formError.set(e?.error?.message ?? 'Error'); this.saving.set(false); } });
  }
}
