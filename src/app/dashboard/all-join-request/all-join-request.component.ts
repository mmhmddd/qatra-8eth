import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { JoinRequestService, JoinRequest, JoinRequestResponse } from '../../core/services/join-request.service';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Pipe({
  name: 'statusTranslate',
  standalone: true
})
export class StatusTranslatePipe implements PipeTransform {
  transform(value: string): string {
    switch (value?.toLowerCase()) {
      case 'approved':
        return 'موافق عليه';
      case 'rejected':
        return 'مرفوض';
      case 'pending':
        return 'معلق';
      default:
        return value || 'غير معروف';
    }
  }
}

@Component({
  selector: 'app-all-join-request',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusTranslatePipe, SidebarComponent],
  templateUrl: './all-join-request.component.html',
  styleUrls: ['./all-join-request.component.scss']
})
export class AllJoinRequestComponent implements OnInit, OnDestroy {
  joinRequests: JoinRequest[] = [];
  filteredRequests: JoinRequest[] = [];
  selectedStatus: string = '';
  isLoading = false;
  processingRequestId: string | null = null;
  toastMessage: { message: string; type: 'success' | 'error' | 'info' } | null = null;
  private destroy$ = new Subject<void>();

  headers: { key: keyof JoinRequest; label: string }[] = [
    { key: 'name', label: 'الاسم' },
    { key: 'email', label: 'البريد الإلكتروني' },
    { key: 'phone', label: 'رقم الهاتف' },
    { key: 'academicSpecialization', label: 'التخصص الجامعي' },
    { key: 'createdAt', label: 'تاريخ التقديم' },
    { key: 'status', label: 'الحالة' }
  ];

