import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private titleService: Title,
    private metaService: Meta,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document
  ) {}

  init() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe(data => {
      // تحديث العنوان إذا كان موجودًا
      if (data['title']) {
        this.titleService.setTitle(data['title']);
      } else {
        this.titleService.setTitle('قطرة غيث | Qatrah Ghaith'); // عنوان افتراضي
      }

      // إزالة الميتا تاغز القديمة لتجنب التضارب
      this.metaService.removeTag('name="description"');
      this.metaService.removeTag('name="keywords"');
      this.metaService.removeTag('property="og:title"');
      this.metaService.removeTag('property="og:description"');
      this.metaService.removeTag('property="og:url"');

      // تحديث الميتا تاغز إذا كانت موجودة
      if (data['meta']) {
        if (data['meta'].description) {
          this.metaService.updateTag({ name: 'description', content: data['meta'].description });
        }
        if (data['meta'].keywords) {
          this.metaService.updateTag({ name: 'keywords', content: data['meta'].keywords });
        }
        if (data['meta'].ogTitle) {
          this.metaService.updateTag({ property: 'og:title', content: data['meta'].ogTitle });
        }
        if (data['meta'].ogDescription) {
          this.metaService.updateTag({ property: 'og:description', content: data['meta'].ogDescription });
        }
        if (data['meta'].ogUrl) {
          this.metaService.updateTag({ property: 'og:url', content: data['meta'].ogUrl });
        }

        // إدارة البيانات المهيكلة (JSON-LD)
        if (data['meta'].structuredData) {
          // إزالة أي scripts JSON-LD سابقة
          const existingScripts = this.document.head.querySelectorAll('script[type="application/ld+json"]');
          existingScripts.forEach(script => script.remove());

          // إضافة script JSON-LD جديد
          const script = this.document.createElement('script');
          script.type = 'application/ld+json';
          script.text = JSON.stringify(data['meta'].structuredData);
          this.document.head.appendChild(script);
        }
      } else {
        // إزالة أي scripts JSON-LD إذا لم تكن هناك بيانات مهيكلة
        const existingScripts = this.document.head.querySelectorAll('script[type="application/ld+json"]');
        existingScripts.forEach(script => script.remove());

        // إضافة ميتا تاغز افتراضية إذا لم تكن هناك بيانات meta
        this.metaService.updateTag({
          name: 'description',
          content: 'قطرة غيث: مبادرة تعليمية غير ربحية لدعم أطفال غزة والأمراض المزمنة عبر التعلم الإلكتروني في الأردن، فلسطين، مصر والوطن العربي. Qatrah Ghaith: Non-profit e-learning for Gaza children and chronic diseases.'
        });
        this.metaService.updateTag({
          name: 'keywords',
          content: 'قطرة غيث, Qatrah Ghaith, تعليم أطفال غزة, أمراض مزمنة, تعلم إلكتروني, الأردن, فلسطين, مصر, e-learning Gaza, chronic diseases education'
        });
        this.metaService.updateTag({
          property: 'og:title',
          content: 'قطرة غيث | Qatrah Ghaith'
        });
        this.metaService.updateTag({
          property: 'og:description',
          content: 'انضم إلى مبادراتنا التعليمية لدعم أطفال غزة. Join our education initiatives for Gaza children.'
        });
        this.metaService.updateTag({
          property: 'og:url',
          content: 'https://www.qatrah-ghaith.com'
        });
      }
    });
  }

  // دالة لإضافة meta tag لـ noindex
  setNoIndex() {
    this.metaService.updateTag({ name: 'robots', content: 'noindex' });
  }

  // دالة لإزالة meta tag لـ noindex
  removeNoIndex() {
    this.metaService.removeTag('name="robots"');
  }
}
