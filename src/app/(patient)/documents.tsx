import { FileText } from 'lucide-react-native';
import { useState } from 'react';
import { Alert } from 'react-native';
import { EmptyState } from '@/components/feedback/states';
import { DocumentCard } from '@/components/medical/cards';
import { confirm } from '@/components/ui/bits';
import { ListScreen } from '@/components/ui/list-screen';
import { UploadPanel } from '@/components/forms/upload-panel';
import { useOpenDocument } from '@/hooks/use-open-document';
import { useRefresh } from '@/hooks/use-refresh';
import { errorMessage } from '@/lib/errors';
import {
  type MedicalDocument,
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
} from '@/redux/features/documents';

export default function DocumentsScreen() {
  const documents = useGetDocumentsQuery();
  const { refreshing, onRefresh } = useRefresh(documents.refetch);
  const { open, openingId } = useOpenDocument();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = (d: MedicalDocument) =>
    confirm({
      title: 'Delete this report?',
      message: 'It is removed from your medical records and the clinic will no longer see it.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        setDeletingId(d.id);
        void deleteDocument(d.id)
          .unwrap()
          .catch((error: unknown) => Alert.alert('Could not delete', errorMessage(error)))
          .finally(() => setDeletingId(null));
      },
    });

  return (
    <ListScreen
      data={documents.data}
      keyExtractor={(d) => d.id}
      isLoading={documents.isLoading}
      error={documents.error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onRetry={documents.refetch}
      header={<UploadPanel />}
      renderItem={({ item }) => (
        <DocumentCard
          document={item}
          openingId={openingId}
          onOpen={(file) => void open(file)}
          onDelete={remove}
          deleting={deletingId === item.id}
        />
      )}
      empty={
        <EmptyState
          icon={FileText}
          title="No medical records yet"
          message="Reports the clinic adds and the ones you upload will appear here."
        />
      }
    />
  );
}
