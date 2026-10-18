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
  hasPassword: boolean;
  weightKg: number | null;
  heightCm: number | null;
  clinic: Clinic | null;
}

export interface UpdateProfileInput {
  name?: string;
  city?: string;
  country?: string | null;
  age?: number | null;
  dateOfBirth?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
}

export interface SetPasswordInput {
  currentPassword?: string | null;
  password: string;
}

export interface Overview {
  patient: { name: string };
  nextAppointment: Appointment | null;
  upcomingCount: number;
  latestPrescription: PrescriptionSummary | null;
  recentVisits: Appointment[];
  openRequests: number;
  counts: { appointments: number; prescriptions: number };
  resources: EducationalResources | null;
}

export interface EducationalResources {
  date: string;
  doctor: string | null;
  items: { key: string; label: string; file: ResourceFile }[];
}

export interface ResourceFile {
  name: string;
  type: string;
  path: string;
}
