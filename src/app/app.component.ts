import { Component, OnInit, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { Router, NavigationEnd, Event } from '@angular/router';
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

  constructor(
    private router: Router,
    private seoService: SeoService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    // تهيئة SeoService
    this.seoService.init();

    // مراقبة تغييرات الـ route لتحديد ما إذا كانت صفحة dashboard
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;

      // تحسين منطق التحقق من الـ dashboard routes
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
        '/drive-lecture',
        '/login'
      ];

      this.isDashboardRoute =
        dashboardRoutes.some(route => url.startsWith(route)) ||
        /^\/member\/[^\/]+$/.test(url);

      // إضافة/إزالة noindex بناءً على نوع الصفحة
      if (this.isDashboardRoute) {
        this.seoService.setNoIndex();
      } else {
        this.seoService.removeNoIndex();
      }

      console.log('Current route:', url, 'isDashboardRoute:', this.isDashboardRoute);
    });
  }
}
