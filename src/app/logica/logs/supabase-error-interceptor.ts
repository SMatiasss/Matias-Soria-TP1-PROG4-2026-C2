import { HttpInterceptorFn } from '@angular/common/http';

export const supabaseErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
