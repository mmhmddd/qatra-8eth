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
  ) {}

  login(credentials: { email: string; password: string }): Observable<JoinRequestResponse> {
    return this.http.post<JoinRequestResponse>(ApiEndpoints.auth.login, credentials).pipe(
      tap({
        next: (response: any) => {
          console.log('استجابة الخادم:', response);
          if (response && response.token && isPlatformBrowser(this.platformId)) {
            localStorage.setItem('token', response.token);
            this.router.navigate(['/home']);
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
    return isPlatformBrowser(this.platformId) && !!localStorage.getItem('token');
  }
}