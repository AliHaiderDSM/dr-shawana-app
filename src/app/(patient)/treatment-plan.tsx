import { useLocalSearchParams } from 'expo-router';
import { FlaskConical, NotebookPen, Pill, Stethoscope } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/feedback/states';
import { PrescriptionHeading } from '@/components/prescription-sections';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ListScreen } from '@/components/ui/list-screen';
import { RichTextView } from '@/components/ui/rich-text-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDate } from '@/lib/format';
import { htmlToMarkup } from '@/lib/rich-text';
import { colors, icon, radius, space } from '@/theme/tokens';
import { type TreatmentPlan, useGetTreatmentPlansQuery } from '@/redux/features/prescriptions';

function Line({ name, detail }: { name: string; detail?: string | null }) {
  return (
    <View style={styles.line}>
      <View style={styles.bullet} />
      <AppText style={styles.flex}>
        <AppText weight="semibold">{name}</AppText>
        {detail ? ` — ${detail}` : ''}
      </AppText>
    </View>
  );
}

const wasEdited = (plan: TreatmentPlan) =>
  new Date(plan.updatedAt).getTime() - new Date(plan.createdAt).getTime() > 5000;

function PlanCard({ plan, highlighted }: { plan: TreatmentPlan; highlighted: boolean }) {
  const written = Boolean(htmlToMarkup(plan.plan).trim());
  return (
    <Card style={highlighted ? styles.highlighted : undefined}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <AppText variant="subheading" tone="primary" style={styles.flex}>
            {formatDate(plan.date)}
          </AppText>
          {highlighted ? <StatusBadge label={wasEdited(plan) ? 'Updated' : 'New'} tone="primary" /> : null}
        </View>
        {plan.doctor ? (
          <View style={styles.doctor}>
            <Stethoscope size={icon.sm} color={colors.textMuted} />
            <AppText variant="label" tone="muted" numberOfLines={1} style={styles.flex}>
              {[plan.doctor, plan.branch].filter(Boolean).join(' · ')}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.blocks}>
        {written ? (
          <View style={styles.block}>
            <PrescriptionHeading title="Plan of treatment" />
            <RichTextView html={plan.plan} />
          </View>
        ) : null}
        {plan.medicines.length ? (
          <View style={styles.block}>
            <PrescriptionHeading title="Medicines" />
            {plan.medicines.map((m, index) => (
              <Line key={`${m.name}-${index}`} name={m.name} detail={m.dose} />
            ))}
          </View>
        ) : null}
        {plan.bloodWork.length ? (
          <View style={styles.block}>
            <PrescriptionHeading title="Blood work" />
            {plan.bloodWork.map((b, index) => (
              <Line key={`${b.name}-${index}`} name={b.name} />
            ))}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export default function TreatmentPlanScreen() {
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const plans = useGetTreatmentPlansQuery(undefined, { refetchOnMountOrArgChange: true });
  const { refreshing, onRefresh } = useRefresh(plans.refetch);
  const ordered = useMemo(() => {
    const list = plans.data ?? [];
    const picked = list.find((p) => p.id === planId);
    return picked ? [picked, ...list.filter((p) => p.id !== planId)] : plans.data;
  }, [plans.data, planId]);
  return (
    <ListScreen
      data={ordered}
      keyExtractor={(p) => p.id}
      isLoading={plans.isLoading}
      error={plans.error}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onRetry={plans.refetch}
      header={
        plans.data?.length ? (
          <View style={styles.intro}>
            <View style={styles.legend}>
              <NotebookPen size={icon.sm} color={colors.primary} />
              <Pill size={icon.sm} color={colors.primary} />
              <FlaskConical size={icon.sm} color={colors.primary} />
            </View>
            <AppText tone="muted" variant="label">
              Your plan of treatment, medicines and blood tests from your doctor, newest first. Take medicines
              only as your doctor advised.
            </AppText>
          </View>
        ) : null
      }
      renderItem={({ item }) => <PlanCard plan={item} highlighted={item.id === planId} />}
      empty={
        <EmptyState
          icon={NotebookPen}
          title="No plan yet"
          message="When your doctor writes a plan of treatment, medicines or blood tests for you, they show here."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  intro: { gap: space.xs },
  legend: { flexDirection: 'row', gap: space.sm },
  head: { gap: space.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  highlighted: { borderWidth: 2, borderColor: colors.primary },
  doctor: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  blocks: { gap: space.lg, marginTop: space.sm },
  block: { gap: space.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bullet: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.primary },
});
