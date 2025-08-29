import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JoinRequestService, JoinRequestResponse, JoinRequest } from '../../core/services/join-request.service';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { SidebarComponent } from "../../shared/sidebar/sidebar.component";

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, NgChartsModule, SidebarComponent],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
})
export class StatisticsComponent implements OnInit {
  error: string | null = null;
  pendingCount: number = 0;
  approvedCount: number = 0;
  rejectedCount: number = 0;
  topVolunteers: JoinRequest[] = [];

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top', labels: { font: { size: 12, family: 'Noto Kufi Arabic' } } },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(2) + '%';
            return `${label}: ${value} (${percentage})`;
          },
        },
      },
    },
  };
  pieChartLabels: string[] = ['المعلقة', 'المقبولة', 'المرفوضة'];
  pieChartData: ChartData<'pie', number[]> = {
    labels: this.pieChartLabels,
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ['#FFC107', '#28A745', '#DC3545'],
        label: 'حالة الطلبات',
      },
    ],
  };
  pieChartType: ChartType = 'pie';

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${value} ساعة تطوع`;
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: 'الأعضاء', font: { size: 14, family: 'Noto Kufi Arabic' } } },
      y: { title: { display: true, text: 'ساعات التطوع', font: { size: 14, family: 'Noto Kufi Arabic' } }, beginAtZero: true },
    },
  };
  barChartLabels: string[] = [];
  barChartData: ChartData<'bar', number[]> = {
    labels: this.barChartLabels,
    datasets: [
      {
        data: [],
        backgroundColor: ['#00adb5', '#0097b2', '#ff914d', '#545454', '#1a1a1a'],
        label: 'ساعات التطوع',
        borderRadius: 4,
      },
    ],
  };
  barChartType: ChartType = 'bar';

  constructor(
    private joinRequestService: JoinRequestService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCounts();
    this.loadTopVolunteers();
  }

  loadCounts(): void {
    forkJoin({
      all: this.joinRequestService.getAll(),
      approved: this.joinRequestService.getApprovedMembers(),
    }).subscribe({
      next: ({ all, approved }) => {
        if (all.success && approved.success) {
          const allRequests = all.members || [];
          this.pendingCount = allRequests.filter((m) => m.status === 'Pending').length;
          this.rejectedCount = allRequests.filter((m) => m.status === 'Rejected').length;
          this.approvedCount = approved.members?.length || 0;
          this.updateChart();
        } else {
          this.error = all.message || approved.message || 'فشل في جلب البيانات';
        }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في جلب عدد الطلبات والأعضاء';
        console.error('Error fetching counts:', err);
        this.cdr.detectChanges();
      },
    });
  }

  updateChart(): void {
    this.pieChartData = {
      labels: this.pieChartLabels,
      datasets: [
        {
          data: [this.pendingCount, this.approvedCount, this.rejectedCount],
          backgroundColor: ['#FFC107', '#28A745', '#DC3545'],
          label: 'حالة الطلبات',
        },
      ],
    };
    this.cdr.detectChanges();
  }

  loadTopVolunteers(): void {
    this.joinRequestService.getApprovedMembers().subscribe({
      next: (response: JoinRequestResponse) => {
        if (response.success && response.members) {
          this.topVolunteers = response.members
            .sort((a, b) => (b.volunteerHours || 0) - (a.volunteerHours || 0))
            .slice(0, 10);
          this.updateBarChart();
        } else {
          this.error = response.message || 'فشل في جلب بيانات المتطوعين';
        }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || 'فشل في جلب بيانات المتطوعين';
        console.error('Error fetching top volunteers:', err);
        this.cdr.detectChanges();
      },
    });
  }

  updateBarChart(): void {
    this.barChartLabels = this.topVolunteers.map((member) => member.name || 'غير معروف');
    this.barChartData = {
      labels: this.barChartLabels,
      datasets: [
        {
          data: this.topVolunteers.map((member) => member.volunteerHours || 0),
          backgroundColor: ['#00adb5', '#0097b2', '#ff914d', '#545454', '#1a1a1a'],
          label: 'ساعات التطوع',
          borderRadius: 4,
        },
      ],
    };
    this.cdr.detectChanges();
  }
}
