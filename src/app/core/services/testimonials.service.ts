import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface Testimonial {
  id: string;
  image: string;
  rating: number;
  name: string;
  major: string;
  reviewText: string;
  uploadedBy: string;
  createdAt: string;
}

interface ApiResponse<T> {
  message: string;
  testimonial?: T; // For single testimonial responses
  testimonials?: T[]; // For list responses
}

@Injectable({
  providedIn: 'root'
})
export class TestimonialsService {
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  createTestimonial(testimonialData: {
    rating: number;
    name: string;
    major: string;
    reviewText: string;
    image: File;
  }): Observable<Testimonial> {
    const formData = new FormData();
    formData.append('rating', testimonialData.rating.toString());
    formData.append('name', testimonialData.name);
    formData.append('major', testimonialData.major);
    formData.append('reviewText', testimonialData.reviewText);
    formData.append('image', testimonialData.image);

    return this.http.post<ApiResponse<Testimonial>>(
      ApiEndpoints.testimonials.create,
      formData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.testimonial!),
      catchError(error => {
        const errorMsg = error.error?.message || 'خطأ في الخادم';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  getTestimonials(): Observable<Testimonial[]> {
    return this.http.get<ApiResponse<Testimonial>>(
      ApiEndpoints.testimonials.list
    ).pipe(
      map(response => response.testimonials!),
      catchError(error => {
        const errorMsg = error.error?.message || 'خطأ في جلب الشهادات';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  updateTestimonial(id: string, testimonialData: {
    rating: number;
    name: string;
    major: string;
    reviewText: string;
    image?: File;
  }): Observable<Testimonial> {
    const formData = new FormData();
    formData.append('rating', testimonialData.rating.toString());
    formData.append('name', testimonialData.name);
    formData.append('major', testimonialData.major);
    formData.append('reviewText', testimonialData.reviewText);
    if (testimonialData.image) {
      formData.append('image', testimonialData.image);
    }

    return this.http.put<ApiResponse<Testimonial>>(
      ApiEndpoints.testimonials.edit(id),
      formData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => response.testimonial!),
      catchError(error => {
        const errorMsg = error.error?.message || 'خطأ في الخادم';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  deleteTestimonial(id: string): Observable<{ message: string }> {
    return this.http.delete<ApiResponse<null>>(
      ApiEndpoints.testimonials.delete(id),
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => ({ message: response.message })),
      catchError(error => {
        const errorMsg = error.error?.message || 'خطأ في الخادم';
        return throwError(() => new Error(errorMsg));
      })
    );
  }
}
