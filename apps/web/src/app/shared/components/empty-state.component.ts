// src/app/shared/components/empty-state.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 gap-3">
      <div class="text-5xl">{{ icon }}</div>
      <p class="text-base font-medium text-gray-600">{{ title }}</p>
      <p class="text-sm text-gray-400">{{ subtitle }}</p>
    </div>
  `,
})
export class EmptyComponent {
  @Input() icon = '📭';
  @Input() title = 'Nothing here yet';
  @Input() subtitle = '';
}
