import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface LectureResponse {
  success: boolean;
  message: string;
  request?: {
    _id?: string;
    studentEmail: string;
    subject: string;
    link: string;
    name: string;
    lectureDate: string;
    duration: number;
    createdAt?: string;
    status?: string;
    adminNote?: string;
    user?: {
      _id: string;
      name: string;
      email: string;
    };
  };
  requests?: {
    _id?: string;
    studentEmail: string;
    subject: string;
    link: string;
    name: string;
    lectureDate: string;
    duration: number;
    createdAt?: string;
    status?: string;
    adminNote?: string;
    user: {
      _id: string;
      name: string;
      email: string;
    };
  }[];
  lecture?: {
    link: string;
    name: string;
    subject: string;
    studentEmail: string;
    createdAt: string;
    lectureDate: string;
    duration: number;
  };
  lectureCount?: number;
  volunteerHours?: number;
}

export interface LowLectureMembersResponse {
  success: boolean;
  message: string;
  members: {
    id: string | null;
    _id: string;
    name: string;
    email: string;
    lowLectureWeekCount: number;
    underTargetStudents: {
      studentName: string;
      studentEmail: string;
      academicLevel: string;
      underTargetSubjects: {
        name: string;
        minLectures: number;
        deliveredLectures: number;
      }[];
    }[];
    lectures: {
      _id: string;
      studentEmail: string;
      subject: string;
      createdAt: string;
      link: string;
      name: string;
    }[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class LectureService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      throw new Error('No authentication token found');
    }
    return this.headers.set('Authorization', `Bearer ${token}`);
  }

  private isValidUrl(url: string): boolean {
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
    return urlRegex.test(url);
  }

