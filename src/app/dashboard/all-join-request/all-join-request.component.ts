import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { JoinRequestService } from '../../core/services/join-request.service';

@Pipe({
  name: 'statusTranslate',
  standalone: true
})
export class StatusTranslatePipe implements PipeTransform {
  transform(value: string): string {
    switch (value.toLowerCase()) {
      case 'approved':
        return 'موافق عليه';
      case 'rejected':
        return 'مرفوض';
      case 'pending':
        return 'معلق';
      default:
        return value;
    }
  }
}

@Component({
  selector: 'app-all-join-request',
  standalone: true,
  imports: [CommonModule, StatusTranslatePipe, SidebarComponent],
  templateUrl: './all-join-request.component.html',
  styleUrls: ['./all-join-request.component.scss']
})
export class AllJoinRequestComponent implements OnInit {
  joinRequests: any[] = [];
  isLoading = false;
  headers = [
    { key: 'name', label: 'الاسم' },
    { key: 'email', label: 'البريد الإلكتروني' },
    { key: 'phone', label: 'رقم الهاتف' },
    { key: 'dateSubmitted', label: 'تاريخ التقديم' },
    { key: 'status', label: 'الحالة' }
  ];

  constructor(private joinRequestService: JoinRequestService) {}

  ngOnInit() {
    this.fetchJoinRequests();
  }

  fetchJoinRequests() {
    this.isLoading = true;
    this.joinRequestService.getAll().subscribe({
      next: (requests: any) => {
        this.joinRequests = requests;
        this.isLoading = false;
        console.log('Fetched join requests:', requests); // Debugging
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching join requests:', error); // Detailed error logging
        alert(`حدث خطأ أثناء جلب الطلبات: ${error.status ? error.status + ' - ' + error.message : 'غير معروف'}`);
      }
    });
  }

  confirmApproveRequest(id: string) {
    if (confirm('هل أنت متأكد من الموافقة على هذا الطلب؟')) {
      this.approveRequest(id);
    }
  }

  approveRequest(id: string) {
    this.isLoading = true;
    this.joinRequestService.approve(id).subscribe({
      next: () => {
        this.fetchJoinRequests();
        alert('تم الموافقة على الطلب بنجاح');
      },
      error: (error) => {
        this.isLoading = false;
        console.error(`Error approving request ${id}:`, error); // Detailed error logging
        alert(`حدث خطأ أثناء الموافقة على الطلب: ${error.status ? error.status + ' - ' + error.message : 'غير معروف'}`);
      }
    });
  }

  confirmRejectRequest(id: string) {
    if (confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
      this.rejectRequest(id);
    }
  }

  rejectRequest(id: string) {
    this.isLoading = true;
    this.joinRequestService.reject(id).subscribe({
      next: () => {
        this.fetchJoinRequests();
        alert('تم رفض الطلب بنجاح');
      },
      error: (error) => {
        this.isLoading = false;
        console.error(`Error rejecting request ${id}:`, error); // Detailed error logging
        alert(`حدث خطأ أثناء رفض الطلب: ${error.status ? error.status + ' - ' + error.message : 'غير معروف'}`);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  }
}