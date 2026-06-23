import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { REQUIRED_APP_NAME } from '../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('reason') === 'access_denied') {
      this.errorMessage = `Access denied. You need at least one role for ${REQUIRED_APP_NAME}.`;
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.submitting = true;
      this.errorMessage = '';

      const credentials = this.loginForm.value;
      this.authService.login(credentials).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.submitting = false;

          if (error?.accessDenied) {
            this.errorMessage =
              error.message ||
              `Access denied. You need at least one role for ${REQUIRED_APP_NAME}.`;
            return;
          }

          this.errorMessage =
            error.error?.message || 'Login failed. Please check your credentials.';
        }
      });
    }
  }
}

