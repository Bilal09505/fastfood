// src/app/shared/components/loading-spinner.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 gap-3">
      <div class="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      <p class="text-sm text-gray-400">{{ message }}</p>
    </div>
  `,
})
export class LoadingComponent {
  @Input() message = 'Loading...';
}
