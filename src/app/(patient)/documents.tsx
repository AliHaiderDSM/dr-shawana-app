import { FileText } from 'lucide-react-native';
import { EmptyState } from '@/components/feedback/states';
import { DocumentCard } from '@/components/medical/cards';
import { ListScreen } from '@/components/ui/list-screen';
import { UploadPanel } from '@/features/documents/upload-panel';
import { useOpenDocument } from '@/hooks/use-open-document';
import { useRefresh } from '@/hooks/use-refresh';
import { useDocumentsQuery } from '@/services/api/patient-api';

export default function DocumentsScreen() {
  const documents = useDocumentsQuery();
  const { refreshing, onRefresh } = useRefresh(documents.refetch);
  const { open, openingId } = useOpenDocument();

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
        <DocumentCard document={item} openingId={openingId} onOpen={(file) => void open(file)} />
      )}
      empty={
        <EmptyState
          icon={FileText}
          title="No documents yet"
          message="Reports the clinic adds and the ones you upload will appear here."
        />
      }
    />
  );
}
