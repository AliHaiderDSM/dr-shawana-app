import type { IntakeKey } from '@/lib/intake-fields';

export interface IntakeAppointment {
  id: string;
  appointmentNo: number;
  repeatNo: number | null;
  date: string;
  timeFrom: string;
  doctor: string | null;
  status: string;
}

export interface IntakeForm {
  appointment: IntakeAppointment | null;
  editable: boolean;
  defaults: Record<string, unknown>;
  sections: Record<IntakeKey, Record<string, unknown> | null>;
}

export interface SaveIntakeInput {
  key: IntakeKey;
  data: Record<string, unknown>;
}

export interface MedicineItem {
  id: string;
  category: string;
  groupName: string | null;
  name: string;
  dose: string | null;
  instructions: string | null;
  optional: boolean;
}

export interface MedicineVisit {
  prescriptionId: string;
  prescriptionNo: number;
  date: string;
  doctor: string | null;
  diagnosis: string | null;
  items: MedicineItem[];
}
