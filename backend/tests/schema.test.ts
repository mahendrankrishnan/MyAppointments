import { appointments, type Appointment, type NewAppointment } from '../src/db/schema';

describe('Database Schema', () => {
  it('should export appointment types', () => {
    // Test that types are properly exported
    const appointment: Appointment = {
      id: 1,
      title: 'Test Appointment',
      description: 'Test Description',
      appointmentDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(appointment.id).toBe(1);
    expect(appointment.title).toBe('Test Appointment');
  });

  it('should validate NewAppointment type', () => {
    const newAppointment: NewAppointment = {
      title: 'New Appointment',
      description: 'New Description',
      appointmentDate: new Date(),
    };

    expect(newAppointment.title).toBe('New Appointment');
    // id, createdAt, updatedAt should not be present in NewAppointment
    expect((newAppointment as any).id).toBeUndefined();
    expect((newAppointment as any).createdAt).toBeUndefined();
    expect((newAppointment as any).updatedAt).toBeUndefined();
  });
});