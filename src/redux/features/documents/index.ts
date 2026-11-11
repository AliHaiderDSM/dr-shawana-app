import type { SignedUrl } from '@/types/api';
import { baseApi, unwrapData } from '../../api/baseApi';
import { fileUpload } from '../../api/formData';
import { LIST } from '../../api/tagTypes';
import type { DocumentScan, MedicalDocument, UploadDocumentInput } from './types';

export const documentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDocuments: build.query<MedicalDocument[], void>({
      query: () => '/patient/documents',
      transformResponse: unwrapData<MedicalDocument[]>,
      providesTags: [{ type: 'Document', id: LIST }],
    }),
    getDocumentUrl: build.query<SignedUrl, string>({
      query: (fileId) => `/patient/documents/files/${encodeURIComponent(fileId)}/url`,
      transformResponse: unwrapData<SignedUrl>,
      keepUnusedDataFor: 0,
    }),
    uploadDocument: build.mutation<MedicalDocument | null, UploadDocumentInput>({
      query: ({ file, title, type }) =>
        fileUpload('/patient/documents', 'files', file, { type, ...(title ? { title } : {}) }),
      transformResponse: unwrapData<MedicalDocument | null>,
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: 'Document', id: LIST }, { type: 'MedicalHistory', id: LIST }, 'Overview'],
    }),
    scanDocument: build.mutation<DocumentScan, string>({
      query: (id) => ({ url: `/patient/documents/${encodeURIComponent(id)}/scan`, method: 'POST' }),
      transformResponse: unwrapData<DocumentScan>,
      invalidatesTags: (_result, error) => (error ? [] : [{ type: 'MedicalHistory', id: LIST }, 'Overview']),
    }),
    deleteDocument: build.mutation<void, string>({
      query: (id) => ({ url: `/patient/documents/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: 'Document', id: LIST }, { type: 'MedicalHistory', id: LIST }, 'Overview'],
    }),
    deleteDocumentFile: build.mutation<void, string>({
      query: (fileId) => ({
        url: `/patient/documents/files/${encodeURIComponent(fileId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: 'Document', id: LIST }, { type: 'MedicalHistory', id: LIST }, 'Overview'],
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useLazyGetDocumentUrlQuery,
  useUploadDocumentMutation,
  useScanDocumentMutation,
  useDeleteDocumentMutation,
  useDeleteDocumentFileMutation,
} = documentsApi;
export type { DocumentFile, DocumentScan, DocumentType, MedicalDocument, UploadDocumentInput } from './types';
