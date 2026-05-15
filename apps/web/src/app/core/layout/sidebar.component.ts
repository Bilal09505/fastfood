// src/app/core/layout/sidebar.component.ts
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor],
  template: `
    <aside class="fixed inset-y-0 left-0 w-60 bg-sidebar flex flex-col z-30">

      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 h-16 border-b border-white/5">
        <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <span class="text-white font-semibold text-base">FastFood</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <ng-container *ngFor="let item of visibleNav()">
          <a [routerLink]="item.route"
             routerLinkActive="active"
             class="nav-item">
            <span class="text-lg w-5 text-center" [innerHTML]="item.icon"></span>
            <span>{{ item.label }}</span>
          </a>
        </ng-container>
      </nav>

      <!-- User pill -->
      <div class="px-3 py-4 border-t border-white/5">
        <div class="flex items-center gap-3 px-3 py-2">
          <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
            {{ initial() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate">{{ auth.currentUser()?.name }}</p>
            <p class="text-gray-400 text-xs">{{ auth.currentUser()?.role }}</p>
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  auth = inject(AuthService);

  private allNav: NavItem[] = [
    { label: 'Dashboard',  route: '/dashboard',  icon: '&#9732;',  roles: ['ADMIN','SALESMAN','MAKER','SUPPLIER'] },
    { label: 'Workers',    route: '/workers',    icon: '&#128101;', roles: ['ADMIN'] },
    { label: 'Clients',    route: '/clients',    icon: '&#128100;', roles: ['ADMIN','SALESMAN'] },
    { label: 'Menu',       route: '/menu',       icon: '&#127828;', roles: ['ADMIN','SALESMAN','MAKER'] },
    { label: 'Materials',  route: '/materials',  icon: '&#128230;', roles: ['ADMIN','SUPPLIER'] },
    { label: 'Orders',     route: '/orders',     icon: '&#128203;', roles: ['ADMIN','SALESMAN','MAKER'] },
    { label: 'Purchases',  route: '/purchases',  icon: '&#128722;', roles: ['ADMIN','SUPPLIER'] },
    { label: 'Expenses',   route: '/expenses',   icon: '&#128181;', roles: ['ADMIN'] },
    { label: 'Reports',    route: '/reports',    icon: '&#128202;', roles: ['ADMIN'] },
  ];

  visibleNav = signal(this.allNav.filter(n =>
    n.roles.includes(this.auth.currentUser()?.role ?? '')
  ));

  initial() {
    return this.auth.currentUser()?.name?.charAt(0).toUpperCase() ?? '?';
  }
}
