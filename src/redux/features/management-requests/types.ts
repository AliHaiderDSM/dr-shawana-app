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

export interface NewRequestInput {
  category: RequestCategory;
  subject: string;
  message: string;
}
