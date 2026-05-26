import { Routes } from '@angular/router';
import { AppointmentListComponent } from './appointment-list/appointment-list.component';
import { AppointmentFormComponent } from './appointment-form/appointment-form.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: '', component: AppointmentListComponent, canActivate: [authGuard] },
  { path: 'new', component: AppointmentFormComponent, canActivate: [authGuard] },
  { path: 'edit/:id', component: AppointmentFormComponent, canActivate: [authGuard] },
];
