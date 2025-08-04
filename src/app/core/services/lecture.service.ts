import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface LectureResponse {
  success: boolean;
  message: string;
  lecture?: { link: string; name: string; subject: string; createdAt: string; _id?: string };
  lectureCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LectureService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? this.headers.set('Authorization', `Bearer ${token}`) : this.headers;
  }

  uploadLecture(link: string, name: string, subject: string): Observable<LectureResponse> {
    if (!link || !name || !subject) {
      return throwError(() => ({
        success: false,
        message: 'رابط المحاضرة، الاسم، والمادة مطلوبة',
      }));
    }
    return this.http.post<LectureResponse>(ApiEndpoints.lectures.upload, { link, name, subject }, { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم إضافة المحاضرة بنجاح',
        lecture: response.lecture,
        lectureCount: response.lectureCount,
      })),
      catchError(error => {
        console.error('Error uploading lecture:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في إضافة المحاضرة',
          error: error.message,
        }));
      })
    );
  }

  deleteLecture(lectureId: string): Observable<LectureResponse> {
    if (!lectureId) {
      return throwError(() => ({
        success: false,
        message: 'معرف المحاضرة مطلوب',
      }));
    }
    return this.http.delete<LectureResponse>(ApiEndpoints.lectures.delete(lectureId), { headers: this.getAuthHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم حذف المحاضرة بنجاح',
        lectureCount: response.lectureCount,
      })),
      catchError(error => {
        console.error('Error deleting lecture:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في حذف المحاضرة',
          error: error.message,
        }));
      })
    );
  }
}
