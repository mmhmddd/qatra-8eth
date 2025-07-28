import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { JoinRequest, JoinRequestService } from '../../core/services/join-request.service';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

@Component({
  selector: 'app-all-members',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './all-members.component.html',
  styleUrls: ['./all-members.component.scss']
})
export class AllMembersComponent implements OnInit, OnDestroy {
  approvedMembers: JoinRequest[] = [];
  errorMessage: string | null = null;
  isLoading = false;
  isSidebarVisible = true;
  private destroy$ = new Subject<void>();

  constructor(
    private joinRequestService: JoinRequestService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.fetchApprovedMembers();
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

  fetchApprovedMembers(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.joinRequestService.getApprovedMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (members) => {
          this.approvedMembers = members;
          this.errorMessage = null;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'خطأ في جلب الأعضاء المعتمدين';
          this.isLoading = false;
          console.error('Error fetching approved members:', error);
        }
      });
  }

  retryFetch(): void {
    this.fetchApprovedMembers();
  }

  trackByMemberId(index: number, member: JoinRequest): any {
    return member.id || index;
  }
}