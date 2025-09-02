import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ProfileService, ProfileResponse, UserProfile, UpdatePasswordResponse } from '../../core/services/profile.service';
import { Router } from '@angular/router';
import { JoinRequestService, JoinRequest, Meeting, JoinRequestResponse } from '../../core/services/join-request.service';
import { LectureService, LectureResponse, LowLectureMembersResponse } from '../../core/services/lecture.service';
import { LectureRequestService, LectureRequestData } from '../../core/services/lecture-request.service';
import { TranslationService } from '../../core/services/translation.service';
import { AuthService } from '../../core/services/auth.service';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import { Toast as BootstrapToast } from 'bootstrap';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  source?: string;
}

interface MeetingData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Student {
  id?: string;
  name: string;
  email: string;
  phone: string;
  grade?: string;
  subjects: { name: string; minLectures: number }[];
}

interface UploadImageResponse {
  success: boolean;
  data?: { profileImage: string };
  message?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FullCalendarModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profile: JoinRequest | null = null;
  activeMessage: { _id: string; content: string; createdAt: string; displayUntil: string } | null = null;
  toasts: Toast[] = [];
  lectureForm: FormGroup;
  pdfRequestForm: FormGroup;
  meetingForm: FormGroup;
  isUploadingLecture = false;
  isUploadingPdfRequest = false;
  isAddingMeeting = false;
  currentPassword = '';
  newPassword = '';
  showPasswordModal = false;
  errorCode: string | null = null;
  showMeetingModal = false;
  selectedFile: File | null = null;
  selectedPdfFile: File | null = null;
  isUploading = false;
  showUploadField = false;
  activeSection = 'profile';
  isDeletingMeeting: { [key: string]: boolean } = {};
  showLectureWarning = false;
  lowLectureWeekCount = 0;
  private submitSubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  private isInitialLoad = true;

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    events: [],
    eventClick: this.handleEventClick.bind(this),
    dateClick: this.handleDateClick.bind(this),
    locale: 'ar',
    direction: 'rtl',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: 'اليوم',
      month: 'شهر',
      week: 'أسبوع',
      day: 'يوم'
    }
  };

  subjectKeys = [
    'islamic_education',
    'arabic',
    'mathematics',
    'life_sciences',
    'social_studies',
    'art_education',
    'physical_education',
    'music_education',
    'english',
    'national_civic_education',
    'technology',
    'media_education',
    'history_of_jordan',
    'financial_literacy',
    'digital_skills',
    'physics',
    'chemistry',
    'biology',
    'earth_environmental_sciences',
    'philosophy',
    'geography',
    'computer_science'
  ];

  subjectsTranslations = {
    ar: [
      'التربية الإسلامية',
      'اللغة العربية',
      'الرياضيات',
      'العلوم الحياتية',
      'الدراسات الاجتماعية',
      'التربية الفنية',
      'التربية الرياضية',
      'التربية الموسيقية',
      'اللغة الإنجليزية',
      'التربية الوطنية والمدنية',
      'التكنولوجيا',
      'التربية الإعلامية',
      'تاريخ الأردن',
      'الثقافة المالية',
      'المهارات الرقمية',
      'الفيزياء',
      'الكيمياء',
      'الأحياء',
      'علوم الأرض والبيئة',
      'الفلسفة',
      'الجغرافيا',
      'حاسوب'
    ],
    en: [
      'Islamic Education',
      'Arabic Language',
      'Mathematics',
      'Life Sciences',
      'Social Studies',
      'Art Education',
      'Physical Education',
      'Music Education',
      'English Language',
      'National and Civic Education',
      'Technology',
      'Media Education',
      'History of Jordan',
      'Financial Literacy',
      'Digital Skills',
      'Physics',
      'Chemistry',
      'Biology',
      'Earth and Environmental Sciences',
      'Philosophy',
      'Geography',
      'Computer Science'
    ]
  };

  semesters = ['الفصل الأول', 'الفصل الثاني'];
  countries = ['الأردن', 'فلسطين'];
  academicLevels = [
    'أول',
    'ثاني',
    'ثالث',
    'رابع',
    'خامس',
    'سادس',
    'سابع',
    'ثامن',
    'تاسع',
    'عاشر',
    'أول ثانوي',
    'ثانوي (توجيهي)'
  ];

  constructor(
    private profileService: ProfileService,
    private joinRequestService: JoinRequestService,
    private lectureService: LectureService,
    private lectureRequestService: LectureRequestService,
    public translationService: TranslationService,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.lectureForm = this.fb.group({
      studentEmail: ['', [Validators.required, Validators.email, this.studentEmailValidator.bind(this)]],
      subject: ['', [Validators.required, this.subjectValidator.bind(this)]],
      date: ['', [Validators.required, this.dateValidator.bind(this)]],
      duration: ['', [Validators.required, Validators.min(1), Validators.max(180), Validators.pattern(/^[1-9]\d*$/)]],
      link: ['', [Validators.required, Validators.pattern(/^https?:\/\/[^\s/$.?#].[^\s]*$/)]],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]]
    });

    this.pdfRequestForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      creatorName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      subject: ['', [Validators.required]],
      semester: ['', [Validators.required]],
      country: ['', [Validators.required]],
      academicLevel: ['', [Validators.required]]
    });

    this.meetingForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      date: ['', [Validators.required]],
      startTime: ['', [Validators.required, Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)]],
      endTime: ['', [Validators.required, Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)]]
    }, { validators: this.meetingFormValidator.bind(this) });
  }

  ngOnInit(): void {
    this.toasts = [];
    if (!this.validateAuth()) {
      return;
    }
    this.loadProfile();
    this.submitSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('ProfileComponent: Submitting lecture...');
      this.uploadLecture();
    });
    this.isInitialLoad = false;
  }

  ngOnDestroy(): void {
    this.toasts = [];
    this.submitSubject.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private validateAuth(): boolean {
    const userId = this.authService.getUserId();
    const token = this.authService.getToken();
    console.log('ProfileComponent: Validating auth:', { userId, token });
    if (!token || !userId || !this.authService.isLoggedIn()) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }

  studentEmailValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!this.profile?.students?.some(student => student.email === control.value)) {
      return { invalidStudent: true };
    }
    return null;
  }

  subjectValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!this.subjectKeys.includes(control.value)) {
      return { invalidSubject: true };
    }
    return null;
  }

  dateValidator(control: AbstractControl): { [key: string]: any } | null {
    const date = control.value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    const inputDate = new Date(date);

    if (date && (inputDate < today || inputDate > maxDate)) {
      return { invalidDate: true };
    }
    return null;
  }

  meetingFormValidator(form: FormGroup): { [key: string]: any } | null {
    const date = form.get('date')?.value;
    const startTime = form.get('startTime')?.value;
    const endTime = form.get('endTime')?.value;
    const today = new Date().toISOString().split('T')[0];

    if (date && date < today) {
      return { invalidDate: true };
    }

    if (startTime && endTime && startTime >= endTime) {
      return { invalidTimeOrder: true };
    }

    return null;
  }

  getTranslatedSubjects(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    return this.subjectsTranslations[currentLang as keyof typeof this.subjectsTranslations] || this.subjectsTranslations.en;
  }

  getTranslatedSemesters(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    return currentLang === 'en' ? ['First Semester', 'Second Semester'] : this.semesters;
  }

  getTranslatedCountries(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    return currentLang === 'en' ? ['Jordan', 'Palestine'] : this.countries;
  }

  getTranslatedAcademicLevels(): string[] {
    const currentLang = this.translationService.getCurrentLanguage();
    return currentLang === 'en'
      ? ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'First Secondary', 'Secondary (Tawjihi)']
      : this.academicLevels;
  }

  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().split('T')[0];
  }

  getMinDateTime(): string {
    return new Date().toISOString().slice(0, 16);
  }

  getMaxDateTime(): string {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().slice(0, 16);
  }

  getStudentSubjects(student: Student): string {
    if (!student.subjects || student.subjects.length === 0) {
      return this.translationService.translate('profile.notSpecified') || 'غير محدد';
    }
    const currentLang = this.translationService.getCurrentLanguage();
    const translations = this.subjectsTranslations[currentLang as keyof typeof this.subjectsTranslations] || this.subjectsTranslations.en;
    return student.subjects.map(subject => {
      const index = this.subjectKeys.indexOf(subject.name);
      return index !== -1 ? translations[index] : subject.name;
    }).join(', ');
  }

  private showToast(type: 'success' | 'error' | 'info', titleKey: string, messageKey: string, source: string): void {
    // Suppress toasts during initial load
    if (this.isInitialLoad) {
      console.log(`ProfileComponent: Suppressing toast during initial load (source: ${source}):`, { type, titleKey, messageKey });
      return;
    }

    // Only show toasts for specified operations
    const allowedSources = [
      'onFileSelected',
      'onPdfFileSelected',
      'uploadProfileImage',
      'onSubmitLecture',
      'uploadLecture',
      'uploadPdfRequest',
      'changePassword',
      'navigateToForgotPassword',
      'addMeeting',
      'deleteMeeting'
    ];

    if (!allowedSources.includes(source)) {
      console.log(`ProfileComponent: Suppressing toast for non-allowed source: ${source}`);
      return;
    }

    // Helper function to resolve nested translation keys in Arabic
    const resolveTranslation = (key: string): string => {
      try {
        const translation = this.translationService.translate(key);
        if (!translation || translation === key) {
          console.warn(`ProfileComponent: Translation missing for key: ${key}`);
          // Provide Arabic fallback messages based on type and key
          switch (type) {
            case 'success':
              return {
                'profile.imageUploadedSuccess': 'تم تحميل الصورة بنجاح',
                'profile.lectureUploadedSuccess': 'تم تحميل المحاضرة بنجاح',
                'profile.pdfRequestSubmittedSuccess': 'تم إرسال طلب PDF بنجاح',
                'profile.passwordChangedSuccess': 'تم تغيير كلمة المرور بنجاح',
                'profile.meetingAddedSuccess': 'تم إضافة الاجتماع بنجاح',
                'profile.meetingDeletedSuccess': 'تم حذف الاجتماع بنجاح',
                'profile.fileSelectedSuccess': 'تم اختيار الملف بنجاح',
                'profile.pdfFileSelectedSuccess': 'تم اختيار ملف PDF بنجاح'
              }[key] || 'تمت العملية بنجاح';
            case 'error':
              return {
                'profile.fileSizeError': 'حجم الملف كبير جدًا',
                'profile.invalidFileType': 'نوع الملف غير صالح',
                'profile.noFileSelected': 'لم يتم اختيار ملف',
                'profile.pdfFileSizeError': 'حجم ملف PDF كبير جدًا',
                'profile.invalidPdfFileType': 'نوع ملف PDF غير صالح',
                'profile.formInvalid': 'النموذج غير صالح',
                'profile.noStudentsAvailable': 'لا يوجد طلاب متاحون',
                'profile.invalidStudent': 'الطالب غير صالح',
                'profile.invalidSubject': 'المادة غير صالحة',
                'profile.invalidDate': 'التاريخ غير صالح',
                'profile.invalidDuration': 'المدة غير صالحة',
                'profile.imageUploadFailed': 'فشل تحميل الصورة',
                'profile.lectureUploadFailed': 'فشل تحميل المحاضرة',
                'profile.pdfRequestFailed': 'فشل إرسال طلب PDF',
                'profile.missing_fields': 'الحقول مفقودة',
                'profile.same_password': 'كلمة المرور الجديدة مطابقة للقديمة',
                'profile.validation.password.minlength': 'كلمة المرور قصيرة جدًا',
                'profile.password_change_error': 'فشل تغيير كلمة المرور',
                'profile.unauthorizedError': 'غير مصرح',
                'profile.invalidRequest': 'طلب غير صالح',
                'profile.serverError': 'خطأ في الخادم',
                'profile.networkError': 'خطأ في الشبكة',
                'profile.invalidMeetingId': 'معرف الاجتماع غير صالح',
                'profile.meetingAddFailed': 'فشل إضافة الاجتماع',
                'profile.meetingDeleteFailed': 'فشل حذف الاجتماع'
              }[key] || 'حدث خطأ. يرجى المحاولة مرة أخرى';
            case 'info':
              return {
                'profile.navigateToForgotPassword': 'تم التوجيه إلى صفحة نسيت كلمة المرور',
                'profile.changeImageOpened': 'تم فتح قسم تغيير الصورة',
                'profile.changeImageClosed': 'تم إغلاق قسم تغيير الصورة',
                'profile.meetingDetails': 'تفاصيل الاجتماع'
              }[key] || 'معلومات';
            default:
              return key;
          }
        }
        return translation;
      } catch (err) {
        console.error(`ProfileComponent: Error resolving translation for key: ${key}`, err);
        return key;
      }
    };

    const title = resolveTranslation(titleKey) || (type === 'success' ? 'نجاح' : type === 'error' ? 'خطأ' : 'معلومات');
    const message = resolveTranslation(messageKey) || messageKey;

    if (!message || message.trim() === '') {
      console.error(`ProfileComponent: Message is empty (source: ${source})`, { messageKey, message });
      return;
    }

    // Check for duplicate toasts
    if (this.toasts.some(toast => toast.message === message && toast.source === source && toast.type === type)) {
      console.log(`ProfileComponent: Ignoring duplicate toast (source: ${source}):`, { type, title, message });
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    this.toasts = [...this.toasts, { id, type, title, message, source }];

    const showToastWithRetry = (attempts: number = 3, delay: number = 200): void => {
      setTimeout(() => {
        const toastElement = document.querySelector(`.toast[id="${id}"]`);
        if (toastElement) {
          const bootstrapToast = new BootstrapToast(toastElement, {
            autohide: true,
            delay: 5000
          });
          toastElement.addEventListener('hidden.bs.toast', () => {
            this.closeToast(id);
          });
          bootstrapToast.show();
        } else if (attempts > 0) {
          console.warn(`ProfileComponent: Toast element not found for ID: ${id}, retrying (${attempts} attempts left)`);
          showToastWithRetry(attempts - 1, delay * 2);
        } else {
          console.error(`ProfileComponent: Failed to find toast element for ID: ${id} after retries`);
          this.closeToast(id);
        }
      }, delay);
    };

    showToastWithRetry();
  }

  closeToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  loadProfile(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    this.profileService.getProfile().subscribe({
      next: (response: JoinRequestResponse) => {
        console.log('ProfileComponent: Profile load response:', JSON.stringify(response, null, 2));
        if (response.success && response.data) {
          this.profile = this.processProfileData(response.data);
          this.pdfRequestForm.patchValue({
            creatorName: this.profile.name || (this.translationService.translate('profile.notSpecified') || 'غير محدد')
          });
          this.setActiveMessage();
          this.showUploadField = !this.profile.profileImage;
          if (this.profile.students.length) {
            this.lectureForm.enable();
          } else {
            this.lectureForm.disable();
          }
          this.loadLowLectureMembers();
          this.updateCalendarEvents();
        } else if (response.message && !this.isInitialLoad) {
          // Only show error toast if not initial load and there's an error
          this.showToast('error', 'profile.error', response.message === 'no_token' || response.message === 'invalid_headers'
            ? 'profile.unauthorizedError'
            : 'profile.loadError', 'loadProfile');
        }
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error loading profile:', err);
        if (err.error === 'no_token' || err.error === 'invalid_headers' || err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  private processProfileData(member: JoinRequest): JoinRequest {
    const isRtl = this.translationService.isRtl();
    const locale = isRtl ? 'ar-EG' : 'en-US';
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    return {
      ...member,
      id: member.id || '',
      createdAt: member.createdAt ? new Date(member.createdAt).toLocaleDateString(locale, dateOptions) : new Date().toLocaleDateString(locale, dateOptions),
      lectureCount: member.lectureCount || 0,
      lectures: member.lectures || [],
      students: (member.students || []).map((student: Student) => ({
        ...student,
        id: student.id || '',
        name: student.name || this.translationService.translate('profile.notSpecified') || 'غير محدد',
        email: student.email || this.translationService.translate('profile.notSpecified') || 'غير محدد',
        phone: student.phone || this.translationService.translate('profile.notSpecified') || 'غير محدد',
        grade: student.grade || this.translationService.translate('profile.notSpecified') || 'غير محدد',
        subjects: (student.subjects || []).map((subject: { name: string; minLectures: number }) => ({
          name: subject.name || this.translationService.translate('profile.notSpecified') || 'غير محدد',
          minLectures: subject.minLectures ?? 0
        }))
      })),
      meetings: (member.meetings || []).map((meeting: Meeting, index: number) => ({
        id: meeting.id || meeting._id || `meeting-${index}-${Date.now()}`,
        title: meeting.title || this.translationService.translate('profile.notSpecified') || 'غير محدد',
        date: typeof meeting.date === 'string' ? meeting.date : new Date(meeting.date).toISOString().split('T')[0],
        startTime: meeting.startTime || '',
        endTime: meeting.endTime || ''
      })),
      messages: (member.messages || []).map((message: any) => ({
        _id: message._id || '',
        content: message.content || '',
        createdAt: message.createdAt || new Date().toISOString(),
        displayUntil: message.displayUntil || new Date().toISOString()
      }))
    };
  }

  private setActiveMessage(): void {
    if (this.profile?.messages) {
      const activeMessages = this.profile.messages.filter(
        msg => new Date(msg.displayUntil) > new Date()
      );
      this.activeMessage = activeMessages.length > 0 ? activeMessages[0] : null;
    }
  }

  private updateCalendarEvents(): void {
    if (this.profile?.meetings) {
      this.calendarOptions = {
        ...this.calendarOptions,
        events: this.profile.meetings.map(meeting => ({
          id: meeting.id,
          title: meeting.title,
          start: `${meeting.date}T${meeting.startTime}`,
          end: `${meeting.date}T${meeting.endTime}`
        }))
      };
    }
  }

  loadLowLectureMembers(): void {
    this.lectureService.getLowLectureMembers().subscribe({
      next: (response: LowLectureMembersResponse) => {
        console.log('ProfileComponent: Low lecture members response:', JSON.stringify(response, null, 2));
        if (response.success) {
          const userId = this.authService.getUserId();
          const memberData = response.members.find(m => m.id === userId);
          this.showLectureWarning = !!memberData && memberData.underTargetStudents.length > 0;
          this.lowLectureWeekCount = memberData?.lowLectureWeekCount || 0;
        }
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error loading low lecture members:', err);
      }
    });
  }

  private getErrorMessage(err: any): string {
    if (err.status === 401 || err.error === 'no_token' || err.error === 'invalid_headers') {
      return 'profile.unauthorizedError';
    } else if (err.status === 400) {
      return err.error?.message || 'profile.invalidRequest';
    } else if (err.status === 500) {
      return 'profile.serverError';
    }
    return 'profile.networkError';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 10 * 1024 * 1024) {
        this.showToast('error', 'profile.error', 'profile.fileSizeError', 'onFileSelected');
        this.selectedFile = null;
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        this.showToast('error', 'profile.error', 'profile.invalidFileType', 'onFileSelected');
        this.selectedFile = null;
        return;
      }
      this.selectedFile = file;
      this.showToast('success', 'profile.success', 'profile.fileSelectedSuccess', 'onFileSelected');
    } else {
      this.selectedFile = null;
      this.showToast('error', 'profile.error', 'profile.noFileSelected', 'onFileSelected');
    }
  }

  onPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 20 * 1024 * 1024) {
        this.showToast('error', 'profile.error', 'profile.pdfFileSizeError', 'onPdfFileSelected');
        this.selectedPdfFile = null;
        return;
      }
      if (file.type !== 'application/pdf') {
        this.showToast('error', 'profile.error', 'profile.invalidPdfFileType', 'onPdfFileSelected');
        this.selectedPdfFile = null;
        return;
      }
      this.selectedPdfFile = file;
      this.showToast('success', 'profile.success', 'profile.pdfFileSelectedSuccess', 'onPdfFileSelected');
    } else {
      this.selectedPdfFile = null;
      this.showToast('error', 'profile.error', 'profile.noFileSelected', 'onPdfFileSelected');
    }
  }

  uploadProfileImage(): void {
    if (!this.selectedFile) {
      this.showToast('error', 'profile.error', 'profile.noFileSelected', 'uploadProfileImage');
      return;
    }

    this.isUploading = true;
    this.profileService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response: UploadImageResponse) => {
        if (response.success && response.data) {
          if (this.profile) {
            this.profile.profileImage = response.data.profileImage;
          }
          this.showUploadField = false;
          this.selectedFile = null;
          this.showToast('success', 'profile.success', 'profile.imageUploadedSuccess', 'uploadProfileImage');
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.imageUploadFailed', 'uploadProfileImage');
        }
        this.isUploading = false;
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error uploading profile image:', err);
        this.showToast('error', 'profile.error', this.getErrorMessage(err), 'uploadProfileImage');
        this.isUploading = false;
      }
    });
  }

  changeImage(): void {
    this.showUploadField = !this.showUploadField;
    this.showToast('info', 'profile.info', this.showUploadField ? 'profile.changeImageOpened' : 'profile.changeImageClosed', 'changeImage');
  }

  onSubmitLecture(): void {
    if (this.lectureForm.invalid) {
      this.lectureForm.markAllAsTouched();
      this.showToast('error', 'profile.error', 'profile.formInvalid', 'onSubmitLecture');
      return;
    }
    if (!this.profile?.students?.length) {
      this.showToast('error', 'profile.error', 'profile.noStudentsAvailable', 'onSubmitLecture');
      return;
    }
    this.submitSubject.next();
  }

  uploadLecture(): void {
    if (!this.profile?.students?.length) {
      this.showToast('error', 'profile.error', 'profile.noStudentsAvailable', 'uploadLecture');
      this.isUploadingLecture = false;
      return;
    }

    const lectureData = this.lectureForm.value;
    const { studentEmail, subject, date, duration, link, name } = lectureData;

    const selectedStudent = this.profile.students.find(student => student.email === studentEmail);
    if (!selectedStudent) {
      this.showToast('error', 'profile.error', 'profile.invalidStudent', 'uploadLecture');
      this.isUploadingLecture = false;
      return;
    }
    if (!this.subjectKeys.includes(subject)) {
      this.showToast('error', 'profile.error', 'profile.invalidSubject', 'uploadLecture');
      this.isUploadingLecture = false;
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    const inputDate = new Date(date);
    if (inputDate < today || inputDate > maxDate) {
      this.showToast('error', 'profile.error', 'profile.invalidDate', 'uploadLecture');
      this.isUploadingLecture = false;
      return;
    }
    if (duration < 1 || duration > 180) {
      this.showToast('error', 'profile.error', 'profile.invalidDuration', 'uploadLecture');
      this.isUploadingLecture = false;
      return;
    }

    const lectureDate = new Date(date).toISOString();
    const durationInHours = duration / 60;

    this.isUploadingLecture = true;
    this.lectureService.uploadLecture(studentEmail, subject, link, name, lectureDate, durationInHours).subscribe({
      next: (response: LectureResponse) => {
        if (response.success) {
          this.lectureForm.reset();
          Object.keys(this.lectureForm.controls).forEach(key => {
            this.lectureForm.get(key)?.setErrors(null);
            this.lectureForm.get(key)?.markAsUntouched();
          });
          this.loadProfile();
          this.showToast('success', 'profile.success', 'profile.lectureUploadedSuccess', 'uploadLecture');
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.lectureUploadFailed', 'uploadLecture');
        }
        this.isUploadingLecture = false;
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error uploading lecture:', err);
        this.showToast('error', 'profile.error', this.getErrorMessage(err), 'uploadLecture');
        this.isUploadingLecture = false;
      }
    });
  }

  uploadPdfRequest(): void {
    if (this.pdfRequestForm.invalid) {
      this.pdfRequestForm.markAllAsTouched();
      this.showToast('error', 'profile.error', 'profile.formInvalid', 'uploadPdfRequest');
      return;
    }
    if (!this.selectedPdfFile) {
      this.showToast('error', 'profile.error', 'profile.noFileSelected', 'uploadPdfRequest');
      return;
    }

    const pdfRequestData: LectureRequestData = this.pdfRequestForm.value;

    this.isUploadingPdfRequest = true;
    this.lectureRequestService.uploadLectureRequest(pdfRequestData, this.selectedPdfFile).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.pdfRequestForm.reset();
          Object.keys(this.pdfRequestForm.controls).forEach(key => {
            this.pdfRequestForm.get(key)?.setErrors(null);
            this.pdfRequestForm.get(key)?.markAsUntouched();
          });
          this.selectedPdfFile = null;
          this.showToast('success', 'profile.success', 'profile.pdfRequestSubmittedSuccess', 'uploadPdfRequest');
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.pdfRequestFailed', 'uploadPdfRequest');
        }
        this.isUploadingPdfRequest = false;
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error uploading PDF request:', err);
        this.showToast('error', 'profile.error', this.getErrorMessage(err), 'uploadPdfRequest');
        this.isUploadingPdfRequest = false;
      }
    });
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.currentPassword = '';
    this.newPassword = '';
    this.errorCode = null;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.currentPassword = '';
    this.newPassword = '';
    this.errorCode = null;
  }

  changePassword(): void {
    if (!this.currentPassword || !this.newPassword) {
      this.errorCode = 'missing_fields';
      this.showToast('error', 'profile.error', 'profile.missing_fields', 'changePassword');
      return;
    }
    if (this.currentPassword === this.newPassword) {
      this.errorCode = 'same_password';
      this.showToast('error', 'profile.error', 'profile.same_password', 'changePassword');
      return;
    }
    if (this.newPassword.length < 6) {
      this.errorCode = 'password_too_short';
      this.showToast('error', 'profile.error', 'profile.validation.password.minlength', 'changePassword');
      return;
    }

    this.profileService.updatePassword(this.currentPassword, this.newPassword).subscribe({
      next: (response: UpdatePasswordResponse) => {
        if (response.success) {
          this.showToast('success', 'profile.success', 'profile.passwordChangedSuccess', 'changePassword');
          this.closePasswordModal();
        } else {
          this.errorCode = response.message || 'profile.password_change_error';
          this.showToast('error', 'profile.error', this.errorCode, 'changePassword');
        }
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error changing password:', err);
        this.errorCode = this.getErrorMessage(err);
        this.showToast('error', 'profile.error', this.errorCode, 'changePassword');
        if (err.status === 401 || err.error === 'no_token' || err.error === 'invalid_headers') {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  navigateToForgotPassword(): void {
    this.closePasswordModal();
    this.router.navigate(['/forgot-password']);
    this.showToast('info', 'profile.info', 'profile.navigateToForgotPassword', 'navigateToForgotPassword');
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  openMeetingModal(date: string = ''): void {
    this.showMeetingModal = true;
    this.meetingForm.reset();
    if (date) {
      this.meetingForm.patchValue({ date });
    }
  }

  closeMeetingModal(): void {
    this.showMeetingModal = false;
    this.meetingForm.reset();
    this.isAddingMeeting = false;
  }

  addMeeting(): void {
    if (this.meetingForm.invalid) {
      this.meetingForm.markAllAsTouched();
      this.showToast('error', 'profile.error', 'profile.formInvalid', 'addMeeting');
      return;
    }

    const { title, date, startTime, endTime } = this.meetingForm.value;

    this.isAddingMeeting = true;
    this.profileService.addMeeting(title, date, startTime, endTime).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showToast('success', 'profile.success', 'profile.meetingAddedSuccess', 'addMeeting');
          this.closeMeetingModal();
          this.loadProfile();
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.meetingAddFailed', 'addMeeting');
        }
        this.isAddingMeeting = false;
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error adding meeting:', err);
        this.showToast('error', 'profile.error', this.getErrorMessage(err), 'addMeeting');
        this.isAddingMeeting = false;
      }
    });
  }

  deleteMeeting(meetingId: string): void {
    if (!meetingId) {
      this.showToast('error', 'profile.error', 'profile.invalidMeetingId', 'deleteMeeting');
      return;
    }

    this.isDeletingMeeting[meetingId] = true;
    this.profileService.deleteMeeting(meetingId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showToast('success', 'profile.success', 'profile.meetingDeletedSuccess', 'deleteMeeting');
          this.loadProfile();
        } else {
          this.showToast('error', 'profile.error', response.message || 'profile.meetingDeleteFailed', 'deleteMeeting');
        }
        this.isDeletingMeeting[meetingId] = false;
      },
      error: (err: any) => {
        console.error('ProfileComponent: Error deleting meeting:', err);
        this.showToast('error', 'profile.error', this.getErrorMessage(err), 'deleteMeeting');
        this.isDeletingMeeting[meetingId] = false;
      }
    });
  }

  handleEventClick(arg: EventClickArg): void {
    const meetingId = arg.event.id;
    const meeting = this.profile?.meetings.find(m => m.id === meetingId);
    if (meeting) {
      this.showToast('info', 'profile.meetingDetails', `${meeting.title}: ${meeting.date} ${meeting.startTime}-${meeting.endTime}`, 'handleEventClick');
    }
  }

  handleDateClick(arg: DateClickArg): void {
    const selectedDate = arg.date.toISOString().split('T')[0];
    this.openMeetingModal(selectedDate);
  }
}
