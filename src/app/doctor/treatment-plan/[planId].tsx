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

type Focus = 'plan' | 'medicines' | 'blood_work';

const COPY: Record<Focus | 'all', { title: string; add: string; empty: string }> = {
  all: {
    title: 'Plan of treatment',
    add: 'Add plan',
    empty: 'Write the plan or tick a medicine or blood test.',
  },
  plan: { title: 'Plan of treatment', add: 'Add plan', empty: 'Write the plan of treatment first.' },
  medicines: { title: 'Medicines', add: 'Add medicines', empty: 'Tick at least one medicine.' },
  blood_work: { title: 'Blood work', add: 'Add blood tests', empty: 'Tick at least one blood test.' },
};

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
  const showText = !focus || focus === 'plan';
  const showMedicines = !focus || focus === 'medicines';
  const showBloodWork = !focus || focus === 'blood_work';
  const initialIds = (existing?.items ?? []).map((i) => i.catalogItemId);
  const [ids, setIds] = useState<string[]>(initialIds);
  const options = useGetDoctorPlanOptionsQuery();
  const [add, adding] = useAddDoctorTreatmentPlanMutation();
  const [update, updating] = useUpdateDoctorTreatmentPlanMutation();
  const toggle = (id: string) =>
    setIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  const copy = COPY[showText && !focus ? 'all' : (focus as Focus)] ?? COPY.all;

  const submit = async (written: string | null) => {
    const html = showText ? written : (existing?.plan ?? null);
    if (!html && ids.length === 0) {
      Alert.alert('Not saved', copy.empty);
      return;
    }
    try {
      const body = { plan: html, catalogItemIds: ids };
      if (creating) await add({ patientId, ...body }).unwrap();
      else await update({ planId, patientId, ...body }).unwrap();
      router.back();
    } catch (error) {
      Alert.alert('Not saved', errorMessage(error));
    }
  };

  return (
    <RichTextEditor
      initialHtml={existing?.plan ?? null}
      label="Plan of treatment"
      placeholder="Write the plan of treatment for this patient"
      saveLabel={creating ? copy.add : 'Save'}
      saving={adding.isLoading || updating.isLoading}
      extraChanged={!sameIds(ids, initialIds)}
      autoFocus={showText}
      showText={showText}
      onSave={(html) => void submit(html)}
      header={
        <>
          <AppText weight="semibold">{patientName}</AppText>
          <AppText variant="caption" tone="muted">
            {copy.title} · {creating ? 'dated today' : formatDay(existing.date)}
          </AppText>
        </>
      }
    >
      {showMedicines ? (
        <PlanItemPicker
          title="Medicines"
          addLabel="Add medicines"
          options={options.data?.medicines ?? []}
          selected={ids}
          loading={options.isLoading}
          onToggle={toggle}
          defaultOpen={focus === 'medicines'}
        />
      ) : null}
      {showBloodWork ? (
        <PlanItemPicker
          title="Blood work"
          addLabel="Add blood tests"
          options={options.data?.bloodWork ?? []}
          selected={ids}
          loading={options.isLoading}
          onToggle={toggle}
          defaultOpen={focus === 'blood_work'}
        />
      ) : null}
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
