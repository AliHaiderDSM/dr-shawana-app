import type { SignedUrl } from '@/types/api';
import { baseApi, unwrapData } from '../../api/baseApi';
import { fileUpload } from '../../api/formData';
import { LIST } from '../../api/tagTypes';
import type { MedicalDocument, UploadDocumentInput } from './types';

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
      query: ({ file, title }) => fileUpload('/patient/documents', 'files', file, title ? { title } : {}),
      transformResponse: unwrapData<MedicalDocument | null>,
      invalidatesTags: (_result, error) =>
        error ? [] : [{ type: 'Document', id: LIST }, { type: 'MedicalHistory', id: LIST }, 'Overview'],
    }),
  }),
});

export const { useGetDocumentsQuery, useLazyGetDocumentUrlQuery, useUploadDocumentMutation } = documentsApi;
export type { DocumentFile, MedicalDocument, UploadDocumentInput } from './types';
