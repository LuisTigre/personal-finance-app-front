import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';

/**
 * Dev-only request/response logger to help debug backend failures.
 * Logs method, URL, params, and response status for /api/transactions.
 */
export const debugHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const isTransactions = req.url.includes('/api/transactions');

  if (!isTransactions) {
    return next(req);
  }

  const started = performance.now();

  // Avoid logging auth headers.
  // eslint-disable-next-line no-console
  console.log('[HTTP] →', {
    method: req.method,
    url: req.urlWithParams,
    body: req.body ?? null,
  });

  return next(req).pipe(
    tap({
      next: (event: any) => {
        // HttpResponse will have status; other events may not.
        if (event?.status != null) {
          const ms = Math.round(performance.now() - started);
          // eslint-disable-next-line no-console
          console.log('[HTTP] ←', { url: req.urlWithParams, status: event.status, ms });
        }
      },
    }),
    catchError((err: HttpErrorResponse) => {
      const ms = Math.round(performance.now() - started);
      // eslint-disable-next-line no-console
      console.error('[HTTP] ✖', {
        url: req.urlWithParams,
        status: err.status,
        ms,
        error: err.error,
      });
      return throwError(() => err);
    })
  );
};
