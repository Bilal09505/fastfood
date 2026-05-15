// src/app/core/services/toast.service.ts
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private next = 0;

  private add(type: Toast['type'], message: string) {
    const id = ++this.next;
    this.toasts.update(t => [...t, { id, type, message }]);
    setTimeout(() => this.remove(id), 3500);
  }

  success(msg: string) { this.add('success', msg); }
  error(msg: string)   { this.add('error', msg); }
  warning(msg: string) { this.add('warning', msg); }
  info(msg: string)    { this.add('info', msg); }

  remove(id: number) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
