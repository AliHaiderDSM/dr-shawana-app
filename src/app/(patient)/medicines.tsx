import { router } from 'expo-router';
import { Pill } from 'lucide-react-native';
import { EmptyState } from '@/components/feedback/states';
import { MedicineVisitCard } from '@/components/medicines/medicine-visit-card';
import { AppText } from '@/components/ui/app-text';
import { ListScreen } from '@/components/ui/list-screen';
import { useRefresh } from '@/hooks/use-refresh';
import { useGetMedicinesQuery } from '@/redux/features/intake';

export default function MedicinesScreen() {
  const medicines = useGetMedicinesQuery();
  const { refreshing, onRefresh } = useRefresh(medicines.refetch);
  return (
    <ListScreen
      data={medicines.data}
      keyExtractor={(v) => v.prescriptionId}
      isLoading={medicines.isLoading}
      error={medicines.error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onRetry={medicines.refetch}
      header={
        medicines.data?.length ? (
          <AppText tone="muted" variant="label">
            Medicines and supplements from every visit, newest first. Tap a visit to see the full
            prescription.
          </AppText>
        ) : null
      }
      renderItem={({ item }) => (
        <MedicineVisitCard visit={item} onOpen={() => router.push(`/prescriptions/${item.prescriptionId}`)} />
      )}
      empty={
        <EmptyState
          icon={Pill}
          title="No medicines yet"
          message="Medicines and supplements your doctor prescribes will show here after each visit."
        />
      }
    />
  );
}
