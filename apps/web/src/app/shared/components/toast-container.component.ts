// src/app/shared/components/toast-container.component.ts
import { Component, inject } from '@angular/core';
import { NgFor, NgClass } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgFor, NgClass],
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      <div *ngFor="let t of toast.toasts()"
           (click)="toast.remove(t.id)"
           [ngClass]="{
             'border-green-200 bg-green-50 text-green-800': t.type === 'success',
             'border-red-200 bg-red-50 text-red-800':     t.type === 'error',
             'border-yellow-200 bg-yellow-50 text-yellow-800': t.type === 'warning',
             'border-blue-200 bg-blue-50 text-blue-800':  t.type === 'info'
           }"
           class="flex items-start gap-3 p-4 rounded-xl border shadow-lg cursor-pointer
                  animate-in slide-in-from-right transition-all">
        <span class="text-lg leading-none mt-0.5">
          {{ t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️' }}
        </span>
        <p class="text-sm font-medium flex-1">{{ t.message }}</p>
      </div>
    </div>
  `,
})
export class ToastContainerComponent {
  toast = inject(ToastService);
}
