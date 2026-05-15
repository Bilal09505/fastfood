// src/app/core/layout/topbar.component.ts
import { Component, inject, Input } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [NgIf],
  template: `
    <header class="fixed top-0 left-60 right-0 h-16 bg-white border-b border-gray-100 z-20
                   flex items-center justify-between px-6">
      <!-- Page title slot -->
      <div>
        <h1 class="text-base font-semibold text-gray-900">{{ title }}</h1>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-3">
        <!-- Low stock badge (shown for ADMIN/SUPPLIER) -->
        <span *ngIf="showAlerts"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
                     font-medium bg-red-50 text-red-700 border border-red-200">
          <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          Low Stock
        </span>

        <!-- Logout -->
        <button (click)="auth.logout()"
                class="btn-ghost text-gray-500 hover:text-red-600 hover:bg-red-50">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7
                 a2 2 0 012-2h6a2 2 0 012 2v1"/>
          </svg>
          Logout
        </button>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  @Input() title = '';
  @Input() showAlerts = false;
  auth = inject(AuthService);
}
