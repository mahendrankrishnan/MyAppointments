import { Component, effect } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { SessionTimeoutService } from './services/session-timeout.service';
import { SessionTimeoutWarningComponent } from './session-timeout-warning/session-timeout-warning.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, SessionTimeoutWarningComponent],
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent {
  title = 'appointment-frontend';

  constructor(
    public authService: AuthService,
    private router: Router,
    private sessionTimeout: SessionTimeoutService
  ) {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.sessionTimeout.start();
      } else {
        this.sessionTimeout.stop();
      }
    });
  }

  logout() {
    this.sessionTimeout.stop();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

