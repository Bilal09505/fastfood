// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        const refresh$ = auth.refreshTokens();
        if (refresh$) {
          return refresh$.pipe(
            switchMap(() => {
              const newToken = auth.getToken();
              const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(retried);
            }),
            catchError(() => { auth.logout(); return throwError(() => err); })
          );
        }
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
