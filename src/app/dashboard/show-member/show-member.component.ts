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
  toastMessage: { message: string; type: 'success' | 'error' } | null = null;
  memberId: string | null = null;
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
    this.checkAuth();
    this.memberId = this.route.snapshot.paramMap.get('id');
    if (this.memberId) {
      this.loadMemberDetails(this.memberId);
    } else {
      this.showToast('معرف العضو غير موجود', 'error');
    }
  }

  checkAuth() {
    if (!localStorage.getItem('token')) {
      this.showToast('يرجى تسجيل الدخول للوصول إلى تفاصيل العضو', 'error');
      this.router.navigate(['/login']);
    }
  }

  loadMemberDetails(id: string): void {
    this.joinRequestService.getMember(id).subscribe({
      next: (response: JoinRequestResponse) => {
        console.log('Member response:', response);
        if (response.success && response.member) {
          this.member = {
            ...response.member,
            id: response.member.id || response.member.id, // Ensure id compatibility
            createdAt: new Date(response.member.createdAt).toLocaleString('ar-SA') // Format date
          };
          this.editedVolunteerHours = this.member.volunteerHours;
          this.editedSubjects = [...this.member.subjects];
          this.editedStudents = [...this.member.students];
          this.showToast('تم جلب بيانات العضو بنجاح', 'success');
        } else {
          this.showToast(response.message || 'فشل في جلب بيانات العضو', 'error');
        }
      },
      error: (err) => {
        this.showToast(err.message || 'حدث خطأ أثناء جلب بيانات العضو', 'error');
        console.error('Member loading error:', err);
      }
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  addStudent(): void {
    if (!this.memberId) {
      this.showToast('معرف العضو غير موجود', 'error');
      return;
    }
    if (!this.newStudent.name || !this.newStudent.email || !this.newStudent.phone) {
      this.showToast('يرجى إدخال جميع تفاصيل الطالب', 'error');
      return;
    }
    if (!this.isValidEmail(this.newStudent.email)) {
      this.showToast('البريد الإلكتروني للطالب غير صالح', 'error');
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
          this.showToast(response.message || 'تم إضافة الطالب بنجاح', 'success');
        } else {
          this.showToast(response.message || 'فشل في إضافة الطالب', 'error');
        }
      },
      error: (err) => {
        this.showToast(err.message || 'حدث خطأ أثناء إضافة الطالب', 'error');
        console.error('Add student error:', err);
      }
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode && this.member) {
      this.editedVolunteerHours = this.member.volunteerHours;
      this.editedSubjects = [...this.member.subjects];
      this.editedStudents = [...this.member.students];
    }
  }

  saveChanges(): void {
    if (!this.memberId) {
      this.showToast('معرف العضو غير موجود', 'error');
      return;
    }
    if (this.editedVolunteerHours < 0 || !Number.isInteger(this.editedVolunteerHours)) {
      this.showToast('يجب أن تكون ساعات التطوع رقمًا صحيحًا غير سالب', 'error');
      return;
    }
    if (this.editedStudents.some(student => !student.name || !student.email || !student.phone || !this.isValidEmail(student.email))) {
      this.showToast('بيانات الطلاب يجب أن تحتوي على الاسم، البريد الإلكتروني الصحيح، والهاتف', 'error');
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
          this.showToast(response.message || 'تم تحديث تفاصيل العضو بنجاح', 'success');
        } else {
          this.showToast(response.message || 'فشل في تحديث تفاصيل العضو', 'error');
        }
      },
      error: (err) => {
        this.showToast(err.message || 'حدث خطأ أثناء تحديث تفاصيل العضو', 'error');
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

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = { message, type };
    setTimeout(() => {
      this.toastMessage = null;
    }, 3000); // Hide toast after 3 seconds
  }
}
