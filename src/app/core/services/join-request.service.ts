import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap, timeout } from 'rxjs/operators';
import { ApiEndpoints } from '../constants/api-endpoints';

export interface Meeting {
  id?: string;
  _id?: string;
  title: string;
  date: string | Date;
  startTime: string;
  endTime: string;
}

export interface JoinRequestResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  email?: string;
  member?: JoinRequest;
  members?: JoinRequest[];
}

export interface JoinRequest {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  number?: string;
  academicSpecialization: string;
  address: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  volunteerHours: number;
  numberOfStudents: number;
  subjects: string[];
  subjectsCount: number;
  students: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[] }[];
  lectures: { _id: string; studentEmail: string; subject: string; date: string; duration: number; link: string; name: string }[];
  lectureCount: number;
  createdAt: string;
  messages: { createdAt: string; _id: string; content: string; displayUntil: string }[];
  meetings: Meeting[];
  profileImage?: string;
}

interface CreateJoinRequestResponse {
  message: string;
  id: string;
}

interface ApproveJoinRequestResponse {
  message: string;
  email: string;
}

interface UpdateMemberDetailsResponse {
  message: string;
  volunteerHours: number;
  numberOfStudents: number;
  students: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[] }[];
  subjects: string[];
  lectureCount: number;
}

interface AddStudentResponse {
  students: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[] }[];
  message: string;
  student: {
    academicLevel: any; name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[]
};
  numberOfStudents: number;
  subjects: string[];
}

interface RejectJoinRequestResponse {
  message: string;
}

interface DeleteMemberResponse {
  message: string;
}

interface SendMessageResponse {
  success: boolean;
  message: string;
  data?: { _id: string; content: string; displayUntil: string };
}

interface EditMessageResponse {
  message: string;
  displayUntil: string;
}

interface DeleteMessageResponse {
  message: string;
}

interface GetMessageResponse {
  success: boolean;
  message: { _id: string; content: string; displayUntil: string };
}

