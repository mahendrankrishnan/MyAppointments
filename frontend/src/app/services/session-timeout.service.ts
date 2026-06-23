import { Injectable, NgZone, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const SESSION_DURATION_MS = 10 * 60 * 1000;
const WARNING_DURATION_MS = 2 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  showWarning = signal(false);
  secondsRemaining = signal(0);

  private isWatching = false;
  private warningTimeoutId?: ReturnType<typeof setTimeout>;
  private countdownIntervalId?: ReturnType<typeof setInterval>;
  private activityHandler?: () => void;
  private readonly activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  start(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    if (!this.isWatching) {
      this.isWatching = true;
      this.attachActivityListeners();
    }

    this.resetTimers();
  }

  stop(): void {
    this.isWatching = false;
    this.clearTimers();
    this.detachActivityListeners();
    this.showWarning.set(false);
    this.secondsRemaining.set(0);
  }

  stayLoggedIn(): void {
    this.showWarning.set(false);
    this.secondsRemaining.set(0);
    this.clearTimers();
    this.resetTimers();
  }

  logout(): void {
    this.stop();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private resetTimers(): void {
    this.clearTimers();

    if (!this.isWatching || !this.authService.isAuthenticated()) {
      return;
    }

    const warningDelay = SESSION_DURATION_MS - WARNING_DURATION_MS;

    this.warningTimeoutId = setTimeout(() => {
      this.ngZone.run(() => this.openWarning());
    }, warningDelay);
  }

  private openWarning(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.showWarning.set(true);
    this.secondsRemaining.set(WARNING_DURATION_MS / 1000);

    this.countdownIntervalId = setInterval(() => {
      this.ngZone.run(() => {
        const next = this.secondsRemaining() - 1;
        this.secondsRemaining.set(next);

        if (next <= 0) {
          this.logout();
        }
      });
    }, 1000);
  }

  private clearTimers(): void {
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = undefined;
    }

    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = undefined;
    }
  }

  private attachActivityListeners(): void {
    this.activityHandler = this.throttle(() => {
      if (this.isWatching && !this.showWarning()) {
        this.resetTimers();
      }
    }, 1000);

    this.activityEvents.forEach((event) => {
      document.addEventListener(event, this.activityHandler!, true);
    });
  }

  private detachActivityListeners(): void {
    if (!this.activityHandler) {
      return;
    }

    this.activityEvents.forEach((event) => {
      document.removeEventListener(event, this.activityHandler!, true);
    });

    this.activityHandler = undefined;
  }

  private throttle(fn: () => void, waitMs: number): () => void {
    let lastRun = 0;
    return () => {
      const now = Date.now();
      if (now - lastRun >= waitMs) {
        lastRun = now;
        fn();
      }
    };
  }
}