  constructor(
    private joinRequestService: JoinRequestService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuth();
    this.fetchJoinRequests();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.showToast('يرجى تسجيل الدخول للوصول إلى طلبات الانضمام', 'error');
      this.router.navigate(['/login']);
    }
  }

  fetchJoinRequests() {
    this.isLoading = true;
    console.log('Fetching join requests...');

    this.joinRequestService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: JoinRequestResponse) => {
          console.log('Received join requests:', response);

          if (response.success && response.members) {
            this.joinRequests = response.members.map(request => ({
              ...request,
              id: request._id || request.id || '',
              createdAt: new Date(request.createdAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }),
              createdAtRaw: new Date(request.createdAt)
            })).sort((a, b) => b.createdAtRaw!.getTime() - a.createdAtRaw!.getTime());

            this.filterRequests();
            console.log('Fetched requests:', this.joinRequests.length);
          } else {
            this.showToast(response.message || 'فشل في جلب طلبات الانضمام', 'error');
          }

          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error fetching join requests:', error);
          this.isLoading = false;

          const errorMessage = error.status === 401
            ? 'غير مصرح: يرجى تسجيل الدخول مجددًا'
            : error.message || 'فشل في جلب طلبات الانضمام';

          this.showToast(errorMessage, 'error');

          if (error.status === 401) {
            localStorage.removeItem('token');
            this.router.navigate(['/login']);
          }
        }
      });
  }

  filterRequests() {
    if (this.selectedStatus) {
      this.filteredRequests = this.joinRequests.filter(request =>
        request.status?.toLowerCase() === this.selectedStatus.toLowerCase()
      );
    } else {
      this.filteredRequests = [...this.joinRequests];
    }
  }

  confirmApproveRequest(id: string | undefined) {
    if (!id) {
      this.showToast('معرف الطلب غير موجود', 'error');
      return;
    }

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id.trim())) {
      this.showToast('معرف الطلب غير صالح', 'error');
      return;
    }

    const request = this.joinRequests.find(r => r.id === id || r._id === id);

    if (!request) {
      this.showToast('الطلب غير موجود', 'error');
      return;
    }

    if (request.status !== 'Pending') {
      this.showToast('هذا الطلب تمت معالجته مسبقًا', 'error');
      return;
    }

    const confirmMessage = `هل أنت متأكد من الموافقة على طلب ${request.name}؟\n\nسيتم:\n• إنشاء حساب للعضو\n• إرسال بريد إلكتروني إلى: ${request.email}\n• تضمين بيانات تسجيل الدخول`;

    if (confirm(confirmMessage)) {
      this.approveRequest(id);
    }
  }

  approveRequest(id: string) {
    // Prevent multiple simultaneous requests
    if (this.processingRequestId) {
      console.log('Already processing a request:', this.processingRequestId);
      return;
    }

    // Validate ID format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id.trim())) {
      this.showToast('معرف الطلب غير صالح', 'error');
      return;
    }

    this.processingRequestId = id;
    this.isLoading = true;

    console.log('=== Starting approval ===');
    console.log('Request ID:', id);
    console.log('Time:', new Date().toISOString());

    // Show progress message
    this.showToast('جاري معالجة الطلب... يرجى الانتظار', 'info');

    this.joinRequestService.approve(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: JoinRequestResponse) => {
          console.log('=== Approval successful ===');
          console.log('Response:', response);

          this.isLoading = false;
          this.processingRequestId = null;

          const successMessage = response.email
            ? `تم الموافقة على الطلب وإرسال البريد الإلكتروني إلى: ${response.email}`
            : 'تم الموافقة على الطلب بنجاح';

          this.showToast(successMessage, 'success');

          // Update local state
          const requestIndex = this.joinRequests.findIndex(r => r.id === id || r._id === id);
          if (requestIndex !== -1) {
            this.joinRequests[requestIndex].status = 'Approved';
            this.filterRequests();
          }

          // Refresh after short delay
          setTimeout(() => {
            this.fetchJoinRequests();
          }, 1000);
        },
        error: (error: any) => {
          console.error('=== Approval failed ===');
          console.error('Error:', error);

          this.isLoading = false;
          this.processingRequestId = null;

          let errorMessage = 'فشل في الموافقة على الطلب';

          if (error.status === 0) {
            errorMessage = 'فشل الاتصال بالخادم. تحقق من الإنترنت';
          } else if (error.name === 'TimeoutError') {
            errorMessage = 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى';
          } else if (error.status === 401) {
            errorMessage = 'انتهت جلستك. يرجى تسجيل الدخول مجددًا';
            localStorage.removeItem('token');
            setTimeout(() => this.router.navigate(['/login']), 2000);
          } else if (error.status === 404) {
            errorMessage = 'الطلب غير موجود أو تم حذفه';
          } else if (error.status === 400) {
            if (error.errorCode === 'ALREADY_PROCESSED') {
              errorMessage = 'تمت معالجة هذا الطلب مسبقًا';
              setTimeout(() => this.fetchJoinRequests(), 500);
            } else if (error.errorCode === 'INVALID_EMAIL') {
              errorMessage = 'البريد الإلكتروني للطلب غير صالح';
            } else {
              errorMessage = error.message || 'بيانات غير صحيحة';
            }
          } else if (error.status === 500) {
            if (error.errorCode === 'SMTP_CONFIG_MISSING') {
              errorMessage = 'خطأ في إعدادات البريد الإلكتروني';
            } else {
              errorMessage = 'خطأ في الخادم. يرجى المحاولة مرة أخرى';
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.showToast(errorMessage, 'error');
        }
      });
  }

  confirmRejectRequest(id: string | undefined) {
    if (!id) {
      this.showToast('معرف الطلب غير موجود', 'error');
      return;
    }

    const request = this.joinRequests.find(r => r.id === id || r._id === id);

    if (!request) {
      this.showToast('الطلب غير موجود', 'error');
      return;
    }

    if (confirm(`هل أنت متأكد من رفض طلب ${request.name}؟`)) {
      this.rejectRequest(id);
    }
  }

  rejectRequest(id: string) {
    if (this.isLoading || this.processingRequestId) {
      return;
    }

    this.processingRequestId = id;
    this.isLoading = true;

    this.joinRequestService.reject(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: JoinRequestResponse) => {
          this.isLoading = false;
          this.processingRequestId = null;
          this.showToast('تم رفض الطلب بنجاح', 'success');
          setTimeout(() => this.fetchJoinRequests(), 500);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.processingRequestId = null;

          const errorMessage = error.status === 401
            ? 'غير مصرح: يرجى تسجيل الدخول مجددًا'
            : error.message || 'فشل في رفض الطلب';

          this.showToast(errorMessage, 'error');

          if (error.status === 401) {
            localStorage.removeItem('token');
            setTimeout(() => this.router.navigate(['/login']), 1500);
          }
        }
      });
  }

  confirmDeleteRequest(id: string | undefined) {
    if (!id) {
      this.showToast('معرف الطلب غير موجود', 'error');
      return;
    }

    const request = this.joinRequests.find(r => r.id === id || r._id === id);

    if (!request) {
      this.showToast('الطلب غير موجود', 'error');
      return;
    }

    if (confirm(`هل أنت متأكد من حذف طلب ${request.name} نهائيًا؟\nلا يمكن التراجع عن هذا الإجراء.`)) {
      this.deleteRequest(id);
    }
  }

  deleteRequest(id: string) {
    if (this.isLoading || this.processingRequestId) {
      return;
    }

    this.processingRequestId = id;
    this.isLoading = true;

    this.joinRequestService.deleteJoinRequest(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: JoinRequestResponse) => {
          this.isLoading = false;
          this.processingRequestId = null;
          this.showToast('تم حذف الطلب بنجاح', 'success');
          setTimeout(() => this.fetchJoinRequests(), 500);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.processingRequestId = null;

          const errorMessage = error.status === 401
            ? 'غير مصرح: يرجى تسجيل الدخول مجددًا'
            : error.message || 'فشل في حذف الطلب';

          this.showToast(errorMessage, 'error');

          if (error.status === 401) {
            localStorage.removeItem('token');
            setTimeout(() => this.router.navigate(['/login']), 1500);
          }
        }
      });
  }

  isRequestProcessing(id: string): boolean {
    return this.processingRequestId === id;
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
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

  showToast(message: string, type: 'success' | 'error' | 'info') {
    console.log('Toast:', { message, type });
    this.toastMessage = { message, type };

    const duration = type === 'info' ? 3000 : 5000;
    setTimeout(() => {
      this.toastMessage = null;
    }, duration);
  }

  exportToExcel(): void {
    if (this.filteredRequests.length === 0) {
      this.showToast('لا توجد بيانات للتصدير', 'error');
      return;
    }

    try {
      const exportData = this.filteredRequests.map(request => ({
        'الاسم': request.name || 'غير متوفر',
        'البريد الإلكتروني': request.email || 'غير متوفر',
        'رقم الهاتف': request.phone || 'غير متوفر',
        'التخصص الجامعي': request.academicSpecialization || 'غير متوفر',
        'تاريخ التقديم': request.createdAt || 'غير متوفر',
        'الحالة': this.translateStatus(request.status || '')
      }));

      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
      const workbook: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'طلبات الانضمام');

      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const fileName = `join_requests_${new Date().toISOString().split('T')[0]}.xlsx`;

      saveAs(data, fileName);
      this.showToast('تم تصدير البيانات بنجاح', 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.showToast('فشل في تصدير البيانات', 'error');
    }
  }

  private translateStatus(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'موافق عليه';
      case 'rejected':
        return 'مرفوض';
      case 'pending':
        return 'معلق';
      default:
        return 'غير معروف';
    }
  }
}
