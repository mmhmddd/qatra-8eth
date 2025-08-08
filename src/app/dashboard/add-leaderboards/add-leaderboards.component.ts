import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaderboardService, LeaderboardUser } from '../../core/services/leaderboard.service';
import { environment } from '../../../environments/environment';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

@Component({
  selector: 'app-add-leaderboards',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './add-leaderboards.component.html',
  styleUrls: ['./add-leaderboards.component.scss'],
})
export class AddLeaderboardsComponent implements OnInit {
  leaderboard: LeaderboardUser[] = [];
  newUser: { email: string; type: 'متطوع' | 'قاده' | ''; name: string; rank: string; image: File | null } = {
    email: '',
    type: '',
    name: '',
    rank: '',
    image: null,
  };
  editingUser: LeaderboardUser | null = null;
  editName: string = '';
  editRank: string = '';
  editVolunteerHours: number = 0;
  editNumberOfStudents: number = 0;
  editSubjects: string = '';
  editImage: File | null = null;
  editImagePreview: string | null = null;
  toastMessage: { message: string; type: 'success' | 'error' } | null = null;
  isLoading: boolean = false;
  environment = environment;

  constructor(private leaderboardService: LeaderboardService) {}

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.isLoading = true;
    this.leaderboardService.getLeaderboard().subscribe({
      next: (users) => {
        this.leaderboard = users;
        this.isLoading = false;
      },
      error: (err) => {
        this.showToast(err.message || 'فشل في جلب بيانات لوحة الصدارة', 'error');
        this.leaderboard = [];
        this.isLoading = false;
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.newUser.image = input.files[0];
    }
  }

  onEditImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.editImage = input.files[0];
      // Generate preview
      const reader = new FileReader();
      reader.onload = () => {
        this.editImagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.editImage);
    }
  }

  addUser(): void {
    if (!this.newUser.email.trim() || !this.newUser.type) {
      this.showToast('البريد الإلكتروني والدور مطلوبان', 'error');
      return;
    }
    if (this.newUser.type === 'قاده' && (!this.newUser.name.trim() || !this.newUser.rank || !this.newUser.image)) {
      this.showToast('الاسم، الرتبة، والصورة مطلوبة للقادة', 'error');
      return;
    }

    this.isLoading = true;
    this.leaderboardService
      .addUserToLeaderboard(
        this.newUser.email,
        this.newUser.type,
        this.newUser.name,
        this.newUser.rank,
        this.newUser.image ?? undefined
      )
      .subscribe({
        next: (user) => {
          this.showToast(`تم إضافة ${user.name || user.email} بنجاح`, 'success');
          this.newUser = { email: '', type: '', name: '', rank: '', image: null };
          this.loadLeaderboard();
        },
        error: (err) => {
          this.showToast(err.message || 'فشل في إضافة المستخدم', 'error');
          this.isLoading = false;
        },
      });
  }

  startEdit(user: LeaderboardUser): void {
    this.editingUser = { ...user };
    this.editName = user.name;
    this.editRank = user.rank || '';
    this.editVolunteerHours = user.volunteerHours;
    this.editNumberOfStudents = user.numberOfStudents;
    this.editSubjects = user.subjects.join(', ');
    this.editImage = null;
    this.editImagePreview = null;
  }

  cancelEdit(): void {
    this.editingUser = null;
    this.editName = '';
    this.editRank = '';
    this.editVolunteerHours = 0;
    this.editNumberOfStudents = 0;
    this.editSubjects = '';
    this.editImage = null;
    this.editImagePreview = null;
  }

  saveEdit(): void {
    if (!this.editingUser) return;

    const subjects = this.editSubjects.split(',').map(s => s.trim()).filter(s => s);
    if (this.editVolunteerHours < 0 || this.editNumberOfStudents < 0) {
      this.showToast('ساعات التطوع وعدد الطلاب يجب أن يكونا صفر أو أكثر', 'error');
      return;
    }
    if (subjects.some(s => !s)) {
      this.showToast('المواد يجب أن تكون نصوصًا غير فارغة', 'error');
      return;
    }
    if (this.editingUser.type === 'قاده' && !this.editRank) {
      this.showToast('الرتبة مطلوبة للقادة', 'error');
      return;
    }

    this.isLoading = true;
    this.leaderboardService
      .editUserInLeaderboard(
        this.editingUser.email,
        this.editName,
        this.editingUser.type === 'قاده' ? this.editRank : undefined,
        this.editVolunteerHours,
        this.editNumberOfStudents,
        subjects,
        this.editImage ?? undefined
      )
      .subscribe({
        next: (user) => {
          this.showToast(`تم تحديث ${user.name || user.email} بنجاح`, 'success');
          this.cancelEdit();
          this.loadLeaderboard();
        },
        error: (err) => {
          this.showToast(err.message || 'فشل في تحديث المستخدم', 'error');
          this.isLoading = false;
        },
      });
  }

  deleteUser(email: string): void {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم من لوحة الصدارة؟')) {
      this.isLoading = true;
      // Optimistically update the UI by removing the user
      const deletedUser = this.leaderboard.find(user => user.email === email);
      this.leaderboard = this.leaderboard.filter(user => user.email !== email);
      this.leaderboardService.removeUserFromLeaderboard(email).subscribe({
        next: (response) => {
          this.showToast(response.message || `تم حذف ${deletedUser?.name || email} بنجاح`, 'success');
          this.isLoading = false;
          // Reload to ensure data consistency
          this.loadLeaderboard();
        },
        error: (err) => {
          this.showToast(err.message || 'فشل في حذف المستخدم', 'error');
          this.isLoading = false;
          // Revert optimistic update on error
          this.loadLeaderboard();
        },
      });
    }
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = { message, type };
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000); // Hide toast after 3 seconds
  }
}
