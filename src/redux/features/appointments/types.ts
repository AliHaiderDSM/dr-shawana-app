import type { MedicalDocument } from '../documents/types';
import type { PrescriptionSummary } from '../prescriptions/types';

export type AppointmentStatus = 'booked' | 'completed' | 'cancelled';

export interface Branch {
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
}

export interface Appointment {
  id: string;
  appointmentNo: number;
  date: string;
  timeFrom: string;
  timeTo: string;
  mode: 'online' | 'physical';
  visitType: 'new' | 'followup';
  status: AppointmentStatus;
  upcoming: boolean;
  doctor: { name: string; details: string | null } | null;
  branch: Branch;
}

export interface AppointmentDetail extends Appointment {
  prescriptions: PrescriptionSummary[];
  documents: MedicalDocument[];
}
