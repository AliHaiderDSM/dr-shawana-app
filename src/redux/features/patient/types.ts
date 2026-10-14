import type { Appointment } from '../appointments/types';
import type { PrescriptionSummary } from '../prescriptions/types';

export interface Clinic {
  name: string;
  phone: string | null;
  address: string | null;
}

export interface PatientProfile {
  id: string;
  name: string;
  phone: string;
  age: number | null;
  dateOfBirth: string | null;
  city: string;
  country: string | null;
  clinic: Clinic | null;
}

export interface UpdateProfileInput {
  name?: string;
  city?: string;
  country?: string | null;
  age?: number | null;
  dateOfBirth?: string | null;
}

export interface Overview {
  patient: { name: string };
  nextAppointment: Appointment | null;
  upcomingCount: number;
  latestPrescription: PrescriptionSummary | null;
  recentVisits: Appointment[];
  openRequests: number;
  counts: { appointments: number; prescriptions: number };
}
