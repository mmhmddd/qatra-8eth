import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface NotificationResponse {
  success: boolean;
  message: string;
  notifications?: { _id: string; userId: { _id: string; email: string }; message: string; type: string; createdAt: string; read: boolean }[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? this.headers.set('Authorization', `Bearer ${token}`) : this.headers;
  }

  getNotifications(): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(ApiEndpoints.profile.get.replace('/profile', '/lectures/notifications'), { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم جلب الإشعارات بنجاح',
        notifications: response.notifications || [],
      })),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في جلب الإشعارات',
          error: error.message,
        }));
      })
    );
  }
}
