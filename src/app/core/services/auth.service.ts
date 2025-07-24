import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ApiEndpoints } from '../../core/constants/api-endpoints';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(ApiEndpoints.auth.login, credentials).pipe(
      tap({
        next: (response: any) => {
          console.log('استجابة الخادم:', response);
          if (response && isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', response.token || 'logged-in');
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          console.error('خطأ في تسجيل الدخول:', error);
          alert('فشل تسجيل الدخول: ' + (error.error?.message || 'بيانات غير صحيحة'));
        }
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
    }
    this.router.navigate(['/login']);
  }
}