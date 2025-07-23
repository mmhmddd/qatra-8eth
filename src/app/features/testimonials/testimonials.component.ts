import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Swiper from 'swiper';
import { Autoplay } from 'swiper/modules';
Swiper.use([Autoplay]);

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      new Swiper('.swiper-container', {
        slidesPerView: 4,
        spaceBetween: 10,
        loop: true,
        autoplay: {
          delay: 2000,
          disableOnInteraction: false
        },
        effect: 'slide',
        speed: 600,
        slidesPerGroup: 1,
        preventClicks: true,
        preventClicksPropagation: true,
        touchStartPreventDefault: true,
        observer: true,
        observeParents: true,
        centeredSlides: false,
        breakpoints: {
          1024: {
            slidesPerView: 3,
            spaceBetween: 8
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 6
          },
          480: {
            slidesPerView: 1,
            spaceBetween: 0,
            centeredSlides: true,
            slidesPerGroup: 1
          }
        }
      });
    }
  }

scrollToSwiper() {
  if (isPlatformBrowser(this.platformId)) {
    const element = document.getElementById('swiper_container');
    if (element) {
      const offset = 100; // scroll 100px above the element
      const targetY = element.getBoundingClientRect().top + window.pageYOffset - offset;
      const duration = 1000; // adjust for smoother/slower scroll
      const startY = window.scrollY;
      const startTime = performance.now();

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeInOutQuad = progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

        window.scrollTo(0, startY + (targetY - startY) * easeInOutQuad);

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    }
  }
}

}