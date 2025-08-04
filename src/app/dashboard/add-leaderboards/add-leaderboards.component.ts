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
  error: string = '';
  success: string = '';
  environment = environment;

  constructor(private leaderboardService: LeaderboardService) {}

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.leaderboardService.getLeaderboard().subscribe({
      next: (users) => {
        this.leaderboard = users;
        this.error = '';
      },
      error: (err) => {
        this.error = err.message;
        this.leaderboard = [];
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
      this.error = 'البريد الإلكتروني والدور مطلوبان';
      return;
    }
    if (this.newUser.type === 'قاده' && (!this.newUser.name.trim() || !this.newUser.rank || !this.newUser.image)) {
      this.error = 'الاسم، الرتبة، والصورة مطلوبة للقادة';
      return;
    }

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
          this.success = `تم إضافة ${user.name} بنجاح`;
          this.error = '';
          this.newUser = { email: '', type: '', name: '', rank: '', image: null };
          this.loadLeaderboard();
        },
        error: (err) => {
          this.error = err.message;
          this.success = '';
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
    this.error = '';
    this.success = '';
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
      this.error = 'ساعات التطوع وعدد الطلاب يجب أن يكونا صفر أو أكثر';
      return;
    }
    if (subjects.some(s => !s)) {
      this.error = 'المواد يجب أن تكون نصوصًا غير فارغة';
      return;
    }
    if (this.editingUser.type === 'قاده' && !this.editRank) {
      this.error = 'الرتبة مطلوبة للقادة';
      return;
    }

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
          this.success = `تم تحديث ${user.name} بنجاح`;
          this.error = '';
          this.cancelEdit();
          this.loadLeaderboard();
        },
        error: (err) => {
          this.error = err.message;
          this.success = '';
        },
      });
  }

  deleteUser(email: string): void {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم من لوحة الصدارة؟')) {
      this.leaderboardService.removeUserFromLeaderboard(email).subscribe({
        next: (response) => {
          this.success = response.message;
          this.error = '';
          this.loadLeaderboard();
        },
        error: (err) => {
          this.error = err.message;
          this.success = '';
        },
      });
    }
  }
}
