import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JoinRequestService, JoinRequestResponse, JoinRequest } from '../../core/services/join-request.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-show-member',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './show-member.component.html',
  styleUrls: ['./show-member.component.scss']
})
export class ShowMemberComponent implements OnInit {
  member: JoinRequest | null = null;
  error: string | null = null;
  success: string | null = null;
  memberId: string | null = null;
  password: string | null = null; // Store password if available
  newStudent = { name: '', email: '', phone: '' };
  editMode = false;
  editedVolunteerHours: number = 0;
  editedSubjects: string[] = [];
  editedStudents: { name: string; email: string; phone: string }[] = [];

  constructor(
    private joinRequestService: JoinRequestService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.memberId = this.route.snapshot.paramMap.get('id');
    if (this.memberId) {
      this.loadMemberDetails(this.memberId);
    } else {
      this.error = 'معرف العضو غير موجود';
    }
  }

  loadMemberDetails(id: string): void {
    this.joinRequestService.getMember(id).subscribe({
      next: (response: JoinRequestResponse) => {
        console.log('Member response:', response);
        if (response.success && response.member) {
          this.member = response.member;
          this.editedVolunteerHours = this.member.volunteerHours;
          this.editedSubjects = [...this.member.subjects];
          this.editedStudents = [...this.member.students];
          // Password might be included in response if available
          this.password = response.password || 'غير متوفرة';
        } else {
          this.error = response.message || 'فشل في جلب بيانات العضو';
        }
      },
      error: (err) => {
        this.error = err.message || 'حدث خطأ أثناء جلب بيانات العضو';
        console.error('Member loading error:', err);
      }
    });
  }

  addStudent(): void {
    if (!this.memberId || !this.newStudent.name || !this.newStudent.email || !this.newStudent.phone) {
      this.error = 'يرجى إدخال جميع تفاصيل الطالب';
      return;
    }
    this.joinRequestService.addStudent(
      this.memberId,
      this.newStudent.name,
      this.newStudent.email,
      this.newStudent.phone
    ).subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success && response.data && this.member) {
          this.member.students = response.data.students;
          this.member.numberOfStudents = response.data.numberOfStudents;
          this.editedStudents = [...this.member.students];
          this.newStudent = { name: '', email: '', phone: '' };
          this.success = response.message;
          this.error = null;
        } else {
          this.error = response.message || 'فشل في إضافة الطالب';
        }
      },
      error: (err) => {
        this.error = err.message || 'حدث خطأ أثناء إضافة الطالب';
        console.error('Add student error:', err);
      }
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode && this.member) {
      // Reset edited values if canceling
      this.editedVolunteerHours = this.member.volunteerHours;
      this.editedSubjects = [...this.member.subjects];
      this.editedStudents = [...this.member.students];
    }
  }

  saveChanges(): void {
    if (!this.memberId) {
      this.error = 'معرف العضو غير موجود';
      return;
    }
    if (this.editedVolunteerHours < 0 || !Number.isInteger(this.editedVolunteerHours)) {
      this.error = 'يجب أن تكون ساعات التطوع رقمًا صحيحًا غير سالب';
      return;
    }
    this.joinRequestService.updateMemberDetails(
      this.memberId,
      this.editedVolunteerHours,
      this.editedStudents.length,
      this.editedStudents,
      this.editedSubjects
    ).subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success && response.data && this.member) {
          this.member.volunteerHours = response.data.volunteerHours;
          this.member.numberOfStudents = response.data.numberOfStudents;
          this.member.students = response.data.students;
          this.member.subjects = response.data.subjects;
          this.editMode = false;
          this.success = response.message;
          this.error = null;
        } else {
          this.error = response.message || 'فشل في تحديث تفاصيل العضو';
        }
      },
      error: (err) => {
        this.error = err.message || 'حدث خطأ أثناء تحديث تفاصيل العضو';
        console.error('Update member error:', err);
      }
    });
  }

  deleteStudent(index: number): void {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      this.editedStudents.splice(index, 1);
    }
  }

  addSubject(subject: string): void {
    if (subject && !this.editedSubjects.includes(subject)) {
      this.editedSubjects.push(subject);
    }
  }

  removeSubject(index: number): void {
    this.editedSubjects.splice(index, 1);
  }

  clearMessages(): void {
    this.error = null;
    this.success = null;
  }
}