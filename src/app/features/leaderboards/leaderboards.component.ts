import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardService, LeaderboardUser } from '../../core/services/leaderboard.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-leaderboards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboards.component.html',
  styleUrls: ['./leaderboards.component.scss'],
})
export class LeaderboardsComponent implements OnInit {
  leaderboard: LeaderboardUser[] = [];
  topLeaders: LeaderboardUser[] = [];
  topVolunteers: LeaderboardUser[] = [];
  remainingVolunteers: LeaderboardUser[] = [];
  error: string = '';
  environment = environment;

  constructor(private leaderboardService: LeaderboardService) {}

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.leaderboardService.getLeaderboard().subscribe({
      next: (users) => {
        console.log('Leaderboard Data:', users); // Debug: Log raw data
        this.leaderboard = users;
        this.topLeaders = users.filter(user => user.type === 'قاده').slice(0, 3);
        this.topVolunteers = users.filter(user => user.type === 'متطوع').slice(0, 3);
        this.remainingVolunteers = users
          .filter(user => user.type === 'متطوع')
          .filter(user => !this.topVolunteers.includes(user)); // Exclude top 3 volunteers
        console.log('Top Volunteers:', this.topVolunteers); // Debug: Log volunteers
        console.log('Remaining Volunteers:', this.remainingVolunteers); // Debug: Log remaining volunteers
        this.error = '';
      },
      error: (err) => {
        this.error = err.message || 'خطأ في تحميل لوحة الصدارة';
        this.leaderboard = [];
        this.topLeaders = [];
        this.topVolunteers = [];
        this.remainingVolunteers = [];
        console.error('Leaderboard Error:', err); // Debug: Log error
      },
    });
  }

  handleImageError(user: LeaderboardUser): void {
    user.image = null; // Set to null to trigger fallback icon
  }
}
