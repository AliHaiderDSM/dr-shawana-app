import { router } from 'expo-router';
import { MessageSquarePlus } from 'lucide-react-native';
import { EmptyState } from '@/components/feedback/states';
import { RequestCard } from '@/components/medical/cards';
import { Button } from '@/components/ui/button';
import { ListScreen } from '@/components/ui/list-screen';
import { useRefresh } from '@/hooks/use-refresh';
import { useGetRequestsQuery } from '@/redux/features/management-requests';

export default function RequestsScreen() {
  const requests = useGetRequestsQuery();
  const { refreshing, onRefresh } = useRefresh(requests.refetch);

  return (
    <ListScreen
      data={requests.data}
      keyExtractor={(r) => r.id}
      isLoading={requests.isLoading}
      error={requests.error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onRetry={requests.refetch}
      header={
        requests.data?.length ? (
          <Button label="New request" icon={MessageSquarePlus} onPress={() => router.push('/contact')} />
        ) : null
      }
      renderItem={({ item }) => (
        <RequestCard request={item} onPress={() => router.push(`/requests/${item.id}`)} />
      )}
      empty={
        <EmptyState
          icon={MessageSquarePlus}
          title="No requests yet"
          message="Send a request to the clinic and follow its status here."
          actionLabel="Contact the clinic"
          onAction={() => router.push('/contact')}
        />
      }
    />
  );
}
