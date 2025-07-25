import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule ,SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  isSidebarCollapsed = false;
  activeNavIndex = 0;

  navItems = [
    { label: 'عرض جميع الأعضاء', icon: 'fas fa-users', link: '/all-join-request' },
    { label: 'عرض جميع الطلبات', icon: 'fas fa-file-alt', link: '/requests' },
    { label: 'إضافة عضو', icon: 'fas fa-user-plus', link: '/add-member' },
    { label: 'حذف عضو', icon: 'fas fa-user-minus', link: '/delete-member' }
  ];

  constructor(private router: Router) {
    // Set active nav based on current route
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;
      this.activeNavIndex = this.navItems.findIndex(item => item.link === currentRoute);
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  setActiveNav(index: number) {
    this.activeNavIndex = index;
  }
}