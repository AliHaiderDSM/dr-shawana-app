import { router } from 'expo-router';
import { History } from 'lucide-react-native';
import { EmptyState } from '@/components/feedback/states';
import { HistoryItem } from '@/components/medical/cards';
import { AppText } from '@/components/ui/app-text';
import { ListScreen } from '@/components/ui/list-screen';
import { useRefresh } from '@/hooks/use-refresh';
import { useHistoryQuery } from '@/services/api/patient-api';

export default function HistoryScreen() {
  const history = useHistoryQuery();
  const { refreshing, onRefresh } = useRefresh(history.refetch);
  const visits = history.data;

  return (
    <ListScreen
      data={visits}
      keyExtractor={(v) => v.id}
      gap={0}
      isLoading={history.isLoading}
      error={history.error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onRetry={history.refetch}
      header={
        visits?.length ? (
          <AppText tone="muted" variant="label">
            Your past visits in every branch, newest first. Tap a visit to see its prescription and documents.
          </AppText>
        ) : null
      }
      renderItem={({ item, index }) => (
        <HistoryItem
          visit={item}
          last={index === (visits?.length ?? 0) - 1}
          onPress={() => router.push(`/appointments/${item.id}`)}
        />
      )}
      empty={
        <EmptyState
          icon={History}
          title="No visits yet"
          message="After your first appointment, your visits and prescriptions will show here."
        />
      }
    />
  );
}
