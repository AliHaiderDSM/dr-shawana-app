import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { RichTextEditor } from '@/components/doctor/rich-text-editor';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { errorMessage } from '@/lib/errors';
import { appointmentNumber, formatDay } from '@/lib/format';
import { useGetDoctorPatientFileQuery, useSaveDoctorRemarksMutation } from '@/redux/features/doctor';

export default function DoctorRemarksScreen() {
  const { consultationId = '', patientId = '' } = useLocalSearchParams<{
    consultationId: string;
    patientId: string;
  }>();
  const file = useGetDoctorPatientFileQuery(patientId, { skip: !patientId });
  const remark = file.data?.remarks.find((r) => r.consultationId === consultationId);
  const [save, { isLoading }] = useSaveDoctorRemarksMutation();

  if (file.isLoading)
    return (
      <Screen>
        <CardSkeleton count={2} />
      </Screen>
    );
  if (!remark || !remark.editable)
    return (
      <Screen>
        <ErrorState
          error={file.error ?? new Error('You can edit only your own consultations.')}
          onRetry={file.refetch}
          retrying={file.isFetching}
        />
      </Screen>
    );

  const submit = async (remarks: string | null) => {
    try {
      await save({ consultationId: remark.consultationId, patientId, remarks }).unwrap();
      router.back();
    } catch (error) {
      Alert.alert('Remarks not saved', errorMessage(error));
    }
  };

  return (
    <RichTextEditor
      key={remark.consultationId}
      initialHtml={remark.remarks}
      label="Clinical remarks"
      placeholder="Write the clinical remarks for this visit"
      saveLabel="Save remarks"
      saving={isLoading}
      onSave={(html) => void submit(html)}
      header={
        <>
          <AppText weight="semibold">Visit #{appointmentNumber(remark)}</AppText>
          <AppText variant="caption" tone="muted">
            {formatDay(remark.date)} · shows in the patient history and on the dashboard
          </AppText>
        </>
      }
    />
  );
}
