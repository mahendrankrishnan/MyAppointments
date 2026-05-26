export interface Appointment {
  id: number;
  title: string;
  description?: string;
  appointmentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewAppointment {
  title: string;
  description?: string;
  appointmentDate: string;
}

