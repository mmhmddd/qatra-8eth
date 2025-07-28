import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { JoinRequestService } from '../../core/services/join-request.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isSidebarCollapsed = false;
  activeNavIndex = 0;
  joinRequestsCount: number = 0;
  membersCount: number = 0;
  error: string | null = null;

  navItems = [
    { label: 'عرض جميع الأعضاء', icon: 'fas fa-users', link: '/all-join-request' },
    { label: 'عرض جميع الطلبات', icon: 'fas fa-file-alt', link: '/requests' },
    { label: 'إضافة عضو', icon: 'fas fa-user-plus', link: '/add-member' },
    { label: 'حذف عضو', icon: 'fas fa-user-minus', link: '/delete-member' },
    { label: 'إضافة كتاب', icon: 'fas fa-book', link: '/add-book' }
  ];

  constructor(
    private router: Router,
    private joinRequestService: JoinRequestService
  ) {
    // Set active nav based on current route
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;
      this.activeNavIndex = this.navItems.findIndex(item => item.link === currentRoute);
    });
  }

  ngOnInit(): void {
    this.loadCounts();
  }

  loadCounts(): void {
    // Get number of join requests
    this.joinRequestService.getAll().subscribe({
      next: (requests) => {
        this.joinRequestsCount = requests.length;
      },
      error: (err) => {
        this.error = err.message || 'فشل في جلب عدد طلبات الانضمام';
        console.error('Error fetching join requests:', err);
      }
    });

    // Get number of approved members
    this.joinRequestService.getApprovedMembers().subscribe({
      next: (members) => {
        this.membersCount = members.length;
      },
      error: (err) => {
        this.error = err.message || 'فشل في جلب عدد الأعضاء المعتمدين';
        console.error('Error fetching approved members:', err);
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  setActiveNav(index: number): void {
    this.activeNavIndex = index;
  }

  navigateTo(link: string): void {
    this.router.navigate([link]);
  }
}