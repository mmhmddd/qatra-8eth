import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, ProfileResponse, UserProfile } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { JoinRequestResponse } from '../../core/services/join-request.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  // Using Angular 17 signals for better reactivity
  user = signal<UserProfile>({ 
    email: '', 
    profileImage: null, 
    numberOfStudents: 0, 
    subjects: [] 
  });
  
  joinRequest = signal<any>({ 
    name: '', 
    number: '', 
    academicSpecialization: '', 
    address: '', 
    volunteerHours: 0 
  });

  currentPassword = signal<string>('');
  newPassword = signal<string>('');
  profileImage = signal<File | null>(null);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showPasswordModal = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isUploadingImage = signal<boolean>(false);

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.fetchProfile();
    }
  }

  fetchProfile() {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.profileService.getProfile().subscribe({
      next: (response: JoinRequestResponse) => {
        this.isLoading.set(false);
        
        if (response.success) {
          const data = response.data as ProfileResponse;
          this.user.set(data.user || { 
            email: '', 
            profileImage: null, 
            numberOfStudents: 0, 
            subjects: [] 
          });
          this.joinRequest.set(data.joinRequest || { 
            name: '', 
            number: '', 
            academicSpecialization: '', 
            address: '', 
            volunteerHours: 0 
          });
          this.success.set(response.message);
        } else {
          this.error.set(response.error || 'خطأ في جلب بيانات الملف الشخصي');
        }
      },
      error: (err: JoinRequestResponse) => {
        this.isLoading.set(false);
        this.error.set(err.error || 'خطأ في جلب بيانات الملف الشخصي');
        console.error('Profile fetch error:', err);
      }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error.set('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        this.error.set('يجب أن تكون الصورة من نوع JPEG أو PNG');
        return;
      }
      
      this.profileImage.set(file);
      this.uploadProfileImage();
    }
  }

  uploadProfileImage() {
    const image = this.profileImage();
    if (image) {
      this.isUploadingImage.set(true);
      this.error.set(null);
      
      this.profileService.uploadProfileImage(image).subscribe({
        next: (response: JoinRequestResponse) => {
          this.isUploadingImage.set(false);
          
          if (response.success) {
            const updatedUser = { ...this.user(), profileImage: response.data.profileImage };
            this.user.set(updatedUser);
            this.success.set(response.message);
          } else {
            this.error.set(response.error || 'خطأ في رفع الصورة الشخصية');
          }
        },
        error: (err: JoinRequestResponse) => {
          this.isUploadingImage.set(false);
          this.error.set(err.error || 'خطأ في رفع الصورة الشخصية');
        }
      });
    }
  }

  openPasswordModal() {
    this.showPasswordModal.set(true);
    this.currentPassword.set('');
    this.newPassword.set('');
    this.error.set(null);
    this.success.set(null);
  }

  closePasswordModal() {
    this.showPasswordModal.set(false);
  }

  updatePassword() {
    const current = this.currentPassword();
    const newPass = this.newPassword();
    
    if (!current || !newPass) {
      this.error.set('كلمة المرور الحالية والجديدة مطلوبة');
      return;
    }

    if (newPass.length < 6) {
      this.error.set('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    this.profileService.updatePassword(current, newPass).subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success) {
          this.success.set(response.message);
          this.error.set(null);
          this.closePasswordModal();
        } else {
          this.error.set(response.error || 'خطأ في تحديث كلمة المرور');
        }
      },
      error: (err: JoinRequestResponse) => {
        this.error.set(err.error || 'خطأ في تحديث كلمة المرور');
      }
    });
  }

  dismissAlert() {
    this.error.set(null);
    this.success.set(null);
  }
}