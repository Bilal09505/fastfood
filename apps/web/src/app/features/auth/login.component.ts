// src/app/features/auth/login.component.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800
                flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <!-- Logo card -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                      bg-white shadow-lg mb-4">
            <span class="text-3xl">🍔</span>
          </div>
          <h1 class="text-2xl font-bold text-white">FastFood Dashboard</h1>
          <p class="text-primary-200 text-sm mt-1">Internal staff portal</p>
        </div>

        <!-- Form card -->
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <div>
              <label class="label">Email address</label>
              <input formControlName="email" type="email" placeholder="you@fastfood.com"
                     class="input" autocomplete="email" />
              <p *ngIf="form.get('email')?.touched && form.get('email')?.invalid"
                 class="form-error">Enter a valid email</p>
            </div>

            <div>
              <label class="label">Password</label>
              <div class="relative">
                <input formControlName="password" [type]="showPw() ? 'text' : 'password'"
                       placeholder="••••••••" class="input pr-10" autocomplete="current-password" />
                <button type="button" (click)="showPw.set(!showPw())"
                        class="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
                  {{ showPw() ? '🙈' : '👁️' }}
                </button>
              </div>
              <p *ngIf="form.get('password')?.touched && form.get('password')?.invalid"
                 class="form-error">Password is required</p>
            </div>

            <!-- Error alert -->
            <div *ngIf="error()" class="alert-danger">{{ error() }}</div>

            <button type="submit" [disabled]="loading()" class="btn-primary w-full justify-center py-2.5">
              <span *ngIf="loading()" class="w-4 h-4 border-2 border-white/30 border-t-white
                                             rounded-full animate-spin"></span>
              {{ loading() ? 'Signing in...' : 'Sign in' }}
            </button>

          </form>

          <p class="text-xs text-gray-400 text-center mt-6">
            Only authorised staff can access this system
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = signal(false);
  error   = signal('');
  showPw  = signal(false);

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Invalid email or password');
        this.loading.set(false);
      },
    });
  }
}
