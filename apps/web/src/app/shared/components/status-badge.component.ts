// src/app/shared/components/status-badge.component.ts
import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import type { OrderStatus } from '../../core/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="badge" [ngClass]="cssClass">{{ label }}</span>
  `,
})
export class StatusBadgeComponent {
  @Input() status!: OrderStatus;

  get label() {
    const map: Record<OrderStatus, string> = {
      PENDING: 'Pending', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress',
      READY: 'Ready', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
    };
    return map[this.status] ?? this.status;
  }

  get cssClass() {
    const map: Record<OrderStatus, string> = {
      PENDING: 'badge-pending', ASSIGNED: 'badge-assigned',
      IN_PROGRESS: 'badge-in-progress', READY: 'badge-ready',
      COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled',
    };
    return map[this.status] ?? 'badge';
  }
}
