import type { UploadableFile } from '@/types/api';

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

export type DocumentType = MedicalDocument['type'];

export interface UploadDocumentInput {
  file: UploadableFile;
  title: string;
  type: DocumentType;
}