  private isValidDate(date: string): boolean {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  uploadLecture(
    studentEmail: string,
    subject: string,
    link: string,
    name: string,
    lectureDate: string,
    duration: number
  ): Observable<LectureResponse> {
    console.log('Sending lecture request data:', { studentEmail, subject, link, name, lectureDate, duration });
    if (!studentEmail || !subject || !link || !name || !lectureDate || duration == null) {
      return throwError(() => ({
        success: false,
        message: 'All fields (studentEmail, subject, link, name, lectureDate, duration) are required'
      }));
    }
    if (!this.isValidUrl(link)) {
      return throwError(() => ({
        success: false,
        message: 'Lecture link must be a valid URL starting with http:// or https://'
      }));
    }
    if (name.length < 1 || name.length > 100) {
      return throwError(() => ({
        success: false,
        message: 'Lecture name must be between 1 and 100 characters'
      }));
    }
    if (subject.length < 1 || subject.length > 100) {
      return throwError(() => ({
        success: false,
        message: 'Subject name must be between 1 and 100 characters'
      }));
    }
    if (!this.isValidDate(lectureDate)) {
      return throwError(() => ({
        success: false,
        message: 'Invalid lecture date'
      }));
    }
    if (isNaN(duration) || duration <= 0) {
      return throwError(() => ({
        success: false,
        message: 'Duration must be a positive number'
      }));
    }
    return this.http
      .post<LectureResponse>(
        ApiEndpoints.lectures.upload,
        { studentEmail, subject, link, name, lectureDate, duration },
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map(response => {
          console.log('Lecture request upload response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to upload lecture request');
          }
          return {
            success: true,
            message: response.message || 'Lecture request uploaded successfully',
            request: response.request
          };
        }),
        catchError(error => {
          console.error('Upload lecture request error:', error);
          let message = 'Failed to upload lecture request';
          if (error.status === 404) {
            message = 'Student email or user not found';
          } else if (error.status === 400) {
            message = error.error?.message || 'Invalid lecture request data';
          } else if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  getPendingLectureRequests(): Observable<LectureResponse> {
    console.log('Fetching pending lecture requests');
    return this.http
      .get<LectureResponse>(ApiEndpoints.lectures.pending, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Pending lecture requests response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch pending lecture requests');
          }
          return {
            success: true,
            message: response.message || 'Pending lecture requests fetched successfully',
            requests: response.requests || []
          };
        }),
        catchError(error => {
          console.error('Get pending lecture requests error:', error);
          let message = 'Failed to fetch pending lecture requests';
          if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 403) {
            message = 'Admin access required.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  acceptLectureRequest(requestId: string, acceptNote: string): Observable<LectureResponse> {
    console.log('Accepting lecture request:', { requestId });
    if (!requestId) {
      return throwError(() => ({
        success: false,
        message: 'Request ID is required'
      }));
    }
    if (!/^[0-9a-fA-F]{24}$/.test(requestId.trim())) {
      return throwError(() => ({
        success: false,
        message: 'Invalid request ID: Must be a valid MongoDB ObjectId'
      }));
    }
    return this.http
      .post<LectureResponse>(
        ApiEndpoints.lectures.accept(requestId),
        {},
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map(response => {
          console.log('Accept lecture request response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to accept lecture request');
          }
          return {
            success: true,
            message: response.message || 'Lecture request accepted successfully',
            request: response.lecture, // Map backend's 'lecture' to 'request'
            lectureCount: response.lectureCount || 0,
            volunteerHours: response.volunteerHours || 0
          };
        }),
        catchError(error => {
          console.error('Accept lecture request error:', error);
          let message = 'Failed to accept lecture request';
          if (error.status === 404) {
            message = 'Lecture request or user not found';
          } else if (error.status === 400) {
            message = error.error?.message || 'Invalid request ID';
          } else if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 403) {
            message = 'Admin access required.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  rejectLectureRequest(requestId: string, note?: string): Observable<LectureResponse> {
    console.log('Rejecting lecture request:', { requestId, note });
    if (!requestId) {
      return throwError(() => ({
        success: false,
        message: 'Request ID is required'
      }));
    }
    if (!/^[0-9a-fA-F]{24}$/.test(requestId.trim())) {
      return throwError(() => ({
        success: false,
        message: 'Invalid request ID: Must be a valid MongoDB ObjectId'
      }));
    }
    return this.http
      .post<LectureResponse>(
        ApiEndpoints.lectures.reject(requestId),
        { note: note || '' },
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map(response => {
          console.log('Reject lecture request response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to reject lecture request');
          }
          return {
            success: true,
            message: response.message || 'Lecture request rejected successfully'
          };
        }),
        catchError(error => {
          console.error('Reject lecture request error:', error);
          let message = 'Failed to reject lecture request';
          if (error.status === 404) {
            message = 'Lecture request not found';
          } else if (error.status === 400) {
            message = error.error?.message || 'Invalid request ID';
          } else if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 403) {
            message = 'Admin access required.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  deleteLectureRequest(requestId: string): Observable<LectureResponse> {
    console.log('Deleting lecture request:', { requestId });
    if (!requestId) {
      return throwError(() => ({
        success: false,
        message: 'Request ID is required'
      }));
    }
    if (!/^[0-9a-fA-F]{24}$/.test(requestId.trim())) {
      return throwError(() => ({
        success: false,
        message: 'Invalid request ID: Must be a valid MongoDB ObjectId'
      }));
    }
    return this.http
      .delete<LectureResponse>(ApiEndpoints.lectures.deleteRequest(requestId), { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Delete lecture request response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to delete lecture request');
          }
          return {
            success: true,
            message: response.message || 'Lecture request deleted successfully'
          };
        }),
        catchError(error => {
          console.error('Delete lecture request error:', error);
          let message = 'Failed to delete lecture request';
          if (error.status === 404) {
            message = 'Lecture request not found';
          } else if (error.status === 400) {
            message = error.error?.message || 'Invalid request ID';
          } else if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 403) {
            message = 'Admin access required.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  getLowLectureMembers(): Observable<LowLectureMembersResponse> {
    console.log('Fetching low lecture members');
    return this.http
      .get<LowLectureMembersResponse>(ApiEndpoints.lectures.lowLectureMembers, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Low lecture members response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch low lecture members');
          }
          return {
            success: true,
            message: response.message || 'Low lecture members fetched successfully',
            members: response.members || []
          };
        }),
        catchError(error => {
          console.error('Get low lecture members error:', error);
          let message = 'Failed to fetch low lecture members';
          if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 403) {
            message = 'Admin access required.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  getNotifications(): Observable<any> {
    console.log('Fetching notifications');
    return this.http
      .get<any>(ApiEndpoints.lectures.notifications, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Notifications response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to fetch notifications');
          }
          return {
            success: true,
            message: response.message || 'Notifications fetched successfully',
            notifications: response.notifications || []
          };
        }),
        catchError(error => {
          console.error('Get notifications error:', error);
          let message = 'Failed to fetch notifications';
          if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  markNotificationsRead(): Observable<any> {
    console.log('Marking notifications as read');
    return this.http
      .post<any>(ApiEndpoints.lectures.markNotificationsRead, {}, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Mark notifications read response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to mark notifications as read');
          }
          return {
            success: true,
            message: response.message || 'Notifications marked as read',
            notifications: response.notifications || []
          };
        }),
        catchError(error => {
          console.error('Mark notifications read error:', error);
          let message = 'Failed to mark notifications as read';
          if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }

  deleteNotification(notificationId: string): Observable<any> {
    console.log('Deleting notification:', { notificationId });
    if (!notificationId) {
      return throwError(() => ({
        success: false,
        message: 'Notification ID is required'
      }));
    }
    if (!/^[0-9a-fA-F]{24}$/.test(notificationId.trim())) {
      return throwError(() => ({
        success: false,
        message: 'Invalid notification ID: Must be a valid MongoDB ObjectId'
      }));
    }
    return this.http
      .delete<any>(ApiEndpoints.lectures.deleteNotification(notificationId), { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Delete notification response:', response);
          if (!response.success) {
            throw new Error(response.message || 'Failed to delete notification');
          }
          return {
            success: true,
            message: response.message || 'Notification deleted successfully'
          };
        }),
        catchError(error => {
          console.error('Delete notification error:', error);
          let message = 'Failed to delete notification';
          if (error.status === 404) {
            message = 'Notification not found';
          } else if (error.status === 401) {
            message = 'Unauthorized. Please log in again.';
          } else if (error.status === 0) {
            message = 'Network error. Please check your connection.';
          }
          return throwError(() => ({
            success: false,
            message,
            error: error.statusText || error.message
          }));
        })
      );
  }
}
