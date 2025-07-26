import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface JoinRequestResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  email?: string;
  password?: string;
  member?: JoinRequest;
}

export interface JoinRequest {
  _id: string;
  name: string;
  email: string;
  number: string;
  academicSpecialization: string;
  address: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  volunteerHours?: number;
  createdAt: string;
}

interface CreateJoinRequestResponse {
  message: string;
  id: string;
}

interface ApproveJoinRequestResponse {
  message: string;
  email: string;
  password: string;
}

interface VolunteerHoursResponse {
  message: string;
  member: JoinRequest;
}

interface RejectJoinRequestResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class JoinRequestService {
  constructor(private http: HttpClient) {}

  create(data: { name: string; email: string; number: string; academicSpecialization: string; address: string }): Observable<JoinRequestResponse> {
    return this.http.post<CreateJoinRequestResponse>(ApiEndpoints.joinRequests.create, data).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تسجيل طلب الانضمام بنجاح',
        data: { id: response.id }
      })),
      catchError(error => {
        console.error('Error creating join request:', error);
        return throwError(() => ({
          success: false,
          message: 'خطأ في تسجيل طلب الانضمام',
          error: error.error?.message || error.message
        }));
      })
    );
  }

  getAll(): Observable<JoinRequest[]> {
    return this.http.get<JoinRequest[]>(ApiEndpoints.joinRequests.getAll).pipe(
      catchError(error => {
        console.error('Error fetching join requests:', error);
        return throwError(() => ({
          success: false,
          message: 'خطأ في جلب طلبات الانضمام',
          error: error.error?.message || error.message
        }));
      })
    );
  }

  getApprovedMembers(): Observable<JoinRequest[]> {
    return this.http.get<JoinRequest[]>(ApiEndpoints.joinRequests.getApproved).pipe(
      catchError(error => {
        console.error('Error fetching approved members:', error);
        return throwError(() => ({
          success: false,
          message: 'خطأ في جلب الأعضاء المعتمدين',
          error: error.error?.message || error.message
        }));
      })
    );
  }

  getMember(id: string): Observable<JoinRequest> {
    return this.http.get<JoinRequest>(ApiEndpoints.joinRequests.getMember(id)).pipe(
      catchError(error => {
        console.error('Error fetching member:', error);
        return throwError(() => ({
          success: false,
          message: 'خطأ في جلب بيانات العضو',
          error: error.error?.message || error.message
        }));
      })
    );
  }

  updateVolunteerHours(id: string, volunteerHours: number): Observable<JoinRequestResponse> {
    return this.http.put<VolunteerHoursResponse>(ApiEndpoints.joinRequests.updateVolunteerHours(id), { volunteerHours }).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم تحديث ساعات التطوع بنجاح',
        member: response.member
      })),
      catchError(error => {
        console.error('Error updating volunteer hours:', error);
        return throwError(() => ({
          success: false,
          message: 'خطأ في تحديث ساعات التطوع',
          error: error.error?.message || error.message
        }));
      })
    );
  }

  approve(id: string): Observable<JoinRequestResponse> {
    return this.http.post<ApproveJoinRequestResponse>(ApiEndpoints.joinRequests.approve(id), {}).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم الموافقة على الطلب وإنشاء الحساب',
        email: response.email,
        password: response.password
      })),
      catchError(error => {
        console.error('Error approving join request:', error);
        return throwError(() => ({
          success: false,
          message: 'خطأ في الموافقة على الطلب',
          error: error.error?.message || error.message
        }));
      })
    );
  }

  reject(id: string): Observable<JoinRequestResponse> {
    return this.http.post<RejectJoinRequestResponse>(ApiEndpoints.joinRequests.reject(id), {}).pipe(
      map(response => ({
        success: true,
        message: response.message || 'تم رفض الطلب'
      })),
      catchError(error => {
        console.error('Error rejecting join request:', error);
        return throwError(() => ({
          success: false,
          message: 'خطأ في رفض الطلب',
          error: error.error?.message || error.message
        }));
      })
    );
  }
}