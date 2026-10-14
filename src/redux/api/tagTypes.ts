export const TAG_TYPES = [
  'Patient',
  'Overview',
  'Appointment',
  'MedicalHistory',
  'Prescription',
  'Document',
  'Conversation',
  'Message',
  'ManagementRequest',
] as const;

export type TagType = (typeof TAG_TYPES)[number];

export const LIST = 'LIST';
export const UNREAD = 'UNREAD';
