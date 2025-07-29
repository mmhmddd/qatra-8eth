import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface Pdf {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  filePath: string;
  uploadedBy: string;
  createdAt: string;
}

interface ApiResponse<T> {
  message: string;
  pdf?: T;
  pdfs?: T;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  uploadPdf(file: File, title: string, description: string, creatorName: string): Observable<Pdf> {
    const formData = new FormData();
    formData.append('pdfFile', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('creatorName', creatorName);

    return this.http.post<ApiResponse<Pdf>>(ApiEndpoints.pdf.upload, formData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.pdf!),
      catchError(error => {
        console.error('Error uploading PDF:', error);
        return throwError(() => new Error(error.error.message || 'Server error'));
      })
    );
  }

  getPdfs(): Observable<Pdf[]> {
    return this.http.get<ApiResponse<Pdf[]>>(ApiEndpoints.pdf.list, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.pdfs || []),
      catchError(error => {
        console.error('Error fetching PDFs:', error);
        return throwError(() => new Error(error.error.message || 'Server error'));
      })
    );
  }

  deletePdf(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(ApiEndpoints.pdf.delete(id), {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error deleting PDF:', error);
        return throwError(() => new Error(error.error.message || 'Server error'));
      })
    );
  }

  getPdfDetails(id: string): Observable<Pdf> {
    return this.http.get<Pdf>(ApiEndpoints.pdf.view(id), {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching PDF details:', error);
        return throwError(() => new Error(error.error.message || 'Server error'));
      })
    );
  }
}