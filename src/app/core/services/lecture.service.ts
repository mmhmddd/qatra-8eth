import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface LectureResponse {
  success: boolean;
  message: string;
  lecture?: { link: string; name: string; subject: string; createdAt: string; _id?: string };
  lectures?: { link: string; name: string; subject: string; createdAt: string; _id: string }[];
  lectureCount?: number;
}

export interface PdfResponse {
  success: boolean;
  message: string;
  pdfs?: { _id: string; title: string; description: string; creatorName: string; subject: string; semester: string; country: string; academicLevel: string; fileName: string; createdAt: string }[];
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

  getLectures(): Observable<LectureResponse> {
    return this.http.get<LectureResponse>(ApiEndpoints.lectures.list).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم جلب المحاضرات بنجاح',
        lectures: response.lectures,
      })),
      catchError(error => {
        console.error('Error fetching lectures:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في جلب المحاضرات',
          error: error.message,
        }));
      })
    );
  }

  getPdfs(): Observable<PdfResponse> {
    return this.http.get<PdfResponse>(ApiEndpoints.pdf.list).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم جلب ملفات PDF بنجاح',
        pdfs: response.pdfs,
      })),
      catchError(error => {
        console.error('Error fetching PDFs:', error);
        return throwError(() => ({
          success: false,
          message: error.error?.message || 'خطأ في جلب ملفات PDF',
          error: error.message,
        }));
      })
    );
  }
}
