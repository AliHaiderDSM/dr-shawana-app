export interface Envelope<T> {
  data: T;
}

export interface Session {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

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

export interface PrescriptionSummary {
  id: string;
  prescriptionNo: number;
  date: string;
  doctor: string | null;
  diagnosis: string;
  followupDate: string | null;
  itemCount: number;
  appointmentId: string | null;
}

export interface PrescriptionItem {
  id: string;
  category: string;
  groupName: string | null;
  name: string;
  dose: string | null;
  instructions: string | null;
  optional: boolean;
}

export interface PrescriptionDetail extends PrescriptionSummary {
  planTreatment: string | null;
  items: PrescriptionItem[];
}

export interface DocumentFile {
  id: string;
  name: string;
  contentType: string;
  sizeBytes: number;
}

export interface MedicalDocument {
  id: string;
  type: 'medical_record' | 'imaging';
  date: string;
  title: string | null;
  appointmentId: string | null;
  uploadedByPatient: boolean;
  createdAt: string;
  files: DocumentFile[];
}

export interface AppointmentDetail extends Appointment {
  prescriptions: PrescriptionSummary[];
  documents: MedicalDocument[];
}

export interface HistoryVisit extends Appointment {
  prescriptions: { id: string; prescriptionNo: number; diagnosis: string }[];
  documentCount: number;
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

export const REQUEST_CATEGORIES = [
  'appointment',
  'prescription',
  'medicine_order',
  'billing',
  'profile_correction',
  'general',
  'other',
] as const;
export type RequestCategory = (typeof REQUEST_CATEGORIES)[number];

export type RequestStatus = 'submitted' | 'in_review' | 'in_progress' | 'resolved' | 'closed';

export interface ManagementRequest {
  id: string;
  requestNo: string;
  category: RequestCategory;
  subject: string;
  message: string;
  status: RequestStatus;
  reply: string | null;
  repliedAt: string | null;
  branch: { name: string };
  createdAt: string;
  updatedAt: string;
  history?: { status: RequestStatus; note: string | null; byPatient: boolean; at: string }[];
}

export interface SignedUrl {
  url: string;
  expiresIn: number;
}
