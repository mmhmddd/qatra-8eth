import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JoinUsService, Message } from '../../core/services/join-us.service';
import { AuthService } from '../../core/services/auth.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-join-massege',
  standalone: true,
  imports: [SidebarComponent, CommonModule, FormsModule],
  templateUrl: './join-massege.component.html',
  styleUrls: ['./join-massege.component.scss']
})
export class JoinMessageComponent implements OnInit {
  messages: Message[] = [];
  newMessageContent: string = '';
  newMessageContentError: boolean = false;
  isAdmin: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  editMessageId: string | null = null;
  editMessageContent: string = '';
  editMessageContentError: boolean = false;
  deleteMessageId: string | null = null;

  constructor(private joinUsService: JoinUsService, private authService: AuthService) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadMessages();
  }

  loadMessages() {
    this.joinUsService.getMessages().subscribe({
      next: (response) => {
        this.messages = response.messages;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.status === 500 ? 'خطأ في الخادم' : 'حدث خطأ أثناء جلب الرسائل';
        console.error('خطأ في جلب الرسائل:', error);
        this.clearAlertsAfterDelay();
      }
    });
  }

  createMessage() {
    if (!this.newMessageContent.trim()) {
      this.newMessageContentError = true;
      return;
    }
    this.newMessageContentError = false;
    this.joinUsService.createMessage(this.newMessageContent).subscribe({
      next: (response) => {
        this.newMessageContent = '';
        this.successMessage = response.message || 'تم إنشاء الرسالة بنجاح';
        this.loadMessages();
        this.clearAlertsAfterDelay();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.status === 400 ? error.error.message :
          error.status === 401 ? 'غير مصرح لك بإنشاء الرسالة' :
          error.status === 500 ? 'خطأ في الخادم' :
          'حدث خطأ أثناء إنشاء الرسالة';
        console.error('خطأ في إنشاء الرسالة:', error);
        this.clearAlertsAfterDelay();
      }
    });
  }

  openEditModal(message: Message) {
    this.editMessageId = message.id;
    this.editMessageContent = message.content;
    this.editMessageContentError = false;
    this.showEditModal = true;
  }

  saveEditedMessage() {
    if (!this.editMessageContent.trim()) {
      this.editMessageContentError = true;
      return;
    }
    if (this.editMessageId) {
      this.joinUsService.updateMessage(this.editMessageId, { content: this.editMessageContent }).subscribe({
        next: (response) => {
          this.successMessage = response.message || 'تم تعديل الرسالة بنجاح';
          this.closeEditModal();
          this.loadMessages();
          this.clearAlertsAfterDelay();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.status === 400 ? error.error.message :
            error.status === 401 ? 'غير مصرح لك بتعديل الرسالة' :
            error.status === 404 ? 'الرسالة غير موجودة' :
            error.status === 500 ? 'خطأ في الخادم' :
            'حدث خطأ أثناء تعديل الرسالة';
          console.error('خطأ في تعديل الرسالة:', error);
          this.clearAlertsAfterDelay();
        }
      });
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editMessageId = null;
    this.editMessageContent = '';
    this.editMessageContentError = false;
  }

  openDeleteModal(id: string) {
    this.deleteMessageId = id;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deleteMessageId = null;
  }

  deleteMessage(id: string) {
    this.joinUsService.deleteMessage(id).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'تم حذف الرسالة بنجاح';
        this.closeDeleteModal();
        this.loadMessages();
        this.clearAlertsAfterDelay();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.status === 400 ? error.error.message :
          error.status === 401 ? 'غير مصرح لك بحذف الرسالة' :
          error.status === 404 ? 'الرسالة غير موجودة' :
          error.status === 500 ? 'خطأ في الخادم' :
          'حدث خطأ أثناء حذف الرسالة';
        console.error('خطأ في حذف الرسالة:', error);
        this.clearAlertsAfterDelay();
      }
    });
  }

  toggleVisibility(id: string, isVisible: boolean) {
    this.joinUsService.updateMessage(id, { isVisible }).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'تم تغيير حالة الظهور بنجاح';
        this.loadMessages();
        this.clearAlertsAfterDelay();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.status === 400 ? error.error.message :
          error.status === 401 ? 'غير مصرح لك بتغيير حالة الظهور' :
          error.status === 404 ? 'الرسالة غير موجودة' :
          error.status === 500 ? 'خطأ في الخادم' :
          'حدث خطأ أثناء تغيير حالة الظهور';
        console.error('خطأ في تغيير حالة الظهور:', error);
        this.clearAlertsAfterDelay();
      }
    });
  }

  dismissAlert() {
    this.successMessage = null;
    this.errorMessage = null;
  }

  private clearAlertsAfterDelay() {
    setTimeout(() => {
      this.dismissAlert();
    }, 5000);
  }
}
