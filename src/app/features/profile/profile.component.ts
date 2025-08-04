import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { Router } from '@angular/router';
import { JoinRequestService, JoinRequestResponse } from '../../core/services/join-request.service';
import { LectureService, LectureResponse } from '../../core/services/lecture.service';
import { NotificationService, NotificationResponse } from '../../core/services/Notification.service'

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profile: JoinRequestResponse['data'] | null = null;
  error: string | null = null;
  successMessage: string | null = null;
  lectureForm: FormGroup;
  isUploadingLecture: boolean = false;
  showLectureWarning: boolean = false;
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
  backendUrl: string = 'http://localhost:5000';
  activeSection: string = 'profile';

  constructor(
    private profileService: ProfileService,
    private joinRequestService: JoinRequestService,
    private lectureService: LectureService,
    private notificationService: NotificationService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.lectureForm = this.fb.group({
      link: ['', [Validators.required, Validators.pattern('https?://.+')]],
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      subject: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (response) => {
        console.log('Profile response:', response);
        if (response.success && response.data) {
          this.profile = response.data;
          if (this.profile.profileImage) {
            this.profile.profileImage = `${this.backendUrl}${this.profile.profileImage}`;
          }
          this.showUploadField = !this.profile.profileImage;
          console.log('Students:', this.profile.students);
          console.log('Number of Students:', this.profile.numberOfStudents);
          if (this.profile.numberOfStudents > 0 && this.profile.students.length === 0) {
            this.error = 'يوجد تناقض في بيانات الطلاب. يرجى التواصل مع الإدارة.';
            console.warn(this.error);
          }
          this.checkLectureCount();
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
          this.showUploadField = false;
          this.selectedFile = null;
          this.error = null;
          alert(response.message);
          const fileInput = document.getElementById('profileImageInput') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      },
      error: (err) => {
        this.isUploading = false;
        this.error = err.message || 'فشل في رفع الصورة';
        alert(this.error);
        console.error('Upload image error:', err);
      },
      complete: () => {
        this.isUploading = false;
      }
    });
  }

  changeImage(): void {
    this.showUploadField = true;
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
            alert(response.message || 'تم إضافة الموعد بنجاح');
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
            alert(response.message || 'تم حذف الموعد بنجاح');
          }
        },
        error: (err) => {
          this.error = err.message || 'فشل في حذف الموعد';
          alert(this.error);
        }
      });
    }
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  isValidLink(): boolean {
    const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
    return urlPattern.test(this.lectureForm.get('link')?.value || '');
  }

  checkLectureCount(): void {
    if (this.profile && this.profile.lectures) {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const monthlyLectures = this.profile.lectures.filter((lecture: { createdAt: string | number | Date }) => new Date(lecture.createdAt) >= startOfMonth).length;
      this.showLectureWarning = monthlyLectures < 2;
    }
  }

  uploadLecture(): void {
    if (this.lectureForm.invalid) {
      this.error = 'يرجى ملء جميع الحقول بشكل صحيح';
      this.lectureForm.markAllAsTouched();
      return;
    }

    this.isUploadingLecture = true;
    const { link, name, subject } = this.lectureForm.value;

    this.lectureService.uploadLecture(link, name, subject).subscribe({
      next: (response: LectureResponse) => {
        if (response.success && this.profile) {
          this.profile.lectures.push({
            _id: response.lecture?._id || '',
            link: response.lecture?.link || '',
            name: response.lecture?.name || '',
            subject: response.lecture?.subject || '',
            createdAt: response.lecture?.createdAt || new Date().toISOString()
          });
          this.profile.lectureCount = (this.profile.lectureCount || 0) + 1;
          this.successMessage = response.message || 'تم رفع المحاضرة بنجاح';
          this.error = null;
          this.lectureForm.reset();
          this.checkLectureCount();
          this.notificationService.getNotifications().subscribe({
            next: () => alert('تم إرسال إشعار إلى الإدارة'),
            error: (err) => console.error('Notification error:', err)
          });
        }
      },
      error: (err) => {
        this.error = err.message || 'فشل في رفع المحاضرة';
        alert(this.error);
        console.error('Upload lecture error:', err);
      },
      complete: () => {
        this.isUploadingLecture = false;
      }
    });
  }
}
