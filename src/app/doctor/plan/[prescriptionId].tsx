import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { RichTextEditor } from '@/components/doctor/rich-text-editor';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { errorMessage } from '@/lib/errors';
import { formatDay } from '@/lib/format';
import { useGetDoctorPatientFileQuery, useSaveDoctorPlanMutation } from '@/redux/features/doctor';

export default function DoctorPlanScreen() {
  const { prescriptionId = '', patientId = '' } = useLocalSearchParams<{
    prescriptionId: string;
    patientId: string;
  }>();
  const file = useGetDoctorPatientFileQuery(patientId, { skip: !patientId });
  const prescription = file.data?.prescriptions.find((p) => p.id === prescriptionId);
  const [save, { isLoading }] = useSaveDoctorPlanMutation();

  if (file.isLoading)
    return (
      <Screen>
        <CardSkeleton count={2} />
      </Screen>
    );
  if (!prescription || !prescription.editable)
    return (
      <Screen>
        <ErrorState
          error={file.error ?? new Error('You can edit only your own prescriptions.')}
          onRetry={file.refetch}
          retrying={file.isFetching}
        />
      </Screen>
    );

  const submit = async (planTreatment: string | null) => {
    try {
      await save({ prescriptionId: prescription.id, patientId, planTreatment }).unwrap();
      router.back();
    } catch (error) {
      Alert.alert('Plan not saved', errorMessage(error));
    }
  };

  return (
    <RichTextEditor
      key={prescription.id}
      initialHtml={prescription.planTreatment}
      label="Plan of treatment"
      placeholder="Write the plan of treatment for this patient"
      saveLabel="Save plan"
      saving={isLoading}
      onSave={(html) => void submit(html)}
      header={
        <>
          <AppText weight="semibold">Prescription #{prescription.prescriptionNo}</AppText>
          <AppText variant="caption" tone="muted">
            {formatDay(prescription.date)} · prints on the prescription and shows in the patient app
          </AppText>
        </>
      }
    />
  );
}
