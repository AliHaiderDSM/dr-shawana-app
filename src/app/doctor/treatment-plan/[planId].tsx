import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { PlanItemPicker } from '@/components/doctor/plan-item-picker';
import { RichTextEditor } from '@/components/doctor/rich-text-editor';
import { CardSkeleton, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { errorMessage } from '@/lib/errors';
import { formatDay } from '@/lib/format';
import {
  type PatientFilePlan,
  useAddDoctorTreatmentPlanMutation,
  useGetDoctorPatientFileQuery,
  useGetDoctorPlanOptionsQuery,
  useUpdateDoctorTreatmentPlanMutation,
} from '@/redux/features/doctor';

const NEW_PLAN = 'new';

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

function PlanEditor({
  planId,
  patientId,
  patientName,
  existing,
  focus,
}: {
  planId: string;
  patientId: string;
  patientName: string;
  existing: PatientFilePlan | undefined;
  focus: string | undefined;
}) {
  const creating = !existing;
  const initialIds = (existing?.items ?? []).map((i) => i.catalogItemId);
  const [ids, setIds] = useState<string[]>(initialIds);
  const options = useGetDoctorPlanOptionsQuery();
  const [add, adding] = useAddDoctorTreatmentPlanMutation();
  const [update, updating] = useUpdateDoctorTreatmentPlanMutation();
  const toggle = (id: string) =>
    setIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const submit = async (html: string | null) => {
    if (!html && ids.length === 0) {
      Alert.alert('Plan not saved', 'Write the plan or tick a medicine or blood test.');
      return;
    }
    try {
      const body = { plan: html, catalogItemIds: ids };
      if (creating) await add({ patientId, ...body }).unwrap();
      else await update({ planId, patientId, ...body }).unwrap();
      router.back();
    } catch (error) {
      Alert.alert('Plan not saved', errorMessage(error));
    }
  };

  return (
    <RichTextEditor
      initialHtml={existing?.plan ?? null}
      label="Plan of treatment"
      placeholder="Write the plan of treatment for this patient"
      saveLabel={creating ? 'Add plan' : 'Save plan'}
      saving={adding.isLoading || updating.isLoading}
      extraChanged={!sameIds(ids, initialIds)}
      autoFocus={!focus}
      onSave={(html) => void submit(html)}
      header={
        <>
          <AppText weight="semibold">{patientName}</AppText>
          <AppText variant="caption" tone="muted">
            {creating ? 'New plan, dated today' : `Plan of ${formatDay(existing.date)}`} · shows in the
            patient file
          </AppText>
        </>
      }
    >
      <PlanItemPicker
        title="Medicines"
        addLabel="Add medicines"
        options={options.data?.medicines ?? []}
        selected={ids}
        loading={options.isLoading}
        onToggle={toggle}
        defaultOpen={focus === 'medicines'}
      />
      <PlanItemPicker
        title="Blood work"
        addLabel="Add blood tests"
        options={options.data?.bloodWork ?? []}
        selected={ids}
        loading={options.isLoading}
        onToggle={toggle}
        defaultOpen={focus === 'blood_work'}
      />
    </RichTextEditor>
  );
}

export default function DoctorTreatmentPlanScreen() {
  const {
    planId = NEW_PLAN,
    patientId = '',
    focus,
  } = useLocalSearchParams<{ planId: string; patientId: string; focus?: string }>();
  const creating = planId === NEW_PLAN;
  const file = useGetDoctorPatientFileQuery(patientId, { skip: !patientId });
  const existing = file.data?.plans?.find((p) => p.id === planId);

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

  return (
    <PlanEditor
      key={planId}
      planId={planId}
      patientId={patientId}
      patientName={file.data.patient.name}
      existing={creating ? undefined : existing}
      focus={focus}
    />
  );
}
