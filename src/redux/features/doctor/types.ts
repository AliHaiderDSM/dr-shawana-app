import type { UploadableFile } from '@/types/api';

export interface DoctorHome {
  doctor: { id: string; name: string; details: string | null; branch: string };
  counts: {
    patients: number;
    appointments?: number;
    today: number;
    completedToday: number;
    upcoming: number;
    unread: number;
  };
  schedule: {
    id: string;
    appointmentNo: number;
    date: string;
    timeFrom: string;
    timeTo: string;
    status: string;
    visitType: string;
    mode: string;
    branch: string;
    patient: { id: string; name: string; phone: string };
  }[];
  chats: {
    conversationId: string;
    patient: { id: string; name: string };
    lastMessage: string | null;
    lastMessageAt: string | null;
    unread: number;
  }[];
}

export type AppointmentsWhen = 'upcoming' | 'past';

export interface DoctorAppointment {
  id: string;
  appointmentNo: number;
  date: string;
  timeFrom: string;
  timeTo: string;
  status: string;
  visitType: string;
  mode: string;
  issues: string | null;
  branch: string;
  patient: { id: string; name: string; phone: string };
}

export interface DoctorAppointmentsPage {
  items: DoctorAppointment[];
  page: number;
  hasMore: boolean;
}

export interface DoctorPatient {
  id: string;
  name: string;
  phone: string;
  city: string;
  age: number | null;
  lastVisit: string | null;
  nextVisit: string | null;
  visits: number;
  conversationId: string | null;
  unread: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export interface PatientFileAppointment {
  id: string;
  appointmentNo: number;
  date: string;
  timeFrom: string;
  timeTo: string;
  status: string;
  visitType: string;
  mode: string;
  issues: string | null;
  remark: string | null;
  doctor: string | null;
  branch: string;
  mine: boolean;
}

export interface PatientFilePrescription {
  id: string;
  prescriptionNo: number;
  date: string;
  diagnosis: string;
  followupDate: string | null;
  planTreatment: string | null;
  consultationId?: string | null;
  doctor: string | null;
  branch?: string | null;
  items: { groupName: string; name: string; dose: string | null; instructions: string | null }[];
}

export interface PatientFileRemark {
  consultationId: string;
  date: string;
  appointmentNo: number;
  doctor: string | null;
  branch?: string | null;
  remarks: string | null;
  updatedAt: string | null;
  editable: boolean;
}

export interface PatientFileRecord {
  id: string;
  type: 'medical_record' | 'imaging';
  date: string;
  note: string | null;
  uploadedByPatient: boolean;
  branch?: string | null;
  createdAt?: string | null;
  files: { id: string; name: string; contentType: string }[];
}

export interface PatientFile {
  patient: {
    id: string;
    name: string;
    phone: string;
    age: number | null;
    dateOfBirth: string | null;
    city: string;
    country: string | null;
    weightKg: string | null;
    heightCm: string | null;
  };
  conversationId: string | null;
  appointments: PatientFileAppointment[];
  prescriptions: PatientFilePrescription[];
  remarks: PatientFileRemark[];
  records: PatientFileRecord[];
  bloodWork?: BloodWork;
}

export type BloodTest =
  | 'fsh'
  | 'estradiol'
  | 'testosterone_free'
  | 'testosterone_total'
  | 'dhea_s'
  | 'vit_d3'
  | 'tsh'
  | 'ferritin'
  | 'b12';

export interface BloodWork {
  dates: string[];
  tests: { test: BloodTest; unit: string; points: { date: string; value: number }[] }[];
}

export interface DoctorProfile {
  id: string;
  displayName: string;
  details: string | null;
  branch: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

export interface UpdateDoctorProfileInput {
  displayName: string;
  details: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
}

export interface SendDoctorMessageInput {
  conversationId: string;
  body: string;
  file: UploadableFile | null;
  replyToId?: string | null;
  durationMs?: number | null;
}
