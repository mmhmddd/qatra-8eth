import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isSidebarCollapsed = false;
  activeNavIndex = 0;

  navItems = [
    { label: 'عرض جميع الأعضاء', icon: 'fas fa-users', link: '/all-members' },
    { label: 'عرض جميع الطلبات', icon: 'fas fa-file-alt', link: '/all-join-request' },
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
