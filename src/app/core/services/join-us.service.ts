import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../constants/api-endpoints';
import { AuthService } from './auth.service';

export interface Message {
  id: string;
  content: string;
  isVisible: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class JoinUsService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  createMessage(content: string): Observable<any> {
    return this.http.post(ApiEndpoints.messages.create, { content }, { headers: this.getHeaders() });
  }

  getMessages(): Observable<{ messages: Message[] }> {
    return this.http.get<{ messages: Message[] }>(ApiEndpoints.messages.list);
  }

  updateMessage(id: string, data: { content?: string; isVisible?: boolean }): Observable<any> {
    return this.http.put(ApiEndpoints.messages.update(id), data, { headers: this.getHeaders() });
  }

  deleteMessage(id: string): Observable<any> {
    return this.http.delete(ApiEndpoints.messages.delete(id), { headers: this.getHeaders() });
  }
}
