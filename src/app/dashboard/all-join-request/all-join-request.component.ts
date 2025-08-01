import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { JoinRequestService, JoinRequest } from '../../core/services/join-request.service';
import { Router } from '@angular/router';

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
  joinRequests: JoinRequest[] = [];
  isLoading = false;
  toastMessage: { message: string; type: 'success' | 'error' } | null = null;
  headers: { key: keyof JoinRequest; label: string }[] = [
    { key: 'name', label: 'الاسم' },
    { key: 'email', label: 'البريد الإلكتروني' },
    { key: 'phone', label: 'رقم الهاتف' },
    { key: 'academicSpecialization', label: 'التخصص الجامعي' },
    { key: 'createdAt', label: 'تاريخ التقديم' },
    { key: 'status', label: 'الحالة' }
  ];

  constructor(private joinRequestService: JoinRequestService, private router: Router) {}

  ngOnInit() {
    this.checkAuth();
    this.fetchJoinRequests();
  }

  checkAuth() {
    if (!localStorage.getItem('token')) {
      this.showToast('يرجى تسجيل الدخول للوصول إلى طلبات الانضمام', 'error');
      this.router.navigate(['/login']);
    }
  }

  fetchJoinRequests() {
    this.isLoading = true;
    this.joinRequestService.getAll().subscribe({
      next: (requests: any[]) => {
        this.joinRequests = requests.map(request => ({
          ...request,
          id: request._id || request.id, // Map _id to id for backend compatibility
          createdAt: new Date(request.createdAt).toLocaleDateString('ar-SA') // Format date
        }));
        this.isLoading = false;
        console.log('Fetched join requests:', this.joinRequests);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.status === 401
          ? 'غير مصرح: يرجى تسجيل الدخول مجددًا'
          : error.message || 'فشل في جلب طلبات الانضمام';
        this.showToast(errorMessage, 'error');
        console.error('Error fetching join requests:', error);
      }
    });
  }

  confirmApproveRequest(id: string) {
    if (!id) {
      this.showToast('معرف الطلب غير موجود', 'error');
      console.error('No request ID provided for approval');
      return;
    }
    if (confirm('هل أنت متأكد من الموافقة على هذا الطلب؟ سيتم إرسال بريد إلكتروني إلى مقدم الطلب مع بيانات الدخول.')) {
      this.approveRequest(id);
    }
  }

  approveRequest(id: string) {
    this.isLoading = true;
    console.log('Attempting to approve request with ID:', id);
    this.joinRequestService.approve(id).subscribe({
      next: (response) => {
        console.log('Approve response:', response);
        this.fetchJoinRequests(); // Refresh the list
        this.showToast(`تم الموافقة على الطلب بنجاح وإرسال البريد الإلكتروني إلى: ${response.email}`, 'success');
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.status === 401
          ? 'غير مصرح: يرجى التحقق من رمز التوثيق أو تسجيل الدخول مجددًا'
          : error.message || 'فشل في الموافقة على الطلب';
        this.showToast(errorMessage, 'error');
        console.error('Error approving request:', error);
      }
    });
  }

  confirmRejectRequest(id: string) {
    if (!id) {
      this.showToast('معرف الطلب غير موجود', 'error');
      console.error('No request ID provided for rejection');
      return;
    }
    if (confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
      this.rejectRequest(id);
    }
  }

  rejectRequest(id: string) {
    this.isLoading = true;
    console.log('Attempting to reject request with ID:', id);
    this.joinRequestService.reject(id).subscribe({
      next: (response) => {
        console.log('Reject response:', response);
        this.fetchJoinRequests(); // Refresh the list
        this.showToast('تم رفض الطلب بنجاح', 'success');
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.status === 401
          ? 'غير مصرح: يرجى التحقق من رمز التوثيق أو تسجيل الدخول مجددًا'
          : error.message || 'فشل في رفض الطلب';
        this.showToast(errorMessage, 'error');
        console.error('Error rejecting request:', error);
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

  showToast(message: string, type: 'success' | 'error') {
    console.log('Showing toast:', { message, type });
    this.toastMessage = { message, type };
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000); // Hide toast after 3 seconds
  }
}
