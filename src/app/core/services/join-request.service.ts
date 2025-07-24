import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiEndpoints } from '../constants/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class JoinRequestService {
  constructor(private http: HttpClient) {}

  create(data: { name: string; email: string }) {
    return this.http.post(ApiEndpoints.joinRequests.create, data);
  }

  getAll() {
    return this.http.get(ApiEndpoints.joinRequests.getAll);
  }

  approve(id: string) {
    return this.http.post(ApiEndpoints.joinRequests.approve(id), {});
  }

  reject(id: string) {
    return this.http.post(ApiEndpoints.joinRequests.reject(id), {});
  }
}
