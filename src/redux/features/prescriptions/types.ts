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
