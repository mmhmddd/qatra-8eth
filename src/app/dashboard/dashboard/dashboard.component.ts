import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { JoinRequestService, JoinRequestResponse, JoinRequest } from '../../core/services/join-request.service';
import { LowLecturesService, LowLectureMembersResponse, LowLectureMember } from '../../core/services/low-lectures.service';
import { NotificationResponse, AppNotification, NotificationService } from '../../core/services/Notification.service';
import { filter } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './dashboard.Component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  isSidebarCollapsed = false;
  activeNavIndex = 0;
  joinRequestsCount: number = 0;
  membersCount: number = 0;
  error: string | null = null;
  notifications: AppNotification[] = [];
  unreadNotificationsCount: number = 0;
  showNotifications: boolean = false;

  navItems = [
    { label: 'عرض جميع الأعضاء', icon: 'fas fa-users', link: '/all-members' },
    { label: 'عرض جميع الطلبات', icon: 'fas fa-file-alt', link: '/requests' },
    { label: 'إضافة كتاب', icon: 'fas fa-book', link: '/upload-pdf' },
    { label: 'إضافة متصدر', icon: 'fas fa-trophy', link: '/add-leaderboards' },
    { label: 'إضافة صورة في معرض الصور', icon: 'fas fa-image', link: '/add-gallery' },
    { label: 'إضافة رأي', icon: 'fas fa-comment-dots', link: '/add-testimonials' },
    { label: 'الأعضاء المقصرون', icon: 'fas fa-user-times', link: '/low-lecture-members' },
    { label: 'طلبات pdf المحاضرات', icon: 'fas fa-file-alt', link: '/lectures-request' },
  ];

  constructor(
    private router: Router,
    private joinRequestService: JoinRequestService,
    private lowLecturesService: LowLecturesService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.activeNavIndex = this.navItems.findIndex((item) => item.link === event.urlAfterRedirects);
        this.cdr.detectChanges();
      });
  }

  ngOnInit(): void {
    this.checkAuth();
    this.loadCounts();
    this.loadNotifications();
  }

  checkAuth(): void {
    if (!localStorage.getItem('token')) {
      this.error = 'غير مسموح بالوصول. يرجى تسجيل الدخول مرة أخرى';
      this.router.navigate(['/login']);
      this.cdr.detectChanges();
    }
  }

  loadCounts(): void {
    forkJoin({
      all: this.joinRequestService.getAll(),
      approved: this.joinRequestService.getApprovedMembers(),
    }).subscribe({
      next: ({ all, approved }) => {
        if (all.success && approved.success) {
          const allRequests = all.members || [];
          this.joinRequestsCount = allRequests.length;
          this.membersCount = approved.members?.length || 0;
        } else {
          this.error = all.message || approved.message || 'فشل في جلب البيانات';
        }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في جلب عدد الطلبات والأعضاء';
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
        console.error('Error fetching counts:', err);
        this.cdr.detectChanges();
      },
    });
  }

  loadNotifications(): void {
    console.log('Fetching notifications...');
    this.notificationService.getNotifications().subscribe({
      next: (response: NotificationResponse) => {
        console.log('Notification response:', response);
        if (response.success) {
          this.notifications = response.notifications ?? [];
          this.unreadNotificationsCount = this.notifications.filter((n: AppNotification) => !n.read).length;
          console.log('Notifications loaded:', this.notifications);
          console.log('Unread count:', this.unreadNotificationsCount);
          this.cdr.detectChanges();
        } else {
          this.error = response.message || 'فشل في جلب الإشعارات';
          console.error('Notification error:', this.error);
          this.cdr.detectChanges();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في جلب الإشعارات';
        console.error('Error fetching notifications:', err);
        this.cdr.detectChanges();
      },
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications && this.unreadNotificationsCount > 0 && this.notifications) {
      this.notificationService.markNotificationsAsRead().subscribe({
        next: (response: NotificationResponse) => {
          console.log('Mark read response:', response);
          if (response.success) {
            this.notifications = response.notifications ?? [];
            this.unreadNotificationsCount = 0;
            this.cdr.detectChanges();
          } else {
            this.error = response.message || 'فشل في تحديد الإشعارات كمقروءة';
            console.error('Mark read error:', this.error);
            this.cdr.detectChanges();
          }
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.message || 'فشل في تحديد الإشعارات كمقروءة';
          console.error('Error marking notifications as read:', err);
          this.cdr.detectChanges();
        },
      });
    }
  }

  closeNotifications(): void {
    this.showNotifications = false;
    this.cdr.detectChanges();
  }

  navigateTo(link: string): void {
    this.router.navigate([link]);
  }

  exportToExcel(): void {
    forkJoin({
      membersResponse: this.joinRequestService.getAll(), // Changed to getAll() to include all members
      lowLectureResponse: this.lowLecturesService.getLowLectureMembers(),
    }).subscribe({
      next: ({ membersResponse, lowLectureResponse }) => {
        if (membersResponse.success && membersResponse.members) {
          const members: JoinRequest[] = membersResponse.members;
          const lowLectureMembers: LowLectureMember[] = lowLectureResponse.success ? lowLectureResponse.members : [];

          // Prepare Members sheet data
          const memberData = members.map(member => ({
            ID: member.id || member._id,
            Name: member.name,
            Email: member.email,
            Phone: member.phone || member.number,
            AcademicSpecialization: member.academicSpecialization,
            Address: member.address,
            Status: member.status, // Includes Pending, Approved, Rejected
            VolunteerHours: member.volunteerHours,
            NumberOfStudents: member.numberOfStudents,
            Subjects: member.subjects?.join(', ') || '',
            SubjectsCount: member.subjectsCount,
            LectureCount: member.lectureCount,
            CreatedAt: member.createdAt,
            ProfileImage: member.profileImage || '',
          }));

          // Prepare Students sheet data
          const studentData: any[] = [];
          members.forEach(member => {
            member.students?.forEach(student => {
              studentData.push({
                MemberID: member.id || member._id,
                MemberName: member.name,
                MemberStatus: member.status,
                StudentName: student.name,
                StudentEmail: student.email,
                StudentPhone: student.phone,
                StudentGrade: student.grade || '',
                StudentSubjects: student.subjects?.map(sub => `${sub.name} (Min Lectures: ${sub.minLectures})`).join('; ') || '',
              })});
          });

          // Prepare Lectures sheet data
          const lectureData: any[] = [];
          members.forEach(member => {
            member.lectures?.forEach(lecture => {
              lectureData.push({
                MemberID: member.id || member._id,
                MemberName: member.name,
                MemberStatus: member.status,
                LectureID: lecture._id,
                LectureName: lecture.name,
                Subject: lecture.subject,
                StudentEmail: lecture.studentEmail,
                Date: lecture.date,
                Duration: lecture.duration,
                Link: lecture.link,
              });
            });
          });

          // Prepare Messages sheet data
          const messageData: any[] = [];
          members.forEach(member => {
            member.messages?.forEach(message => {
              messageData.push({
                MemberID: member.id || member._id,
                MemberName: member.name,
                MemberStatus: member.status,
                MessageID: message._id,
                Content: message.content,
                CreatedAt: message.createdAt,
                DisplayUntil: message.displayUntil,
              });
            });
          });

          // Prepare Meetings sheet data
          const meetingData: any[] = [];
          members.forEach(member => {
            member.meetings?.forEach(meeting => {
              meetingData.push({
                MemberID: member.id || member._id,
                MemberName: member.name,
                MemberStatus: member.status,
                MeetingID: meeting.id || meeting._id,
                Title: meeting.title,
                Date: meeting.date instanceof Date ? meeting.date.toISOString() : meeting.date,
                StartTime: meeting.startTime,
                EndTime: meeting.endTime,
              });
            });
          });

          // Prepare Low Lecture Members sheet data
          const lowLectureData: any[] = lowLectureMembers.map(member => ({
            MemberID: member._id,
            MemberName: member.name,
            Email: member.email,
            LowLectureWeekCount: member.lowLectureWeekCount,
            UnderTargetStudents: member.underTargetStudents
              ?.map(student =>
                `${student.studentName} (${student.studentEmail}, Grade: ${student.academicLevel}, Subjects: ${student.underTargetSubjects
                  .map(sub => `${sub.name} (Min: ${sub.minLectures}, Delivered: ${sub.deliveredLectures})`)
                  .join('; ')})`
              )
              .join('; ') || '',
            Lectures: member.lectures
              ?.map(lecture => `${lecture.name} (Subject: ${lecture.subject}, Date: ${lecture.createdAt}, Link: ${lecture.link})`)
              .join('; ') || '',
          }));

          // Create workbook and append sheets
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          const memberWs: XLSX.WorkSheet = XLSX.utils.json_to_sheet(memberData);
          XLSX.utils.book_append_sheet(wb, memberWs, 'Members');

          if (studentData.length > 0) {
            const studentWs: XLSX.WorkSheet = XLSX.utils.json_to_sheet(studentData);
            XLSX.utils.book_append_sheet(wb, studentWs, 'Students');
          }

          if (lectureData.length > 0) {
            const lectureWs: XLSX.WorkSheet = XLSX.utils.json_to_sheet(lectureData);
            XLSX.utils.book_append_sheet(wb, lectureWs, 'Lectures');
          }

          if (messageData.length > 0) {
            const messageWs: XLSX.WorkSheet = XLSX.utils.json_to_sheet(messageData);
            XLSX.utils.book_append_sheet(wb, messageWs, 'Messages');
          }

          if (meetingData.length > 0) {
            const meetingWs: XLSX.WorkSheet = XLSX.utils.json_to_sheet(meetingData);
            XLSX.utils.book_append_sheet(wb, meetingWs, 'Meetings');
          }

          if (lowLectureData.length > 0) {
            const lowLectureWs: XLSX.WorkSheet = XLSX.utils.json_to_sheet(lowLectureData);
            XLSX.utils.book_append_sheet(wb, lowLectureWs, 'LowLectureMembers');
          }

          // Export the file
          XLSX.writeFile(wb, 'all_members_data.xlsx');
        } else {
          this.error = membersResponse.message || 'فشل في جلب بيانات الأعضاء';
          this.cdr.detectChanges();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في تصدير البيانات إلى Excel';
        console.error('Error exporting to Excel:', err);
        this.cdr.detectChanges();
      },
    });
  }
}
