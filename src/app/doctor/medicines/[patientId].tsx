import { Stack, useLocalSearchParams } from 'expo-router';
import { Pill } from 'lucide-react-native';
import { EmptyState } from '@/components/feedback/states';
import { MedicineVisitCard } from '@/components/medicines/medicine-visit-card';
import { AppText } from '@/components/ui/app-text';
import { ListScreen } from '@/components/ui/list-screen';
import { useRefresh } from '@/hooks/use-refresh';
import { useGetDoctorPatientMedicinesQuery } from '@/redux/features/doctor';

export default function DoctorPatientMedicinesScreen() {
  const { patientId = '', name } = useLocalSearchParams<{ patientId: string; name?: string }>();
  const medicines = useGetDoctorPatientMedicinesQuery(patientId);
  const { refreshing, onRefresh } = useRefresh(medicines.refetch);
  return (
    <>
      {name ? <Stack.Screen options={{ title: name }} /> : null}
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
              Medicines and supplements from every prescription, newest first.
            </AppText>
          ) : null
        }
        renderItem={({ item }) => <MedicineVisitCard visit={item} />}
        empty={
          <EmptyState
            icon={Pill}
            title="No medicines yet"
            message="Medicines and supplements prescribed to this patient will show here."
          />
        }
      />
    </>
  );
}
