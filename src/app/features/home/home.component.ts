import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Carousel } from 'bootstrap';
import AOS from 'aos';

interface Achievement {
  value: number;
  label: string;
  count: number;
  prefix?: string;
  suffix?: string;
  animationDuration?: number;
  ringOffset?: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('achievementsSection') achievementsSection!: ElementRef;
  @ViewChild('carouselElement') carouselElement!: ElementRef;

  readonly ringDasharray = 2 * Math.PI * 36;

  achievements: Achievement[] = [
    { 
      value: 11, 
      label: 'سنة خبرة', 
      count: 0,
      prefix: '+',
      animationDuration: 2000,
      ringOffset: this.ringDasharray
    },
    { 
      value: 40, 
      label: 'نشاط وخدمة', 
      count: 0, 
      prefix: '+',
      animationDuration: 1800,
      ringOffset: this.ringDasharray
    },
    { 
      value: 12000, 
      label: 'متطوع', 
      count: 0, 
      prefix: '+',
      animationDuration: 2500,
      ringOffset: this.ringDasharray
    },
    { 
      value: 90, 
      label: 'شريك وداعم', 
      count: 0, 
      prefix: '+',
      animationDuration: 2200,
      ringOffset: this.ringDasharray
    },
    { 
      value: 70000, 
      label: 'مستفيد', 
      count: 0, 
      prefix: '+',
      animationDuration: 3000,
      ringOffset: this.ringDasharray
    }
  ];

  private observer?: IntersectionObserver;
  private carousel?: Carousel;
  private countingAnimationFrames: number[] = [];
  private hasAnimated = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
      });
      await this.initializeCarousel();
      this.setupIntersectionObserver();
      this.addCarouselEnhancedFeatures();
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.countingAnimationFrames.forEach(frameId => {
      cancelAnimationFrame(frameId);
    });
    this.countingAnimationFrames = [];
    
    if (this.carousel && this.carouselElement?.nativeElement) {
      this.carousel.dispose();
    }
  }

  private async initializeCarousel() {
    try {
      const carouselElement = this.carouselElement?.nativeElement;
      if (carouselElement) {
        this.carousel = new Carousel(carouselElement, {
          interval: 3000,
          ride: 'carousel',
          pause: 'hover',
          wrap: true,
          keyboard: true,
          touch: true
        });
      }
    } catch (error) {
      console.error('Error initializing carousel:', error);
    }
  }

  private addCarouselEnhancedFeatures() {
    const carouselElement = this.carouselElement?.nativeElement;
    if (!carouselElement) return;

    const carouselItems = carouselElement.querySelectorAll('.carousel-item');
    
    carouselItems.forEach((item: HTMLElement) => {
      const img = item.querySelector('.carousel-img') as HTMLImageElement;
      if (img) {
        img.addEventListener('load', () => {
          item.classList.add('image-loaded');
        });
      }
    });

    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    carouselElement.addEventListener('touchstart', (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    });

    carouselElement.addEventListener('touchmove', (e: TouchEvent) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
    });

    carouselElement.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      
      const diffX = startX - currentX;
      const threshold = 50;

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          this.carousel?.next();
        } else {
          this.carousel?.prev();
        }
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      this.carousel?.prev();
    } else if (event.key === 'ArrowRight') {
      this.carousel?.next();
    }
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.hasAnimated) {
            this.hasAnimated = true;
            this.startCountingAnimation();
          }
        });
      },
      { 
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (this.achievementsSection?.nativeElement) {
      this.observer.observe(this.achievementsSection.nativeElement);
    }
  }

  private startCountingAnimation(): void {
    this.achievements.forEach((achievement, index) => {
      this.animateCounter(achievement, index);
    });
  }

  private animateCounter(achievement: Achievement, index: number): void {
    const duration = achievement.animationDuration || 2000;
    const startTime = performance.now();
    const startValue = 0;
    const endValue = achievement.value;
    const delay = index * 200;
    const ringDasharray = this.ringDasharray;

    setTimeout(() => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
        
        achievement.count = currentValue;
        achievement.ringOffset = ringDasharray - (currentValue / endValue) * ringDasharray;

        const counterElement = document.querySelector(`#counter-${index}`) as HTMLElement;
        if (counterElement) {
          counterElement.style.transform = `scale(${1 + (Math.sin(progress * Math.PI) * 0.05)})`;
          
          if (progress === 1) {
            counterElement.style.transform = 'scale(1)';
          }
        }

        if (progress < 1) {
          const frameId = requestAnimationFrame(animate);
          this.countingAnimationFrames.push(frameId);
        }
      };

      const frameId = requestAnimationFrame(animate);
      this.countingAnimationFrames.push(frameId);
    }, delay);
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-US', { useGrouping: true });
  }

  navigateToJoinUs(): void {
    this.router.navigate(['/join-us']);
  }
}