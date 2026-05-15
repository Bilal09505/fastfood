// src/app/core/layout/shell.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { ToastContainerComponent } from '../../shared/components/toast-container.component';
import { TopbarComponent } from './topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-sidebar />
       <app-topbar />
      <main class="ml-60 pt-16 min-h-screen">
        <div class="p-6">
          <router-outlet />
        </div>
      </main>
      <app-toast-container />
    </div>
  `,
})
export class ShellComponent {}
