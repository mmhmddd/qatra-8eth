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
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
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
        this.cdr.detectChanges();
      },
    });
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (response: NotificationResponse) => {
        if (response.success) {
          this.notifications = response.notifications ?? [];
          this.unreadNotificationsCount = this.notifications.filter((n: AppNotification) => !n.read).length;
          this.cdr.detectChanges();
        } else {
          this.error = response.message || 'فشل في جلب الإشعارات';
          this.cdr.detectChanges();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في جلب الإشعارات';
        this.cdr.detectChanges();
      },
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications && this.unreadNotificationsCount > 0 && this.notifications) {
      this.notificationService.markNotificationsAsRead().subscribe({
        next: (response: NotificationResponse) => {
          if (response.success) {
            this.notifications = response.notifications ?? [];
            this.unreadNotificationsCount = 0;
            this.cdr.detectChanges();
          } else {
            this.error = response.message || 'فشل في تحديد الإشعارات كمقروءة';
            this.cdr.detectChanges();
          }
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.message || 'فشل في تحديد الإشعارات كمقروءة';
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
      membersResponse: this.joinRequestService.getAll(),
      lowLectureResponse: this.lowLecturesService.getLowLectureMembers(),
    }).subscribe({
      next: ({ membersResponse, lowLectureResponse }) => {
        if (membersResponse.success && membersResponse.members) {
          const members: JoinRequest[] = membersResponse.members;
          const lowLectureMembers: LowLectureMember[] = lowLectureResponse.success ? lowLectureResponse.members : [];

          interface HeaderColors {
            [key: string]: string;
            ID: string;
            Name: string;
            Email: string;
            Phone: string;
            AcademicSpecialization: string;
            Address: string;
            Status: string;
            VolunteerHours: string;
            NumberOfStudents: string;
            StudentCount: string;
            StudentDetails: string;
            Subjects: string;
            SubjectsCount: string;
            LectureCount: string;
            CreatedAt: string;
            ProfileImage: string;
            MemberID: string;
            MemberName: string;
            MemberStatus: string;
            StudentName: string;
            StudentEmail: string;
            StudentPhone: string;
            StudentGrade: string;
            StudentSubjects: string;
            LectureID: string;
            LectureName: string;
            Subject: string;
            StudentEmailLecture: string;
            Date: string;
            Duration: string;
            Link: string;
            MessageID: string;
            Content: string;
            CreatedAtMessage: string;
            DisplayUntil: string;
            MeetingID: string;
            Title: string;
            StartTime: string;
            EndTime: string;
            LowLectureWeekCount: string;
            UnderTargetStudents: string;
            Lectures: string;
          }

          const headerColors: HeaderColors = {
            ID: 'ADD8E6',
            Name: 'D3D3D3',
            Email: 'FFE4E1',
            Phone: 'E6E6FA',
            AcademicSpecialization: 'F0FFF0',
            Address: 'F5F5DC',
            Status: 'FFDAB9',
            VolunteerHours: 'E0FFFF',
            NumberOfStudents: 'F0E68C',
            StudentCount: '98FB98',
            StudentDetails: 'F5DEB3',
            Subjects: 'B0C4DE',
            SubjectsCount: 'FFB6C1',
            LectureCount: 'AFEEEE',
            CreatedAt: 'E8E8E8',
            ProfileImage: 'F0F8FF',
            MemberID: 'ADD8E6',
            MemberName: 'D3D3D3',
            MemberStatus: 'FFE4E1',
            StudentName: 'E6E6FA',
            StudentEmail: 'F0FFF0',
            StudentPhone: 'F5F5DC',
            StudentGrade: 'FFDAB9',
            StudentSubjects: 'E0FFFF',
            LectureID: 'F0E68C',
            LectureName: '98FB98',
            Subject: 'F5DEB3',
            StudentEmailLecture: 'B0C4DE',
            Date: 'FFB6C1',
            Duration: 'AFEEEE',
            Link: 'E8E8E8',
            MessageID: 'F0F8FF',
            Content: 'ADD8E6',
            CreatedAtMessage: 'D3D3D3',
            DisplayUntil: 'FFE4E1',
            MeetingID: 'E6E6FA',
            Title: 'F0FFF0',
            StartTime: 'F5F5DC',
            EndTime: 'FFDAB9',
            LowLectureWeekCount: 'E0FFFF',
            UnderTargetStudents: 'F0E68C',
            Lectures: '98FB98',
          };

          const memberData = members.map(member => ({
            ID: member.id || member._id || '',
            Name: member.name || '',
            Email: member.email || '',
            Phone: member.phone || member.number || '',
            AcademicSpecialization: member.academicSpecialization || '',
            Address: member.address || '',
            Status: member.status || '',
            VolunteerHours: member.volunteerHours || 0,
            NumberOfStudents: member.numberOfStudents || 0,
            StudentCount: member.students?.length || 0,
            StudentDetails: member.students?.map(student =>
              `Name: ${student.name || ''}, Email: ${student.email || ''}, Phone: ${student.phone || ''}, Grade: ${student.grade || 'غير محدد'}, Subjects: ${student.subjects?.map(sub => `${sub.name || 'غير محدد'} (Min Lectures: ${sub.minLectures ?? 0})`).join('; ') || 'لا توجد مواد'}`
            ).join('\n') || '',
            Subjects: member.subjects?.join(', ') || '',
            SubjectsCount: member.subjectsCount || 0,
            LectureCount: member.lectureCount || 0,
            CreatedAt: member.createdAt || '',
            ProfileImage: member.profileImage || '',
          }));

          const studentData: any[] = [];
          members.forEach(member => {
            if (member.students && Array.isArray(member.students)) {
              member.students.forEach(student => {
                if (student.name && student.email) {
                  const subjects = Array.isArray(student.subjects)
                    ? student.subjects
                        .filter(sub => sub.name && sub.name.trim() && sub.minLectures !== undefined)
                        .map(sub => `${sub.name} (Min Lectures: ${sub.minLectures})`)
                        .join('\n')
                    : 'لا توجد مواد';
                  studentData.push({
                    MemberID: member.id || member._id || '',
                    MemberName: member.name || '',
                    MemberStatus: member.status || '',
                    StudentName: student.name || '',
                    StudentEmail: student.email || '',
                    StudentPhone: student.phone || '',
                    StudentGrade: student.grade || 'غير محدد',
                    StudentSubjects: subjects,
                  });
                }
              });
            }
          });

          const lectureData: any[] = [];
          members.forEach(member => {
            member.lectures?.forEach(lecture => {
              lectureData.push({
                MemberID: member.id || member._id || '',
                MemberName: member.name || '',
                MemberStatus: member.status || '',
                LectureID: lecture._id || '',
                LectureName: lecture.name || '',
                Subject: lecture.subject || '',
                StudentEmail: lecture.studentEmail || '',
                Date: lecture.date || '',
                Duration: lecture.duration || 0,
                Link: lecture.link || '',
              });
            });
          });

          const messageData: any[] = [];
          members.forEach(member => {
            member.messages?.forEach(message => {
              messageData.push({
                MemberID: member.id || member._id || '',
                MemberName: member.name || '',
                MemberStatus: member.status || '',
                MessageID: message._id || '',
                Content: message.content || '',
                CreatedAt: message.createdAt || '',
                DisplayUntil: message.displayUntil || '',
              });
            });
          });

          const meetingData: any[] = [];
          members.forEach(member => {
            member.meetings?.forEach(meeting => {
              meetingData.push({
                MemberID: member.id || member._id || '',
                MemberName: member.name || '',
                MemberStatus: member.status || '',
                MeetingID: meeting.id || meeting._id || '',
                Title: meeting.title || '',
                Date: meeting.date instanceof Date ? meeting.date.toISOString() : meeting.date || '',
                StartTime: meeting.startTime || '',
                EndTime: meeting.endTime || '',
              });
            });
          });

          const lowLectureData: any[] = lowLectureMembers.map(member => ({
            MemberID: member._id || '',
            MemberName: member.name || '',
            Email: member.email || '',
            LowLectureWeekCount: member.lowLectureWeekCount || 0,
            UnderTargetStudents: member.underTargetStudents
              ?.map(student =>
                `${student.studentName || 'غير محدد'} (${student.studentEmail || ''}, Grade: ${student.academicLevel || 'غير محدد'}, Subjects: ${student.underTargetSubjects
                  ?.map(sub => `${sub.name || 'غير محدد'} (Min: ${sub.minLectures ?? 0}, Delivered: ${sub.deliveredLectures ?? 0})`)
                  .join('; ') || 'لا توجد مواد'}`
              )
              .join('; ') || '',
            Lectures: member.lectures
              ?.map(lecture => `${lecture.name || 'غير محدد'} (Subject: ${lecture.subject || ''}, Date: ${lecture.createdAt || ''}, Link: ${lecture.link || ''})`)
              .join('; ') || '',
          }));

          const workbook = new ExcelJS.Workbook();

          const styleSheet = (worksheet: ExcelJS.Worksheet, headers: string[], data: any[], wideColumns: string[] = []) => {
            const columnWidths = headers.map(header => wideColumns.includes(header) ? 20 : 10);
            worksheet.columns = headers.flatMap((_, index) => [
              { width: columnWidths[index] },
              { width: columnWidths[index] },
              { width: columnWidths[index] },
            ]);

            const headerRow = worksheet.addRow(headers.flatMap(header => [header, '', '']));
            headers.forEach((header, index) => {
              const startCol = index * 3 + 1;
              const cell = headerRow.getCell(startCol);
              cell.value = header;
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: headerColors[header] || 'ADD8E6' },
              };
              cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
              };
              worksheet.mergeCells(1, startCol, 1, startCol + 2);
            });

            data.forEach((rowData, rowIndex) => {
              const row = worksheet.addRow(Object.values(rowData).flatMap(value => [value, '', '']));
              const hasWideColumnData = wideColumns.some(col => rowData[col] && rowData[col].includes('\n'));
              if (hasWideColumnData) {
                const maxLines = wideColumns.reduce((max, col) => {
                  const lines = (rowData[col]?.match(/\n/g) || []).length + 1;
                  return Math.max(max, lines);
                }, 1);
                row.height = Math.max(20, maxLines * 20);
              }
              headers.forEach((_, index) => {
                const startCol = index * 3 + 1;
                const cell = row.getCell(startCol);
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                  top: { style: 'thin', color: { argb: 'FF000000' } },
                  left: { style: 'thin', color: { argb: 'FF000000' } },
                  bottom: { style: 'thin', color: { argb: 'FF000000' } },
                  right: { style: 'thin', color: { argb: 'FF000000' } },
                };
                worksheet.mergeCells(rowIndex + 2, startCol, rowIndex + 2, startCol + 2);
              });
            });
          };

          const memberSheet = workbook.addWorksheet('Members');
          styleSheet(memberSheet, Object.keys(memberData[0] || {}), memberData, ['StudentDetails']);

          if (studentData.length > 0) {
            const studentSheet = workbook.addWorksheet('Students');
            styleSheet(studentSheet, Object.keys(studentData[0] || {}), studentData, ['StudentSubjects']);
          }

          if (lectureData.length > 0) {
            const lectureSheet = workbook.addWorksheet('Lectures');
            styleSheet(lectureSheet, Object.keys(lectureData[0] || {}), lectureData);
          }

          if (messageData.length > 0) {
            const messageSheet = workbook.addWorksheet('Messages');
            styleSheet(messageSheet, Object.keys(messageData[0] || {}), messageData);
          }

          if (meetingData.length > 0) {
            const meetingSheet = workbook.addWorksheet('Meetings');
            styleSheet(meetingSheet, Object.keys(meetingData[0] || {}), meetingData);
          }

          if (lowLectureData.length > 0) {
            const lowLectureSheet = workbook.addWorksheet('LowLectureMembers');
            styleSheet(lowLectureSheet, Object.keys(lowLectureData[0] || {}), lowLectureData, ['UnderTargetStudents', 'Lectures']);
          }

          workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, 'all_members_data.xlsx');
          }).catch(err => {
            this.error = 'فشل في تصدير الملف إلى Excel';
            this.cdr.detectChanges();
          });
        } else {
          this.error = membersResponse.message || 'فشل في جلب بيانات الأعضاء';
          this.cdr.detectChanges();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في تصدير البيانات إلى Excel';
        this.cdr.detectChanges();
      },
    });
  }

  exportStudentsToExcel(): void {
    this.joinRequestService.getApprovedMembers().subscribe({
      next: (membersResponse) => {
        if (membersResponse.success && membersResponse.members) {
          const members: JoinRequest[] = membersResponse.members;
          const studentData: any[] = [];
          let totalStudents = 0;

          members.forEach(member => {
            if (member.students && Array.isArray(member.students) && member.students.length > 0) {
              member.students.forEach(student => {
                if (student.name && student.email) {
                  const subjects = Array.isArray(student.subjects) && student.subjects.length > 0
                    ? student.subjects
                        .filter(sub => sub.name && sub.name.trim() && Number.isInteger(sub.minLectures) && sub.minLectures >= 0)
                        .map(sub => `${sub.name.trim()} (الحد الأدنى: ${sub.minLectures} محاضرة)`)
                        .join('\n')
                    : 'لا توجد مواد';
                  studentData.push({
                    'اسم الطالب': student.name.trim() || 'غير محدد',
                    'اسم العضو': member.name?.trim() || 'غير محدد',
                    'البريد الإلكتروني للطالب': student.email.trim() || 'غير محدد',
                    'هاتف الطالب': student.phone?.trim() || 'غير محدد',
                    'الصف الدراسي': (student.grade && student.grade.trim()) ? student.grade.trim() : 'غير محدد',
                    'معرف العضو': member.id || member._id || 'غير محدد',
                    'المواد الدراسية': subjects,
                    'عدد المواد': Array.isArray(student.subjects) ? student.subjects.filter(sub => sub.name && sub.name.trim() && Number.isInteger(sub.minLectures)).length : 0,
                  });
                  totalStudents++;
                }
              });
            }
          });

          if (studentData.length === 0) {
            this.error = 'لا توجد بيانات طلاب صالحة لتصديرها';
            this.cdr.detectChanges();
            return;
          }

          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('بيانات الطلاب');

          const headers = [
            'اسم الطالب',
            'اسم العضو',
            'البريد الإلكتروني للطالب',
            'هاتف الطالب',
            'الصف الدراسي',
            'معرف العضو',
            'المواد الدراسية',
            'عدد المواد',
          ];

          const headerColors = [
            'ADD8E6', 'D3D3D3', 'FFE4E1', 'E6E6FA', 'F0FFF0', 'F5F5DC',
            'E0FFFF', 'F0E68C'
          ];

          worksheet.columns = headers.map((header, index) => ({
            width: header === 'المواد الدراسية' ? 30 : (header === 'اسم الطالب' || header === 'اسم العضو' ? 25 : 15)
          }));

          const headerRow = worksheet.addRow(headers);
          headerRow.eachCell((cell, colNumber) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: headerColors[colNumber - 1] || 'ADD8E6' }
            };
            cell.font = { bold: true, color: { argb: 'FF000000' }, size: 12 };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
          });
          headerRow.height = 25;

          studentData.forEach((student, index) => {
            const dataRow = worksheet.addRow(Object.values(student));
            const subjectsText = student['المواد الدراسية'] || '';
            const studentName = student['اسم الطالب'] || '';
            const memberName = student['اسم العضو'] || '';
            const subjectsLineCount = (subjectsText.match(/\n/g) || []).length + 1;
            const isLongName = studentName.length > 20 || memberName.length > 20;
            const rowHeight = Math.max(20, subjectsLineCount * 15, isLongName ? 40 : 20);
            dataRow.height = rowHeight;
            dataRow.eachCell((cell) => {
              cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
              };
              if (index % 2 === 0) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF8F8F8' }
                };
              }
            });
          });

          worksheet.addRow([]);
          const summaryRow = worksheet.addRow(['', '', '', `إجمالي عدد الطلاب: ${totalStudents}`, '', '', '', '']);
          summaryRow.getCell(4).font = { bold: true, size: 14 };
          summaryRow.getCell(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFD700' }
          };
          summaryRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          summaryRow.eachCell((cell, colNumber) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
            if (colNumber !== 4) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF' }
              };
            }
          });
          summaryRow.height = 25;

          workbook.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const currentDate = new Date().toISOString().split('T')[0];
            saveAs(blob, `students_complete_data_${currentDate}.xlsx`);
          }).catch(err => {
            this.error = 'فشل في تصدير تفاصيل الطلاب إلى Excel';
            this.cdr.detectChanges();
          });
        } else {
          this.error = membersResponse.message || 'فشل في جلب بيانات الأعضاء';
          this.cdr.detectChanges();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في تصدير تفاصيل الطلاب إلى Excel';
        this.cdr.detectChanges();
      },
    });
  }
}
