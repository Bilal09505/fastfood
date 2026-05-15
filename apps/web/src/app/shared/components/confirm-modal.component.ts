// src/app/shared/components/confirm-modal.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [NgIf],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- backdrop -->
      <div class="absolute inset-0 bg-black/40" (click)="cancel.emit()"></div>
      <!-- dialog -->
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div class="flex items-start gap-4">
          <div class="p-2.5 rounded-xl bg-red-50 text-red-600 text-xl flex-shrink-0">⚠️</div>
          <div>
            <h3 class="font-semibold text-gray-900 text-base">{{ title }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ message }}</p>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button (click)="cancel.emit()" class="btn-secondary">Cancel</button>
          <button (click)="confirm.emit()" class="btn-danger">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmModalComponent {
  @Input() open = false;
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmLabel = 'Confirm';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel  = new EventEmitter<void>();
}
