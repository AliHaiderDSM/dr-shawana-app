import { router } from 'expo-router';
import { Pill } from 'lucide-react-native';
import { EmptyState } from '@/components/feedback/states';
import { PrescriptionCard } from '@/components/medical/cards';
import { ListScreen } from '@/components/ui/list-screen';
import { useRefresh } from '@/hooks/use-refresh';
import { useGetPrescriptionsQuery } from '@/redux/features/prescriptions';

export default function PrescriptionsScreen() {
  const prescriptions = useGetPrescriptionsQuery();
  const { refreshing, onRefresh } = useRefresh(prescriptions.refetch);

  return (
    <ListScreen
      data={prescriptions.data}
      keyExtractor={(p) => p.id}
      isLoading={prescriptions.isLoading}
      error={prescriptions.error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onRetry={prescriptions.refetch}
      renderItem={({ item }) => (
        <PrescriptionCard prescription={item} onPress={() => router.push(`/prescriptions/${item.id}`)} />
      )}
      empty={
        <EmptyState
          icon={Pill}
          title="No prescriptions yet"
          message="Prescriptions your doctor writes for you will appear here."
        />
      }
    />
  );
}
