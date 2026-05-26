import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, NewAppointment } from '../models/appointment.model';

export interface GenerateDescriptionRequest {
  title: string;
  description?: string;
  mode: 'custom' | 'predefined';
  appointmentDate?: string; // YYYY-MM-DD
  appointmentTime?: string; // HH:MM
  predefinedTypeName?: string;
  dateOfChange?: string; // YYYY-MM-DD
  futureChangeDate?: string; // YYYY-MM-DD
  futureChangeTime?: string; // HH:MM
}

export interface GenerateDescriptionResponse {
  title?: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:4206';

  constructor(private http: HttpClient) {}

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments`);
  }

  getAppointment(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/appointments/${id}`);
  }

  createAppointment(appointment: NewAppointment): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/appointments`, appointment);
  }

  updateAppointment(id: number, appointment: Partial<NewAppointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/appointments/${id}`, appointment);
  }

  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/appointments/${id}`);
  }

  generateDescription(input: GenerateDescriptionRequest): Observable<GenerateDescriptionResponse> {
    return this.http.post<GenerateDescriptionResponse>(`${this.apiUrl}/ai/generate-description`, input);
  }
}

