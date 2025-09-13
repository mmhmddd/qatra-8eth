import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

// Define Pdf interface to match backend schema
export interface Pdf {
  [x: string]: any;
  id: string;
  title: string;
  description: string;
  creatorName: string;
  subject: string;
  semester: string;
  country: string;
  academicLevel: string;
  fileName: string;
  uploadedBy: string;
  createdAt: string;
}

interface UploadResponse {
  message: string;
  pdf: Pdf;
}

interface ListResponse {
  message: string;
  pdfs: Pdf[];
}

interface DeleteResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`
    });
  }

  uploadPdf(file: File, title: string, description: string, creatorName: string, subject: string, semester: string, country: string, academicLevel: string): Observable<Pdf> {
    if (file.size > this.MAX_FILE_SIZE) {
      return throwError(() => new Error('حجم الملف يتجاوز الحد الأقصى (5 ميجابايت)'));
    }

    if (file.type !== 'application/pdf') {
      return throwError(() => new Error('الملفات المسموح بها هي: PDF فقط'));
    }

    const formData = new FormData();
    formData.append('pdfFile', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('creatorName', creatorName);
    formData.append('subject', subject);
    formData.append('semester', semester);
    formData.append('country', country);
    formData.append('academicLevel', academicLevel);

    return this.http.post<UploadResponse>(ApiEndpoints.pdf.upload, formData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.pdf),
      catchError(error => this.handleError(error))
    );
  }

  getPdfs(): Observable<Pdf[]> {
    return this.http.get<ListResponse>(ApiEndpoints.pdf.list, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.pdfs),
      catchError(error => this.handleError(error))
    );
  }

  deletePdf(id: string): Observable<{ message: string }> {
    return this.http.delete<DeleteResponse>(ApiEndpoints.pdf.delete(id), {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Fetch binary PDF data for viewing (public access, no authentication required)
   * @param id The ID of the PDF
   * @returns Observable containing a Blob for the PDF
   */
  getPdfDetails(id: string): Observable<Blob> {
    return this.http.get(ApiEndpoints.pdf.view(id), {
      responseType: 'blob' // No Authorization header for public access
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'خطأ في الخادم';
    if (error.status === 400) {
      errorMessage = error.error.message || 'طلب غير صالح';
    } else if (error.status === 401) {
      errorMessage = error.error.message || 'الوصول مرفوض، يرجى تسجيل الدخول';
    } else if (error.status === 404) {
      errorMessage = error.error.message || 'الملف غير موجود';
    } else if (error.status === 500) {
      errorMessage = error.error.message || 'خطأ داخلي في الخادم';
    }
    console.error(`Error ${error.status}:`, error);
    return throwError(() => new Error(errorMessage));
  }
}
