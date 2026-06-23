import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  REQUIRED_APP_NAME,
  UserApplicationsRolesResponse,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:4501/api';
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  isAuthenticated = signal<boolean>(false);
  currentUser = signal<LoginResponse['user'] | null>(null);

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      switchMap((response) =>
        this.getUserApplicationsRoles(response.user.id, response.token).pipe(
          map((applicationsRoles) => ({ response, applicationsRoles }))
        )
      ),
      switchMap(({ response, applicationsRoles }) => {
        if (!this.hasRequiredAccess(applicationsRoles)) {
          return throwError(() => ({
            accessDenied: true,
            message: `Access denied. You need at least one role for ${REQUIRED_APP_NAME}.`,
          }));
        }

        this.setAuthData(response);
        return of(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  validateSession(): Observable<boolean> {
    const user = this.currentUser();
    const token = this.getToken();

    if (!user || !token) {
      return of(false);
    }

    return this.getUserApplicationsRoles(user.id).pipe(
      map((data) => this.hasRequiredAccess(data)),
      map((valid) => {
        if (!valid) {
          this.logout();
        }
        return valid;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  getUserApplicationsRoles(
    userId: number,
    token?: string
  ): Observable<UserApplicationsRolesResponse> {
    return this.http.get<UserApplicationsRolesResponse>(
      `${this.apiUrl}/users/${userId}/applications-roles`,
      { headers: this.createAuthHeaders(token) }
    );
  }

  hasRequiredAccess(data: UserApplicationsRolesResponse): boolean {
    const application = data.applications?.find(
      (app) => app.appName === REQUIRED_APP_NAME
    );

    return !!application && Array.isArray(application.roles) && application.roles.length > 0;
  }

  private setAuthData(response: LoginResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.isAuthenticated.set(true);
    this.currentUser.set(response.user);
  }

  private checkAuthStatus(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem(this.userKey);

    if (!token || !userStr) {
      return;
    }

    try {
      const user = JSON.parse(userStr) as LoginResponse['user'];

      this.getUserApplicationsRoles(user.id, token).subscribe({
        next: (data) => {
          if (this.hasRequiredAccess(data)) {
            this.isAuthenticated.set(true);
            this.currentUser.set(user);
            return;
          }

          this.logout();
        },
        error: () => this.logout(),
      });
    } catch {
      this.logout();
    }
  }

  private createAuthHeaders(token?: string): HttpHeaders {
    const authToken = token ?? this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${authToken}`,
    });
  }
}
