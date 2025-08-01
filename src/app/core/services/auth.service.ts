import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiEndpoints } from '../../core/constants/api-endpoints';
import { JoinRequestResponse } from './join-request.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.checkTokenExpiration();
    }
  }

  login(credentials: { email: string; password: string }): Observable<JoinRequestResponse> {
    return this.http.post<JoinRequestResponse>(ApiEndpoints.auth.login, credentials).pipe(
      tap({
        next: (response: any) => {
          if (response && response.token && isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', response.token);
            // إعادة توجيه بناءً على الدور
            const payload = JSON.parse(atob(response.token.split('.')[1]));
            if (payload.role === 'admin') {
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/home']);
            }
          }
        },
        error: (error) => {
          console.error('خطأ في تسجيل الدخول:', error);
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

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (!token) return false;
      return !this.isTokenExpired(token);
    }
    return false;
  }

  isAdmin(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (!token || this.isTokenExpired(token)) return false;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role === 'admin';
    }
    return false;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // تحويل الثواني إلى ميلي ثانية
      return Date.now() >= expiry;
    } catch (error) {
      console.error('خطأ في فك تشفير التوكن:', error);
      return true;
    }
  }

  checkTokenExpiration(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token && this.isTokenExpired(token)) {
        localStorage.removeItem('token');
        this.router.navigate(['/']);
      }
    }
  }
}
