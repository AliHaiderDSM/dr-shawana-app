import { FileText } from 'lucide-react-native';
import { useState } from 'react';
import { Alert } from 'react-native';
import { EmptyState } from '@/components/feedback/states';
import { DocumentCard } from '@/components/medical/cards';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ListScreen } from '@/components/ui/list-screen';
import { UploadPanel } from '@/components/forms/upload-panel';
import { useOpenDocument } from '@/hooks/use-open-document';
import { useRefresh } from '@/hooks/use-refresh';
import { errorMessage } from '@/lib/errors';
import {
  type DocumentFile,
  type MedicalDocument,
  useDeleteDocumentFileMutation,
  useGetDocumentsQuery,
} from '@/redux/features/documents';

type Pending = { file: DocumentFile; document: MedicalDocument };

export default function DocumentsScreen() {
  const documents = useGetDocumentsQuery();
  const { refreshing, onRefresh } = useRefresh(documents.refetch);
  const { open, openingId } = useOpenDocument();
  const [deleteFile, deleting] = useDeleteDocumentFileMutation();
  const [pending, setPending] = useState<Pending | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const last = pending?.document.files.length === 1;

  const remove = async () => {
    if (!pending) return;
    setDeletingId(pending.file.id);
    try {
      await deleteFile(pending.file.id).unwrap();
      setPending(null);
    } catch (error) {
      setPending(null);
      Alert.alert('Could not delete', errorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
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
            onDelete={(file, document) => setPending({ file, document })}
            deletingId={deletingId}
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
      <ConfirmModal
        visible={pending !== null}
        title="Delete this file?"
        detail={pending?.file.name}
        message={
          last
            ? 'This is the only file of this report, so the report is removed too. The clinic will no longer see it.'
            : 'Only this file is removed. The other files of the report stay. The clinic will no longer see it.'
        }
        confirmLabel="Delete"
        busy={deleting.isLoading}
        onConfirm={() => void remove()}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
