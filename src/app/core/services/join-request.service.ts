import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class JoinRequestService {
  constructor(private http: HttpClient) {}

  create(data: { name: string; email: string; number: string; academicSpecialization: string; address: string }): Observable<JoinRequestResponse> {
    return this.http.post<JoinRequestResponse>(ApiEndpoints.joinRequests.create, data);
  }

  getAll(): Observable<any> {
    return this.http.get(ApiEndpoints.joinRequests.getAll);
  }

  approve(id: string): Observable<any> {
    return this.http.post(ApiEndpoints.joinRequests.approve(id), {});
  }

  reject(id: string): Observable<any> { // Adjust type based on actual API response
    return this.http.post(ApiEndpoints.joinRequests.reject(id), {});
  }
}

// Ensure JoinRequestResponse is defined or imported
interface JoinRequestResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}