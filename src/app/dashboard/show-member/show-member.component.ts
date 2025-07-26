import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { JoinRequest, JoinRequestService } from '../../core/services/join-request.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-show-member',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule,SidebarComponent],
  templateUrl: './show-member.component.html',
  styleUrls: ['./show-member.component.scss']
})
export class ShowMemberComponent implements OnInit, OnDestroy {
  member: JoinRequest | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;
  isSaving = false;
  isSaveError = false;
  isEditingHours = false;
  newVolunteerHours: number = 0;
  private destroy$ = new Subject<void>();
isSidebarVisible: any;

  constructor(
    private joinRequestService: JoinRequestService,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.fetchMember();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isSidebarVisible = window.innerWidth > 1024;
    } else {
      this.isSidebarVisible = true;
    }
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  fetchMember(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.isSaveError = false;

    const memberId = this.route.snapshot.paramMap.get('id');
    if (memberId) {
      this.joinRequestService.getMember(memberId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (member) => {
            this.member = member;
            this.newVolunteerHours = member.volunteerHours || 0;
            this.errorMessage = null;
            this.isLoading = false;
          },
          error: (error) => {
            this.errorMessage = error.message || 'خطأ في جلب تفاصيل العضو. الرجاء التحقق من اتصال الشبكة أو معرف العضو.';
            this.isLoading = false;
            console.error('Error fetching member:', error);
          }
        });
    } else {
      this.errorMessage = 'لم يتم العثور على معرف العضو';
      this.isLoading = false;
    }
  }

  toggleEditHours(): void {
    this.isEditingHours = !this.isEditingHours;
    if (this.isEditingHours && this.member) {
      this.newVolunteerHours = this.member.volunteerHours || 0;
    }
    this.successMessage = null;
    this.errorMessage = null;
    this.isSaveError = false;
  }

  saveVolunteerHours(): void {
    if (this.member && this.member._id) {
      this.isSaving = true;
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;
      this.isSaveError = false;

      this.joinRequestService.updateVolunteerHours(this.member._id, this.newVolunteerHours)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.successMessage = 'تم تحديث ساعات التطوع بنجاح';
            this.isEditingHours = false;
            this.isSaving = false;
            this.isLoading = false;
            this.fetchMember(); // Refresh member data
          },
          error: (error) => {
            this.errorMessage = error.message || 'خطأ في تحديث ساعات التطوع. الرجاء التحقق من اتصال الشبكة أو المحاولة لاحقًا.';
            this.isSaveError = true;
            this.isSaving = false;
            this.isLoading = false;
            console.error('Error updating volunteer hours:', error);
          }
        });
    }
  }

  retryAction(): void {
    if (this.isSaveError) {
      this.saveVolunteerHours();
    } else {
      this.fetchMember();
    }
  }
}