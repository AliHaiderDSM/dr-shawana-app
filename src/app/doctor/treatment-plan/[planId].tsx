import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { RichTextEditor } from '@/components/doctor/rich-text-editor';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { errorMessage } from '@/lib/errors';
import { formatDay } from '@/lib/format';
import {
  useAddDoctorTreatmentPlanMutation,
  useGetDoctorPatientFileQuery,
  useUpdateDoctorTreatmentPlanMutation,
} from '@/redux/features/doctor';

const NEW_PLAN = 'new';

export default function DoctorTreatmentPlanScreen() {
  const { planId = NEW_PLAN, patientId = '' } = useLocalSearchParams<{ planId: string; patientId: string }>();
  const creating = planId === NEW_PLAN;
  const file = useGetDoctorPatientFileQuery(patientId, { skip: !patientId });
  const existing = file.data?.plans?.find((p) => p.id === planId);
  const [add, adding] = useAddDoctorTreatmentPlanMutation();
  const [update, updating] = useUpdateDoctorTreatmentPlanMutation();

  if (file.isLoading)
    return (
      <Screen>
        <CardSkeleton count={2} />
      </Screen>
    );
  if (!file.data || (!creating && (!existing || !existing.editable)))
    return (
      <Screen>
        <ErrorState
          error={file.error ?? new Error('You can edit only the plans you wrote.')}
          onRetry={file.refetch}
          retrying={file.isFetching}
        />
      </Screen>
    );

  const submit = async (html: string | null) => {
    if (!html) {
      Alert.alert('Plan not saved', 'Write the plan of treatment first.');
      return;
    }
    try {
      if (creating) await add({ patientId, plan: html }).unwrap();
      else await update({ planId, patientId, plan: html }).unwrap();
      router.back();
    } catch (error) {
      Alert.alert('Plan not saved', errorMessage(error));
    }
  };

  return (
    <RichTextEditor
      key={planId}
      initialHtml={existing?.plan ?? null}
      label="Plan of treatment"
      placeholder="Write the plan of treatment for this patient"
      saveLabel={creating ? 'Add plan' : 'Save plan'}
      saving={adding.isLoading || updating.isLoading}
      onSave={(html) => void submit(html)}
      header={
        <>
          <AppText weight="semibold">{file.data.patient.name}</AppText>
          <AppText variant="caption" tone="muted">
            {creating ? 'New plan, dated today' : `Plan of ${formatDay(existing?.date ?? '')}`} · shows in the
            patient file
          </AppText>
        </>
      }
    />
  );
}
