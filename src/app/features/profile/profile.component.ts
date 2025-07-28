import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { Router } from '@angular/router';
import { JoinRequestService, JoinRequestResponse } from '../../core/services/join-request.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profile: JoinRequestResponse['data'] | null = null;
  error: string | null = null;
  currentPassword: string = '';
  newPassword: string = '';
  showPasswordModal: boolean = false;
  meeting: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  } = {
    title: '',
    date: '',
    startTime: '',
    endTime: ''
  };
  showMeetingModal: boolean = false;
  selectedFile: File | null = null;
  isUploading: boolean = false;
  showUploadField: boolean = true;
  backendUrl: string = 'http://localhost:5000'; // Backend base URL

  constructor(
    private profileService: ProfileService,
    private joinRequestService: JoinRequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (response) => {
        console.log('Profile response:', response);
        if (response.success && response.data) {
          this.profile = response.data;
          // Prepend backend URL to profileImage if it exists
          if (this.profile.profileImage) {
            this.profile.profileImage = `${this.backendUrl}${this.profile.profileImage}`;
          }
          this.showUploadField = !this.profile.profileImage; // Hide upload field if image exists
        } else {
          this.error = response.message || 'فشل في جلب بيانات الملف الشخصي';
        }
      },
      error: (err) => {
        this.error = err.message || 'حدث خطأ أثناء جلب بيانات الملف الشخصي';
        console.error('Profile loading error:', err);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadProfileImage();
    }
  }

  uploadProfileImage(): void {
    if (!this.selectedFile) {
      this.error = 'يرجى اختيار صورة أولاً';
      alert(this.error);
      return;
    }
    this.isUploading = true;
    this.profileService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response) => {
        console.log('Upload image response:', response);
        if (response.success && response.data && this.profile) {
          this.profile.profileImage = `${this.backendUrl}${response.data.profileImage}`;
          this.showUploadField = false; // Hide upload field after successful upload
          this.selectedFile = null; // Clear selected file
          this.error = null;
          alert(response.message);
          // Reset the file input field
          const fileInput = document.getElementById('profileImageInput') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
          }
        }
      },
      error: (err) => {
        this.isUploading = false;
        this.error = err.message || 'فشل في رفع الصورة';
        console.error('Upload image error:', err);
        alert(this.error);
      },
      complete: () => {
        this.isUploading = false;
      }
    });
  }

  changeImage(): void {
    this.showUploadField = true; // Show upload field to allow changing the image
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.currentPassword = '';
    this.newPassword = '';
  }

  changePassword(): void {
    if (this.currentPassword && this.newPassword) {
      this.profileService.updatePassword(this.currentPassword, this.newPassword).subscribe({
        next: (response) => {
          alert(response.message);
          this.closePasswordModal();
        },
        error: (err) => {
          this.error = err.message || 'فشل في تغيير كلمة المرور';
          alert(this.error);
        }
      });
    } else {
      alert('يرجى إدخال كلمة المرور الحالية والجديدة');
    }
  }

  openMeetingModal(): void {
    this.showMeetingModal = true;
  }

  closeMeetingModal(): void {
    this.showMeetingModal = false;
    this.meeting = { title: '', date: '', startTime: '', endTime: '' };
  }

  addMeeting(): void {
    if (this.meeting.title && this.meeting.date && this.meeting.startTime && this.meeting.endTime) {
      this.profileService.addMeeting(
        this.meeting.title,
        this.meeting.date,
        this.meeting.startTime,
        this.meeting.endTime
      ).subscribe({
        next: (response) => {
          if (response.success && response.data && this.profile) {
            this.profile.meetings = response.data.meetings;
            alert(response.message);
            this.closeMeetingModal();
          }
        },
        error: (err) => {
          this.error = err.message || 'فشل في إضافة الموعد';
          alert(this.error);
        }
      });
    } else {
      alert('يرجى إدخال جميع تفاصيل الموعد');
    }
  }

  deleteMeeting(meetingId: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
      this.profileService.deleteMeeting(meetingId).subscribe({
        next: (response) => {
          if (response.success && response.data && this.profile) {
            this.profile.meetings = response.data.meetings;
            alert(response.message);
          }
        },
        error: (err) => {
          this.error = err.message || 'فشل في حذف الموعد';
          alert(this.error);
        }
      });
    }
  }
}