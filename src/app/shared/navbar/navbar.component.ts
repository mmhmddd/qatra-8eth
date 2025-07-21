import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isNavbarExpanded = false;

  toggleNavbar() {
    this.isNavbarExpanded = !this.isNavbarExpanded;
    console.log('Navbar toggled, isNavbarExpanded:', this.isNavbarExpanded); // Debugging
  }

  closeNavbar() {
    this.isNavbarExpanded = false;
    console.log('Navbar closed, isNavbarExpanded:', this.isNavbarExpanded); // Debugging
  }
}