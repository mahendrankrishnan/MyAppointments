import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AppointmentService } from '../services/appointment.service';
import { Appointment } from '../models/appointment.model';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css']
})
export class AppointmentListComponent implements OnInit {
  appointments = signal<Appointment[]>([]);
  filteredAppointments = signal<Appointment[]>([]);
  loading = signal(true);
  showPastAppointments = signal(false);

  constructor(
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.loading.set(true);
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.loading.set(false);
        alert('Failed to load appointments. Please try again.');
      }
    });
  }

  applyFilter() {
    const allAppointments = this.appointments();
    const now = new Date();
    
    if (this.showPastAppointments()) {
      // Show all appointments
      this.filteredAppointments.set(allAppointments);
    } else {
      // Show only future appointments
      const futureAppointments = allAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointmentDate >= now;
      });
      this.filteredAppointments.set(futureAppointments);
    }
  }

  togglePastAppointments() {
    this.showPastAppointments.set(!this.showPastAppointments());
    this.applyFilter();
  }

  editAppointment(id: number) {
    this.router.navigate(['/edit', id]);
  }

  deleteAppointment(id: number) {
    if (confirm('Are you sure you want to delete this appointment?')) {
      this.appointmentService.deleteAppointment(id).subscribe({
      next: () => {
        this.loadAppointments();
        this.applyFilter();
      },
        error: (error) => {
          console.error('Error deleting appointment:', error);
          alert('Failed to delete appointment. Please try again.');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isPastAppointment(appointment: Appointment): boolean {
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();
    return appointmentDate < now;
  }
}

