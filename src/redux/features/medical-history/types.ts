import type { Appointment } from '../appointments/types';

export interface HistoryVisit extends Appointment {
  prescriptions: { id: string; prescriptionNo: number; diagnosis: string }[];
  documentCount: number;
}
