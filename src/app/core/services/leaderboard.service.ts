import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

// Interface for leaderboard user data
export interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  type: 'متطوع' | 'قاده';
  rank: string | null;
  image: string | null;
  volunteerHours: number;
  numberOfStudents: number;
  subjects: string[];
  score: number;
}

// Interface for API responses
interface ApiResponse<T> {
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class LeaderboardService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('لم يتم العثور على توكن. يرجى تسجيل الدخول.');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  addUserToLeaderboard(
    email: string,
    type: 'متطوع' | 'قاده',
    name?: string,
    rank?: string
  ): Observable<LeaderboardUser> {
    if (!email.trim() || !type) {
      return throwError(() => new Error('البريد الإلكتروني والدور مطلوبان'));
    }
    if (type === 'قاده' && (!name?.trim() || !rank)) {
      return throwError(() => new Error('الاسم والرتبة مطلوبة للقادة'));
    }

    const body = { email, type, name, rank };

    return this.http
      .post<ApiResponse<LeaderboardUser>>(
        ApiEndpoints.leaderboard.add,
        body,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map(response => response.data),
        catchError(error => {
          const errorMsg = error.error?.message || 'خطأ في إضافة المستخدم إلى لوحة الصدارة';
          return throwError(() => new Error(errorMsg));
        })
      );
  }

  getLeaderboard(): Observable<LeaderboardUser[]> {
    return this.http
      .get<ApiResponse<LeaderboardUser[]>>(ApiEndpoints.leaderboard.get)
      .pipe(
        map(response => response.data),
        catchError(error => {
          const errorMsg = error.error?.message || 'خطأ في جلب لوحة الصدارة';
          return throwError(() => new Error(errorMsg));
        })
      );
  }

  editUserInLeaderboard(
    email: string,
    name?: string,
    rank?: string,
    volunteerHours?: number,
    numberOfStudents?: number,
    subjects?: string[]
  ): Observable<LeaderboardUser> {
    if (!email.trim()) {
      return throwError(() => new Error('البريد الإلكتروني مطلوب'));
    }
    if (volunteerHours !== undefined && volunteerHours < 0) {
      return throwError(() => new Error('ساعات التطوع يجب أن تكون صفر أو أكثر'));
    }
    if (numberOfStudents !== undefined && numberOfStudents < 0) {
      return throwError(() => new Error('عدد الطلاب يجب أن يكون صفر أو أكثر'));
    }

    const body = { email, name, rank, volunteerHours, numberOfStudents, subjects };

    return this.http
      .put<ApiResponse<LeaderboardUser>>(
        ApiEndpoints.leaderboard.edit,
        body,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map(response => response.data),
        catchError(error => {
          const errorMsg = error.error?.message || 'خطأ في تحديث المستخدم';
          return throwError(() => new Error(errorMsg));
        })
      );
  }

  removeUserFromLeaderboard(email: string): Observable<{ message: string; email: string }> {
    if (!email.trim()) {
      return throwError(() => new Error('البريد الإلكتروني مطلوب'));
    }
    const body = { email };
    return this.http
      .delete<ApiResponse<{ email: string }>>(
        ApiEndpoints.leaderboard.remove,
        { headers: this.getAuthHeaders(), body }
      )
      .pipe(
        map(response => ({ message: response.message, email: response.data.email })),
        catchError(error => {
          const errorMsg = error.error?.message || 'خطأ في حذف المستخدم';
          return throwError(() => new Error(errorMsg));
        })
      );
  }

  getImageUrl(imagePath: string | null): string {
    return imagePath || '/assets/images/leaderboard/placeholder.jpg';
  }
}
