import { Component, OnInit, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { Router, NavigationEnd, NavigationStart, Event } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { SeoService } from './core/services/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'qatra-8eth';
  isDashboardRoute = false;
  showLoader = false;
  private loaderTimeout: any;

  constructor(
    private router: Router,
    private seoService: SeoService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    // Initialize SeoService
    this.seoService.init();

    // Define dashboard routes
    const dashboardRoutes = [
      '/dashboard',
      '/all-join-request',
      '/all-members',
      '/upload-pdf',
      '/add-testimonials',
      '/add-leaderboards',
      '/add-gallery',
      '/low-lecture-members',
      '/lectures-request',
      '/join-massege',
      '/statistics',
      '/library',
      '/drive-lecture',
      '/login'
    ];

    // Monitor route changes
    this.router.events.pipe(
      filter((event: Event): event is NavigationStart | NavigationEnd =>
        event instanceof NavigationStart || event instanceof NavigationEnd)
    ).subscribe((event: NavigationStart | NavigationEnd) => {
      if (event instanceof NavigationStart) {
        // Clear any existing timeout
        if (this.loaderTimeout) {
          clearTimeout(this.loaderTimeout);
        }

        const url = event.url;
        // Check if the route is a dashboard route
        const isDashboard = dashboardRoutes.some(route => url.startsWith(route)) ||
                           /^\/member\/[^\/]+$/.test(url);

        // Show loader only for non-dashboard routes
        if (!isDashboard) {
          this.showLoader = true;
          this.loaderTimeout = setTimeout(() => {
            this.showLoader = false;
          }, 800);
        } else {
          this.showLoader = false; // Ensure loader is not shown for dashboard routes
        }
      } else if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;

        // Check if the current route is a dashboard route
        this.isDashboardRoute = dashboardRoutes.some(route => url.startsWith(route)) ||
                               /^\/member\/[^\/]+$/.test(url);

        // Add/remove noindex based on page type
        if (this.isDashboardRoute) {
          this.seoService.setNoIndex();
        } else {
          this.seoService.removeNoIndex();
        }

        console.log('Current route:', url, 'isDashboardRoute:', this.isDashboardRoute);
      }
    });
  }
}
