import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ShellComponent } from './core/layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'workers',
        loadComponent: () => import('./features/workers/workers.component').then(m => m.WorkersComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/clients.component').then(m => m.ClientsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SALESMAN'] },
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'menu',
        loadComponent: () => import('./features/menu/menu.component').then(m => m.MenuComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SALESMAN', 'MAKER'] },
      },
      {
        path: 'deals',
        loadComponent: () => import('./features/deals/deals.component').then(m => m.DealsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'materials',
        loadComponent: () => import('./features/materials/materials.component').then(m => m.MaterialsComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPPLIER'] },
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SALESMAN', 'MAKER'] },
      },
      {
        path: 'purchases',
        loadComponent: () => import('./features/purchases/purchases.component').then(m => m.PurchasesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'SUPPLIER'] },
      },
      {
        path: 'expenses',
        loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