@Injectable({
  providedIn: 'root'
})
export class JoinRequestService {
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds timeout

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage');
    }
    return token ? this.headers.set('Authorization', `Bearer ${token}`) : this.headers;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private filterActiveMessages(messages: { createdAt: string; _id: string; content: string; displayUntil: string }[]): { createdAt: string; _id: string; content: string; displayUntil: string }[] {
    const now = new Date();
    return (messages || []).filter(msg => {
      const displayUntil = new Date(msg.displayUntil);
      return !isNaN(displayUntil.getTime()) && displayUntil > now;
    });
  }

  private handleError(error: HttpErrorResponse, operation: string): Observable<never> {
    console.error(`Error in ${operation}:`, error);

    let errorMessage = `فشل في ${operation}`;

    if (error.status === 0) {
      errorMessage = 'مشكلة في الاتصال بالخادم - تحقق من الإنترنت';
    } else if (error.status === 401) {
      errorMessage = 'غير مصرح - يرجى تسجيل الدخول مرة أخرى';
    } else if (error.status === 404) {
      errorMessage = 'الطلب غير موجود';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'بيانات غير صحيحة';
    } else if (error.status === 500) {
      errorMessage = 'خطأ في الخادم - يرجى المحاولة لاحقاً';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => ({
      success: false,
      message: errorMessage,
      error: error.statusText || error.message,
      status: error.status
    }));
  }

  create(data: { name: string; email: string; number: string; academicSpecialization: string; address: string; subjects?: string[] }): Observable<JoinRequestResponse> {
    if (!data.name || !data.email || !data.number || !data.academicSpecialization || !data.address) {
      return throwError(() => ({
        success: false,
        message: 'الاسم، البريد الإلكتروني، الرقم، التخصص الجامعي، والعنوان مطلوبة'
      }));
    }
    if (!this.isValidEmail(data.email)) {
      return throwError(() => ({
        success: false,
        message: 'البريد الإلكتروني غير صالح'
      }));
    }
    return this.http.post<CreateJoinRequestResponse>(ApiEndpoints.joinRequests.create, data, { headers: this.headers }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      map(response => ({
        success: true,
        message: response.message || 'تم تسجيل طلب الانضمام بنجاح',
        data: { id: response.id }
      })),
      catchError(error => this.handleError(error, 'تسجيل طلب الانضمام'))
    );
  }

  getAll(): Observable<JoinRequestResponse> {
    return this.http.get<JoinRequest[]>(ApiEndpoints.joinRequests.getAll, { headers: this.getAuthHeaders() }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(response => console.log('Raw getAll response:', JSON.stringify(response, null, 2))),
      map(members => ({
        success: true,
        message: 'تم جلب طلبات الانضمام بنجاح',
        members: members.map(member => ({
          id: member._id || member.id || '',
          _id: member._id,
          name: member.name || '',
          email: member.email || '',
          phone: member.number || member.phone || '',
          number: member.number,
          academicSpecialization: member.academicSpecialization || '',
          address: member.address || '',
          status: member.status || 'Pending',
          volunteerHours: member.volunteerHours || 0,
          numberOfStudents: member.numberOfStudents || 0,
          subjects: member.subjects || [],
          subjectsCount: member.subjects?.length || 0,
          students: (member.students || []).map((student: any) => ({
            name: student.name || '',
            email: student.email || '',
            phone: student.phone || '',
            grade: student.grade && student.grade.trim() ? student.grade : student.academicLevel && student.academicLevel.trim() ? student.academicLevel : 'غير محدد',
            subjects: (student.subjects || []).map((subject: any) => ({
              name: subject.name && subject.name.trim() ? subject.name : 'غير محدد',
              minLectures: Number.isInteger(subject.minLectures) ? subject.minLectures : 0
            })).filter((subject: any) => subject.name !== 'غير محدد' || subject.minLectures > 0)
          })).filter((student: any) => student.name && student.email),
          lectures: member.lectures || [],
          lectureCount: member.lectureCount || 0,
          createdAt: member.createdAt || '',
          messages: this.filterActiveMessages(member.messages || []),
          meetings: member.meetings || [],
          profileImage: member.profileImage || ''
        }))
      })),
      catchError(error => this.handleError(error, 'جلب طلبات الانضمام'))
    );
  }

  getApprovedMembers(): Observable<JoinRequestResponse> {
    return this.http.get<JoinRequest[]>(ApiEndpoints.joinRequests.getApproved, { headers: this.getAuthHeaders() }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(response => console.log('Raw getApprovedMembers response:', JSON.stringify(response, null, 2))),
      map(members => ({
        success: true,
        message: 'تم جلب الأعضاء المعتمدين بنجاح',
        members: members.map(member => ({
          id: member._id || member.id || '',
          _id: member._id,
          name: member.name || '',
          email: member.email || '',
          phone: member.number || member.phone || '',
          number: member.number,
          academicSpecialization: member.academicSpecialization || '',
          address: member.address || '',
          status: member.status || 'Approved',
          volunteerHours: member.volunteerHours || 0,
          numberOfStudents: member.numberOfStudents || 0,
          subjects: member.subjects || [],
          subjectsCount: member.subjects?.length || 0,
          students: (member.students || []).map((student: any) => ({
            name: student.name || '',
            email: student.email || '',
            phone: student.phone || '',
            grade: student.grade && student.grade.trim() ? student.grade : student.academicLevel && student.academicLevel.trim() ? student.academicLevel : 'غير محدد',
            subjects: (student.subjects || []).map((subject: any) => ({
              name: subject.name && subject.name.trim() ? subject.name : 'غير محدد',
              minLectures: Number.isInteger(subject.minLectures) ? subject.minLectures : 0
            })).filter((subject: any) => subject.name !== 'غير محدد' || subject.minLectures > 0)
          })).filter((student: any) => student.name && student.email),
          lectures: member.lectures || [],
          lectureCount: member.lectureCount || 0,
          createdAt: member.createdAt || '',
          messages: this.filterActiveMessages(member.messages || []),
          meetings: member.meetings || [],
          profileImage: member.profileImage || ''
        }))
      })),
      catchError(error => this.handleError(error, 'جلب الأعضاء المعتمدين'))
    );
  }

  approve(id: string): Observable<JoinRequestResponse> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return throwError(() => ({
        success: false,
        message: 'معرف الطلب مطلوب'
      }));
    }

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id.trim())) {
      return throwError(() => ({
        success: false,
        message: 'معرف الطلب غير صالح'
      }));
    }

    console.log('Approving request with ID:', id);
    console.log('Using endpoint:', ApiEndpoints.joinRequests.approve(id));
    console.log('Auth headers:', this.getAuthHeaders());

    return this.http.post<ApproveJoinRequestResponse>(
      ApiEndpoints.joinRequests.approve(id),
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(response => console.log('Raw approve response:', JSON.stringify(response, null, 2))),
      map(response => {
        console.log('Mapping approve response:', response);
        return {
          success: true,
          message: response.message || 'تم الموافقة على الطلب وإنشاء الحساب',
          email: response.email
        };
      }),
      catchError(error => {
        console.error('Approve request error:', error);
        return this.handleError(error, 'الموافقة على الطلب');
      })
    );
  }

  reject(id: string): Observable<JoinRequestResponse> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return throwError(() => ({
        success: false,
        message: 'معرف الطلب مطلوب'
      }));
    }

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id.trim())) {
      return throwError(() => ({
        success: false,
        message: 'معرف الطلب غير صالح'
      }));
    }

    console.log('Rejecting request with ID:', id);

    return this.http.post<RejectJoinRequestResponse>(
      ApiEndpoints.joinRequests.reject(id),
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(response => console.log('Raw reject response:', JSON.stringify(response, null, 2))),
      map(response => ({
        success: true,
        message: response.message || 'تم رفض الطلب'
      })),
      catchError(error => this.handleError(error, 'رفض الطلب'))
    );
  }

  deleteJoinRequest(id: string): Observable<JoinRequestResponse> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return throwError(() => ({
        success: false,
        message: 'معرف الطلب مطلوب'
      }));
    }

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id.trim())) {
      return throwError(() => ({
        success: false,
        message: 'معرف الطلب غير صالح: يجب أن يكون معرف MongoDB ObjectId صالحًا'
      }));
    }

    return this.http.delete<{
      message: string;
      deletedRequest: {
        id: string;
        name: string;
        email: string;
        status: string;
      };
    }>(ApiEndpoints.joinRequests.delete(id), { headers: this.getAuthHeaders() }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(response => console.log('Raw deleteJoinRequest response:', JSON.stringify(response, null, 2))),
      map(response => ({
        success: true,
        message: response.message || 'تم حذف طلب الانضمام بنجاح',
        data: response.deletedRequest ? {
          id: response.deletedRequest.id,
          name: response.deletedRequest.name,
          email: response.deletedRequest.email,
          status: response.deletedRequest.status
        } : undefined
      })),
      catchError(error => this.handleError(error, 'حذف طلب الانضمام'))
    );
  }

  getMember(id: string): Observable<JoinRequestResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف العضو مطلوب'
      }));
    }
    console.log('Fetching member with ID:', id);
    return this.http.get<any>(ApiEndpoints.joinRequests.getMember(id), { headers: this.getAuthHeaders() }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(response => console.log('Raw getMember response:', JSON.stringify(response, null, 2))),
      map(response => {
        if (response.success && response.member) {
          const member = response.member;
          return {
            success: true,
            message: 'تم جلب بيانات العضو بنجاح',
            member: {
              id: member._id || member.id || '',
              _id: member._id,
              name: member.name || '',
              email: member.email || '',
              phone: member.number || member.phone || '',
              number: member.number,
              academicSpecialization: member.academicSpecialization || '',
              address: member.address || '',
              status: member.status || 'Pending',
              volunteerHours: member.volunteerHours || 0,
              numberOfStudents: member.numberOfStudents || 0,
              subjects: member.subjects || [],
              subjectsCount: member.subjects?.length || 0,
              students: (member.students || []).map((student: any) => ({
                name: student.name || '',
                email: student.email || '',
                phone: student.phone || '',
                grade: student.grade && student.grade.trim() ? student.grade : student.academicLevel && student.academicLevel.trim() ? student.academicLevel : 'غير محدد',
                subjects: (student.subjects || []).map((subject: any) => ({
                  name: subject.name && subject.name.trim() ? subject.name : 'غير محدد',
                  minLectures: Number.isInteger(subject.minLectures) ? subject.minLectures : 0
                })).filter((subject: any) => subject.name !== 'غير محدد' || subject.minLectures > 0)
              })).filter((student: any) => student.name && student.email),
              lectures: (member.lectures || []).map((lecture: any) => ({
                _id: lecture._id || '',
                studentEmail: lecture.studentEmail || '',
                subject: lecture.subject || '',
                date: lecture.date || '',
                duration: lecture.duration || 0,
                link: lecture.link || '',
                name: lecture.name || ''
              })),
              lectureCount: member.lectureCount || 0,
              createdAt: member.createdAt || '',
              messages: this.filterActiveMessages(member.messages || []),
              meetings: (member.meetings || []).map((meeting: any) => ({
                id: meeting.id || meeting._id || '',
                _id: meeting._id,
                title: meeting.title || '',
                date: meeting.date || '',
                startTime: meeting.startTime || '',
                endTime: meeting.endTime || ''
              })),
              profileImage: member.profileImage || ''
            }
          };
        } else {
          return {
            success: false,
            message: response.message || 'العضو غير موجود أو بيانات غير كاملة',
            error: 'Response without member data'
          };
        }
      }),
      catchError(error => this.handleError(error, 'جلب بيانات العضو'))
    );
  }

  updateMemberDetails(
    id: string,
    volunteerHours: number,
    numberOfStudents: number,
    students: { name: string; email: string; phone: string; grade?: string; subjects: { name: string; minLectures: number }[] }[],
    subjects: string[]
  ): Observable<JoinRequestResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف العضو مطلوب'
      }));
    }
    if (!Number.isInteger(volunteerHours) || volunteerHours < 0 || !Number.isInteger(numberOfStudents) || numberOfStudents < 0) {
      return throwError(() => ({
        success: false,
        message: 'ساعات التطوع وعدد الطلاب يجب أن تكون أرقامًا صحيحة غير سالبة'
      }));
    }
    if (students.some(student => !student.name || !student.email || !student.phone || !this.isValidEmail(student.email))) {
      return throwError(() => ({
        success: false,
        message: 'بيانات الطلاب يجب أن تحتوي على الاسم، البريد الإلكتروني الصحيح، والهاتف'
      }));
    }
    return this.http.put<UpdateMemberDetailsResponse>(
      ApiEndpoints.joinRequests.updateMemberDetails(id),
      { volunteerHours, numberOfStudents, students, subjects },
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      map(response => ({
        success: true,
        message: response.message || 'تم تحديث تفاصيل العضو بنجاح',
        data: {
          volunteerHours: response.volunteerHours,
          numberOfStudents: response.numberOfStudents,
          students: (response.students || []).map((student: any) => ({
            name: student.name || '',
            email: student.email || '',
            phone: student.phone || '',
            grade: student.grade && student.grade.trim() ? student.grade : student.academicLevel && student.academicLevel.trim() ? student.academicLevel : 'غير محدد',
            subjects: (student.subjects || []).map((subject: any) => ({
              name: subject.name && subject.name.trim() ? subject.name : 'غير محدد',
              minLectures: Number.isInteger(subject.minLectures) ? subject.minLectures : 0
            })).filter((subject: any) => subject.name !== 'غير محدد' || subject.minLectures > 0)
          })),
          subjects: response.subjects,
          subjectsCount: response.subjects?.length || 0,
          lectureCount: response.lectureCount
        }
      })),
      catchError(error => this.handleError(error, 'تحديث تفاصيل العضو'))
    );
  }

  addStudent(
    id: string,
    name: string,
    email: string,
    phone: string,
    grade?: string,
    subjects: { name: string; minLectures: number }[] = []
  ): Observable<JoinRequestResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف العضو مطلوب'
      }));
    }
    if (!name || !email || !phone) {
      return throwError(() => ({
        success: false,
        message: 'الاسم، البريد الإلكتروني، والهاتف مطلوبة للطالب'
      }));
    }
    if (!this.isValidEmail(email)) {
      return throwError(() => ({
        success: false,
        message: 'البريد الإلكتروني للطالب غير صالح'
      }));
    }
    const payload = {
      name,
      email,
      phone,
      grade: grade && grade.trim() ? grade : undefined,
      subjects: subjects.filter(subject => subject.name && subject.name.trim() && Number.isInteger(subject.minLectures) && subject.minLectures >= 0)
    };
    return this.http.post<AddStudentResponse>(
      ApiEndpoints.joinRequests.addStudent(id),
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(response => console.log('Raw addStudent response:', JSON.stringify(response, null, 2))),
      map(response => ({
        success: true,
        message: response.message || 'تم إضافة الطالب بنجاح',
        data: {
          students: response.student ? [...(response.students || []), {
            name: response.student.name || '',
            email: response.student.email || '',
            phone: response.student.phone || '',
            grade: response.student.grade && response.student.grade.trim() ? response.student.grade : response.student.academicLevel && response.student.academicLevel.trim() ? response.student.academicLevel : 'غير محدد',
            subjects: (response.student.subjects || []).map((subject: any) => ({
              name: subject.name && subject.name.trim() ? subject.name : 'غير محدد',
              minLectures: Number.isInteger(subject.minLectures) ? subject.minLectures : 0
            })).filter((subject: any) => subject.name !== 'غير محدد' || subject.minLectures > 0)
          }] : response.students || [],
          numberOfStudents: response.numberOfStudents || 0,
          subjects: response.subjects || []
        }
      })),
      catchError(error => this.handleError(error, 'إضافة الطالب'))
    );
  }

  deleteMember(id: string): Observable<JoinRequestResponse> {
    if (!id) {
      return throwError(() => ({
        success: false,
        message: 'معرف العضو مطلوب'
      }));
    }
    return this.http.delete<DeleteMemberResponse>(
      ApiEndpoints.joinRequests.deleteMember(id),
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      map(response => ({
        success: true,
        message: response.message || 'تم حذف العضو بنجاح'
      })),
      catchError(error => this.handleError(error, 'حذف العضو'))
    );
  }

  deleteLecture(lectureId: string): Observable<JoinRequestResponse> {
    if (!lectureId || typeof lectureId !== 'string' || lectureId.trim() === '' || !/^[0-9a-fA-F]{24}$/.test(lectureId.trim())) {
      return throwError(() => ({
        success: false,
        message: 'معرف المحاضرة غير صالح: يجب أن يكون معرف MongoDB ObjectId صالحًا'
      }));
    }

    return this.http.delete<{ message: string; lectureCount: number; volunteerHours: number }>(
      ApiEndpoints.lectures.deleteLecture(lectureId),
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(response => console.log('Raw deleteLecture response:', JSON.stringify(response, null, 2))),
      map(response => ({
        success: true,
        message: response.message || 'تم حذف المحاضرة بنجاح',
        data: {
          lectureCount: response.lectureCount,
          volunteerHours: response.volunteerHours
        }
      })),
      catchError(error => this.handleError(error, 'حذف المحاضرة'))
    );
  }

  sendMessage(userId: string, content: string, displayDays: number): Observable<JoinRequestResponse> {
    if (!userId || !content || !displayDays) {
      return throwError(() => ({
        success: false,
        message: 'معرف المستخدم، الرسالة، وعدد الأيام للعرض مطلوبة'
      }));
    }
    if (content.length < 1 || content.length > 1000) {
      return throwError(() => ({
        success: false,
        message: 'الرسالة يجب أن تكون بين 1 و1000 حرف'
      }));
    }
    if (!Number.isInteger(displayDays) || displayDays < 1 || displayDays > 30) {
      return throwError(() => ({
        success: false,
        message: 'عدد الأيام يجب أن يكون عددًا صحيحًا بين 1 و30'
      }));
    }
    return this.http.post<SendMessageResponse>(
      ApiEndpoints.admin.sendMessage,
      { userId, content, displayDays },
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(response => console.log('Raw sendMessage response:', JSON.stringify(response, null, 2))),
      map(response => ({
        success: response.success,
        message: response.message || 'تم إرسال الرسالة بنجاح',
        data: response.data ? {
          _id: response.data._id,
          content: response.data.content,
          displayUntil: response.data.displayUntil
        } : undefined
      })),
      catchError(error => {
        if (error.status === 400 && error.error?.activeMessage) {
          return throwError(() => ({
            success: false,
            message: error.error.message || 'يوجد رسالة نشطة بالفعل، يرجى تعديلها أو حذفها أولاً',
            data: {
              _id: error.error.activeMessage?._id,
              content: error.error.activeMessage?.content,
              displayUntil: error.error.activeMessage?.displayUntil
            }
          }));
        }
        return this.handleError(error, 'إرسال الرسالة');
      })
    );
  }

  editMessage(userId: string, messageId: string, content: string, displayDays: number): Observable<JoinRequestResponse> {
    if (!userId || !messageId || !content || !displayDays) {
      return throwError(() => ({
        success: false,
        message: 'معرف المستخدم، معرف الرسالة، الرسالة، وعدد الأيام للعرض مطلوبة'
      }));
    }
    if (content.length < 1 || content.length > 1000) {
      return throwError(() => ({
        success: false,
        message: 'الرسالة يجب أن تكون بين 1 و1000 حرف'
      }));
    }
    if (!Number.isInteger(displayDays) || displayDays < 1 || displayDays > 30) {
      return throwError(() => ({
        success: false,
        message: 'عدد الأيام يجب أن يكون عددًا صحيحًا بين 1 و30'
      }));
    }
    return this.http.put<EditMessageResponse>(
      ApiEndpoints.admin.editMessage,
      { userId, messageId, content, displayDays },
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      map(response => ({
        success: true,
        message: response.message || 'تم تعديل الرسالة بنجاح',
        data: {
          displayUntil: response.displayUntil
        }
      })),
      catchError(error => this.handleError(error, 'تعديل الرسالة'))
    );
  }

  deleteMessage(userId: string, messageId: string): Observable<JoinRequestResponse> {
    if (!userId || !messageId) {
      return throwError(() => ({
        success: false,
        message: 'معرف المستخدم ومعرف الرسالة مطلوبان'
      }));
    }
    return this.http.delete<DeleteMessageResponse>(
      ApiEndpoints.admin.deleteMessage,
      { headers: this.getAuthHeaders(), body: { userId, messageId } }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      map(response => ({
        success: true,
        message: response.message || 'تم حذف الرسالة بنجاح'
      })),
      catchError(error => this.handleError(error, 'حذف الرسالة'))
    );
  }

  getMessage(userId: string, messageId: string): Observable<JoinRequestResponse> {
    if (!userId || !messageId) {
      return throwError(() => ({
        success: false,
        message: 'معرف المستخدم ومعرف الرسالة مطلوبان'
      }));
    }
    return this.http.get<GetMessageResponse>(
      ApiEndpoints.admin.getMessage(userId, messageId),
      { headers: this.getAuthHeaders() }
    ).pipe(
      timeout(this.REQUEST_TIMEOUT),
      tap(response => console.log('Raw getMessage response:', JSON.stringify(response, null, 2))),
      map(response => ({
        success: response.success,
        message: response.message?.content || 'تم جلب الرسالة بنجاح',
        data: response.message ? {
          _id: response.message._id,
          content: response.message.content,
          displayUntil: response.message.displayUntil
        } : undefined
      })),
      catchError(error => this.handleError(error, 'جلب الرسالة'))
    );
  }
}
