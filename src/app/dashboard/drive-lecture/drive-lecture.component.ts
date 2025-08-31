import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LectureService, LectureResponse } from '../../core/services/lecture.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

@Component({
  selector: 'app-drive-lecture',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './drive-lecture.component.html',
  styleUrls: ['./drive-lecture.component.scss']
})
export class DriveLectureComponent implements OnInit {
  pendingRequests: any[] = [];
  error: string | null = null;
  loading: boolean = false;
  rejectNotes: { [key: string]: string } = {};
  acceptNotes: { [key: string]: string } = {}; // Store admin notes for acceptance
  successMessage: string | null = null;
  showRejectModal: boolean = false;
  showAcceptModal: boolean = false;
  selectedRequestId: string | null = null;
  rejectNote: string = '';
  acceptNote: string = '';
  expandedCards: { [key: string]: boolean } = {};

  constructor(private lectureService: LectureService) {}

  ngOnInit(): void {
    this.fetchPendingRequests();
  }

  fetchPendingRequests(): void {
    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.lectureService.getPendingLectureRequests().subscribe({
      next: (response: LectureResponse) => {
        this.loading = false;
        if (response.success) {
          this.pendingRequests = response.requests || [];
          this.pendingRequests.forEach(request => {
            this.expandedCards[request._id] = false;
          });
        } else {
          this.error = response.message || 'فشل في جلب طلبات المحاضرات المعلقة';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'حدث خطأ أثناء جلب طلبات المحاضرات المعلقة';
      }
    });
  }

  toggleCard(id: string): void {
    if (id) {
      this.expandedCards[id] = !this.expandedCards[id];
    }
  }

  openAcceptModal(id: string): void {
    this.selectedRequestId = id;
    this.acceptNote = this.acceptNotes[id] || '';
    this.showAcceptModal = true;
  }

  closeAcceptModal(): void {
    this.showAcceptModal = false;
    this.selectedRequestId = null;
    this.acceptNote = '';
  }

  acceptRequest(): void {
    if (!this.selectedRequestId) return;

    this.lectureService.acceptLectureRequest(this.selectedRequestId, this.acceptNote).subscribe({
      next: (response: LectureResponse) => {
        if (response.success) {
          this.successMessage = response.message || 'تم قبول طلب المحاضرة بنجاح';
          delete this.acceptNotes[this.selectedRequestId!];
          this.closeAcceptModal();
          this.fetchPendingRequests();
        } else {
          this.error = response.message || 'فشل في قبول طلب المحاضرة';
        }
      },
      error: (err) => {
        this.error = err.message || 'حدث خطأ أثناء قبول طلب المحاضرة';
      }
    });
  }

  openRejectModal(id: string): void {
    this.selectedRequestId = id;
    this.rejectNote = this.rejectNotes[id] || '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedRequestId = null;
    this.rejectNote = '';
  }

  rejectRequest(): void {
    if (!this.selectedRequestId) return;

    this.lectureService.rejectLectureRequest(this.selectedRequestId, this.rejectNote).subscribe({
      next: (response: LectureResponse) => {
        if (response.success) {
          this.successMessage = response.message || 'تم رفض طلب المحاضرة بنجاح';
          delete this.rejectNotes[this.selectedRequestId!];
          this.closeRejectModal();
          this.fetchPendingRequests();
        } else {
          this.error = response.message || 'فشل في رفض طلب المحاضرة';
        }
      },
      error: (err) => {
        this.error = err.message || 'حدث خطأ أثناء رفض طلب المحاضرة';
      }
    });
  }

  dismissAlert(): void {
    this.successMessage = null;
    this.error = null;
  }
}
