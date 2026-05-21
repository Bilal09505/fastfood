import {
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import type { Category } from '../../core/models';

type ModalMode = 'create' | 'edit' | null;

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Categories</h1>
          <p class="page-subtitle">
            {{ categories().length }} categor{{ categories().length === 1 ? 'y' : 'ies' }}
          </p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Category
        </button>
      </div>

      <!-- Global error -->
      @if (errorMsg()) {
        <div class="error-banner">
          <span>{{ errorMsg() }}</span>
          <button (click)="errorMsg.set(null)">✕</button>
        </div>
      }

      <!-- Skeleton -->
      @if (loading()) {
        <div class="grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="skeleton"></div>
          }
        </div>
      }

      <!-- Empty -->
      @if (!loading() && categories().length === 0) {
        <div class="empty">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.4">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z"/>
            </svg>
          </div>
          <h3>No categories yet</h3>
          <p>Add a category to start organising your menu.</p>
          <button class="btn-primary" (click)="openCreate()">Add Category</button>
        </div>
      }

      <!-- Grid -->
      @if (!loading() && categories().length > 0) {
        <div class="grid">
          @for (cat of categories(); track cat.id) {
            <div class="cat-card" [class.busy]="deletingId() === cat.id">
              <div class="cat-avatar">{{ cat.name.charAt(0).toUpperCase() }}</div>
              <span class="cat-name">{{ cat.name }}</span>
              <div class="cat-actions">
                <button class="icon-btn edit" title="Edit" (click)="openEdit(cat)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  class="icon-btn del"
                  title="Delete"
                  [disabled]="deletingId() === cat.id"
                  (click)="confirmDelete(cat)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }

    </div>

    <!-- Create / Edit Modal -->
    @if (modalMode() !== null) {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">

          <div class="modal-head">
            <h2>{{ modalMode() === 'create' ? 'New Category' : 'Edit Category' }}</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label for="cat-name">Name</label>
              <input
                id="cat-name"
                type="text"
                formControlName="name"
                placeholder="e.g. Burgers"
                autocomplete="off"
                [class.invalid]="form.get('name')?.invalid && form.get('name')?.touched"
              />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <span class="field-err">
                  @if (form.get('name')?.errors?.['required']) { Name is required. }
                  @if (form.get('name')?.errors?.['maxlength']) { Max 100 characters. }
                </span>
              }
            </div>

            @if (submitError()) {
              <p class="submit-err">{{ submitError() }}</p>
            }

            <div class="modal-foot">
              <button type="button" class="btn-ghost" (click)="closeModal()">Cancel</button>
              <button
                type="submit"
                class="btn-primary"
                [disabled]="form.invalid || submitting()"
              >
                {{ submitting() ? 'Saving…' : (modalMode() === 'create' ? 'Create' : 'Save') }}
              </button>
            </div>
          </form>

        </div>
      </div>
    }

    <!-- Delete Confirm Modal -->
    @if (deleteTarget()) {
      <div class="overlay" (click)="deleteTarget.set(null)">
        <div class="modal modal--sm" (click)="$event.stopPropagation()">

          <div class="modal-head">
            <h2>Delete Category</h2>
            <button class="close-btn" (click)="deleteTarget.set(null)">✕</button>
          </div>

          <p class="confirm-msg">
            Delete <strong>{{ deleteTarget()!.name }}</strong>? This cannot be undone.
          </p>

          @if (submitError()) {
            <p class="submit-err" style="margin: 0 1.5rem 1rem;">{{ submitError() }}</p>
          }

          <div class="modal-foot">
            <button class="btn-ghost" (click)="deleteTarget.set(null)">Cancel</button>
            <button
              class="btn-danger"
              [disabled]="submitting()"
              (click)="executeDelete()"
            >
              {{ submitting() ? 'Deleting…' : 'Delete' }}
            </button>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; font-family: 'DM Sans', 'Segoe UI', sans-serif; }

    /* ── Layout ─────────────────────────────── */
    .page-wrapper { padding: 2rem; max-width: 1100px; margin: 0 auto; }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .page-title {
      font-size: 1.75rem; font-weight: 700;
      color: #111827; margin: 0 0 .2rem;
      letter-spacing: -.02em;
    }
    .page-subtitle { font-size: .875rem; color: #6b7280; margin: 0; }

    /* ── Buttons ─────────────────────────────── */
    .btn-primary {
      display: inline-flex; align-items: center; gap: .45rem;
      padding: .6rem 1.2rem;
      background: #f97316; color: #fff;
      border: none; border-radius: 10px;
      font-size: .875rem; font-weight: 600;
      cursor: pointer;
      transition: background .15s, transform .1s;
      white-space: nowrap;
    }
    .btn-primary:hover:not(:disabled) { background: #ea6e0a; }
    .btn-primary:active:not(:disabled) { transform: scale(.97); }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }

    .btn-ghost {
      padding: .6rem 1.1rem;
      background: transparent; color: #374151;
      border: 1.5px solid #d1d5db; border-radius: 10px;
      font-size: .875rem; font-weight: 500;
      cursor: pointer;
      transition: border-color .15s, background .15s;
    }
    .btn-ghost:hover { border-color: #9ca3af; background: #f9fafb; }

    .btn-danger {
      padding: .6rem 1.2rem;
      background: #ef4444; color: #fff;
      border: none; border-radius: 10px;
      font-size: .875rem; font-weight: 600;
      cursor: pointer; transition: background .15s;
    }
    .btn-danger:hover:not(:disabled) { background: #dc2626; }
    .btn-danger:disabled { opacity: .5; cursor: not-allowed; }

    .icon-btn {
      width: 32px; height: 32px;
      border: none; border-radius: 8px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s; flex-shrink: 0;
    }
    .icon-btn.edit { background: #f3f4f6; color: #374151; }
    .icon-btn.edit:hover { background: #e5e7eb; }
    .icon-btn.del  { background: #fef2f2; color: #ef4444; }
    .icon-btn.del:hover  { background: #fee2e2; }
    .icon-btn:disabled { opacity: .35; cursor: not-allowed; }

    /* ── Error banner ─────────────────────────── */
    .error-banner {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: .85rem 1.2rem;
      background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 10px; color: #b91c1c;
      font-size: .875rem; margin-bottom: 1.5rem;
    }
    .error-banner button {
      background: none; border: none;
      cursor: pointer; color: #b91c1c;
      font-size: 1rem; line-height: 1;
    }

    /* ── Skeleton ─────────────────────────────── */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }
    .skeleton {
      height: 72px; border-radius: 14px;
      background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── Empty state ──────────────────────────── */
    .empty { text-align: center; padding: 5rem 2rem; color: #9ca3af; }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 18px;
      background: #f3f4f6;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.25rem; color: #d1d5db;
    }
    .empty h3 { font-size: 1.15rem; font-weight: 600; color: #374151; margin: 0 0 .4rem; }
    .empty p  { font-size: .875rem; margin: 0 0 1.5rem; }

    /* ── Category cards ───────────────────────── */
    .cat-card {
      background: #fff;
      border: 1.5px solid #e5e7eb; border-radius: 14px;
      padding: 1rem 1rem 1rem 1.25rem;
      display: flex; align-items: center; gap: .875rem;
      transition: box-shadow .2s, border-color .2s, opacity .25s;
    }
    .cat-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,.07);
      border-color: #d1d5db;
    }
    .cat-card.busy { opacity: .4; pointer-events: none; }

    .cat-avatar {
      flex-shrink: 0; width: 40px; height: 40px;
      border-radius: 11px;
      background: #fff7ed; color: #f97316;
      font-size: 1.1rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    .cat-name {
      flex: 1;
      font-size: .95rem; font-weight: 600; color: #111827;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .cat-actions { display: flex; gap: .35rem; flex-shrink: 0; }

    /* ── Modal ────────────────────────────────── */
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.45);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
      animation: fadeIn .15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal {
      background: #fff; border-radius: 18px;
      width: 100%; max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,.18);
      animation: slideUp .2s ease;
    }
    .modal--sm { max-width: 360px; }
    @keyframes slideUp {
      from { transform: translateY(14px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    .modal-head {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 1.5rem 1.5rem 0;
    }
    .modal-head h2 { font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0; }
    .close-btn {
      background: #f3f4f6; border: none;
      width: 28px; height: 28px; border-radius: 7px;
      cursor: pointer; font-size: .85rem; color: #6b7280;
      display: flex; align-items: center; justify-content: center;
    }
    .close-btn:hover { background: #e5e7eb; }

    /* ── Form ─────────────────────────────────── */
    form { padding: 1.25rem 1.5rem; }

    .field { display: flex; flex-direction: column; gap: .35rem; margin-bottom: .875rem; }
    .field label { font-size: .82rem; font-weight: 600; color: #374151; }
    .field input {
      padding: .6rem .85rem;
      border: 1.5px solid #d1d5db; border-radius: 10px;
      font-size: .9rem; color: #111827;
      outline: none;
      transition: border-color .15s, box-shadow .15s;
    }
    .field input:focus {
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgba(249,115,22,.12);
    }
    .field input.invalid { border-color: #ef4444; }
    .field-err { font-size: .77rem; color: #ef4444; }

    .submit-err {
      font-size: .82rem; color: #b91c1c;
      background: #fef2f2; border: 1px solid #fecaca;
      padding: .55rem .85rem; border-radius: 8px;
      margin: 0 0 .875rem;
    }

    .modal-foot {
      display: flex; justify-content: flex-end;
      gap: .65rem; padding-top: .4rem;
    }

    .confirm-msg {
      padding: 1.1rem 1.5rem .5rem;
      font-size: .9rem; color: #374151;
      line-height: 1.6; margin: 0;
    }
  `],
})
export class CategoriesComponent implements OnInit {
  private api = inject(ApiService);
  private fb  = inject(FormBuilder);

  categories  = signal<Category[]>([]);
  loading     = signal(true);
  errorMsg    = signal<string | null>(null);

  modalMode   = signal<ModalMode>(null);
  editingId   = signal<string | null>(null);
  submitting  = signal(false);
  submitError = signal<string | null>(null);

  deleteTarget = signal<Category | null>(null);
  deletingId   = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.getCategories().subscribe({
      next:  (data) => { this.categories.set(data); this.loading.set(false); },
      error: ()     => { this.errorMsg.set('Failed to load categories.'); this.loading.set(false); },
    });
  }

  openCreate(): void {
    this.form.reset();
    this.submitError.set(null);
    this.editingId.set(null);
    this.modalMode.set('create');
  }

  openEdit(cat: Category): void {
    this.form.patchValue({ name: cat.name });
    this.submitError.set(null);
    this.editingId.set(cat.id);
    this.modalMode.set('edit');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.editingId.set(null);
    this.form.reset();
    this.submitError.set(null);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const name     = this.form.value.name!.trim();
    const mode     = this.modalMode();
    const request$ = mode === 'create'
      ? this.api.createCategory({ name })
      : this.api.updateCategory(this.editingId()!, { name });

    this.submitting.set(true);
    this.submitError.set(null);

    request$.subscribe({
      next: (saved) => {
        if (mode === 'create') {
          this.categories.update((list) => [...list, saved]);
        } else {
          this.categories.update((list) =>
            list.map((c) => (c.id === saved.id ? saved : c)),
          );
        }
        this.submitting.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.submitError.set(err?.error?.message ?? 'Something went wrong.');
        this.submitting.set(false);
      },
    });
  }

  confirmDelete(cat: Category): void {
    this.submitError.set(null);
    this.deleteTarget.set(cat);
  }

  executeDelete(): void {
    const cat = this.deleteTarget()!;
    this.submitting.set(true);
    this.submitError.set(null);
    this.deletingId.set(cat.id);

    this.api.deleteCategory(cat.id).subscribe({
      next: () => {
        this.categories.update((list) => list.filter((c) => c.id !== cat.id));
        this.submitting.set(false);
        this.deletingId.set(null);
        this.deleteTarget.set(null);
      },
      error: (err) => {
        this.submitError.set(err?.error?.message ?? 'Delete failed.');
        this.submitting.set(false);
        this.deletingId.set(null);
      },
    });
  }
}