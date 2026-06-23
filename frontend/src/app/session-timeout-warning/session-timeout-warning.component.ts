import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionTimeoutService } from '../services/session-timeout.service';

@Component({
  selector: 'app-session-timeout-warning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-timeout-warning.component.html',
  styleUrls: ['./session-timeout-warning.component.css']
})
export class SessionTimeoutWarningComponent {
  constructor(public sessionTimeout: SessionTimeoutService) {}

  stayLoggedIn(): void {
    this.sessionTimeout.stayLoggedIn();
  }

  logout(): void {
    this.sessionTimeout.logout();
  }

  formatTime(seconds: number): string {
    return this.sessionTimeout.formatTime(seconds);
  }
}
