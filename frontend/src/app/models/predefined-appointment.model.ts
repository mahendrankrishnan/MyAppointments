export interface PredefinedAppointmentType {
  id: string;
  name: string;
  description: string;
}

export const PREDEFINED_APPOINTMENT_TYPES: PredefinedAppointmentType[] = [
  {
    id: 'refrigerator_filter',
    name: 'Refrigerator Air Filter Change',
    description: 'Regular maintenance for refrigerator air filter'
  },
  {
    id: 'ac_filter',
    name: 'A/C Filter Change',
    description: 'Regular maintenance for air conditioning filter'
  }
];

