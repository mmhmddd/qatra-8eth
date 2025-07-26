import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';
import { JoinRequestResponse, JoinRequest } from './join-request.service';

export interface UserProfile {
  email: string;
  profileImage: string | null;
  numberOfStudents: number;
  subjects: string[];
}

export interface ProfileResponse {
  user: UserProfile;
  joinRequest: JoinRequest | null;
}

interface UpdatePasswordResponse {
  message: string;
}

interface UploadImageResponse {
  message: string;
  profileImage: string;
}

interface UpdateProfileResponse {
  message: string;
  numberOfStudents: number;
  subjects: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getProfile(): Observable<JoinRequestResponse> {
    return this.http.get<ProfileResponse>(ApiEndpoints.profile.get, { headers: this.getHeaders() }).pipe(
      map(response => ({
        success: true,
        message: 'تم جلب بيانات الملف الشخصي بنجاح',
        data: response
      })),
      catchError(error => {
        console.error('Error fetching profile:', error);
        return throwError(() => ({
          success: false,
          message: 'خطأ في جلب بيانات الملف الشخصي',
          error: error.error?.message || error.message
        }));
      })
    );
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<JoinRequestResponse> {
    return this.http.put<UpdatePasswordResponse>(ApiEndpoints.profile.updatePassword, { currentPassword, newPassword }, { headers: this.getHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تحديث كلمة المرور بنجاح'
      })),
      catchError(error => {
        console.error('Error updating password:', error);
        return throwError(() => ({
          success: false,
          message: 'خطأ في تحديث كلمة المرور',
          error: error.error?.message || error.message
        }));
      })
    );
  }

  uploadProfileImage(file: File): Observable<JoinRequestResponse> {
    const formData = new FormData();
    formData.append('profileImage', file);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    return this.http.post<UploadImageResponse>(ApiEndpoints.profile.uploadImage, formData, { headers }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم رفع الصورة الشخصية بنجاح',
        data: { profileImage: response.profileImage }
      })),
      catchError(error => {
        console.error('Error uploading profile image:', error);
        return throwError(() => ({
          success: false,
          message: 'خطأ في رفع الصورة الشخصية',
          error: error.error?.message || error.message
        }));
      })
    );
  }

  updateProfile(numberOfStudents: number, subjects: string[]): Observable<JoinRequestResponse> {
    return this.http.put<UpdateProfileResponse>(ApiEndpoints.profile.updateProfile, { numberOfStudents, subjects }, { headers: this.getHeaders() }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تحديث عدد الطلاب والمواد بنجاح',
        data: { numberOfStudents: response.numberOfStudents, subjects: response.subjects }
      })),
      catchError(error => {
        console.error('Error updating profile:', error);
        return throwError(() => ({
          success: false,
          message: 'خطأ في تحديث بيانات الملف الشخصي',
          error: error.error?.message || error.message
        }));
      })
    );
  }
}