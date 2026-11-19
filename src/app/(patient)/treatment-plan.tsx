import { useLocalSearchParams } from 'expo-router';
import { Building2, FlaskConical, NotebookPen, Pill, Stethoscope } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Notice } from '@/components/ui/bits';
import { RichTextView } from '@/components/ui/rich-text-view';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDay } from '@/lib/format';
import { htmlToMarkup } from '@/lib/rich-text';
import { colors, icon, radius, shadow, space } from '@/theme/tokens';
import { type TreatmentPlan, useGetTreatmentPlansQuery } from '@/redux/features/prescriptions';

type Section = 'plan' | 'medicines' | 'blood_work';

const SECTIONS: { key: Section; label: string; icon: typeof Pill; empty: string }[] = [
  {
    key: 'plan',
    label: 'Plan',
    icon: NotebookPen,
    empty: 'When your doctor writes a plan of treatment for you, it shows here.',
  },
  {
    key: 'medicines',
    label: 'Medicines',
    icon: Pill,
    empty: 'Medicines your doctor adds to your plan show here.',
  },
  {
    key: 'blood_work',
    label: 'Blood work',
    icon: FlaskConical,
    empty: 'Blood tests your doctor asks for show here.',
  },
];

const written = (plan: TreatmentPlan) => Boolean(htmlToMarkup(plan.plan).trim());

const inSection = (plan: TreatmentPlan, section: Section) =>
  section === 'plan'
    ? written(plan)
    : section === 'medicines'
      ? plan.medicines.length > 0
      : plan.bloodWork.length > 0;

const wasEdited = (plan: TreatmentPlan) =>
  new Date(plan.updatedAt).getTime() - new Date(plan.createdAt).getTime() > 5000;

function Tabs({
  value,
  counts,
  onChange,
}: {
  value: Section;
  counts: Record<Section, number>;
  onChange: (next: Section) => void;
}) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {SECTIONS.map((s) => {
        const on = s.key === value;
        const Icon = s.icon;
        return (
          <Pressable
            key={s.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${s.label}, ${counts[s.key]}`}
            onPress={() => onChange(s.key)}
            style={[styles.tab, on && styles.tabOn]}
          >
            <Icon size={icon.sm} color={on ? colors.primary : colors.textMuted} />
            <AppText variant="label" weight="semibold" tone={on ? 'primary' : 'muted'} numberOfLines={1}>
              {s.label}
            </AppText>
            <View style={[styles.count, on && styles.countOn]}>
              <AppText variant="caption" weight="bold" tone={on ? 'primary' : 'muted'}>
                {counts[s.key]}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Entry({
  plan,
  last,
  highlighted,
  children,
}: {
  plan: TreatmentPlan;
  last: boolean;
  highlighted: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.entry}>
      <View style={styles.rail}>
        <View style={[styles.dot, highlighted && styles.dotOn]} />
        {last ? null : <View style={styles.line} />}
      </View>
      <View style={styles.flex}>
        <View style={styles.dateRow}>
          <AppText variant="caption" weight="semibold" tone="primary" style={styles.flex}>
            {formatDay(plan.date)}
          </AppText>
          {highlighted ? <StatusBadge label={wasEdited(plan) ? 'Updated' : 'New'} tone="primary" /> : null}
        </View>
        <View style={[styles.card, highlighted && styles.cardOn]}>
          {children}
          <View style={styles.source}>
            {plan.doctor ? (
              <View style={styles.sourceItem}>
                <Stethoscope size={icon.sm} color={colors.textMuted} />
                <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.flex}>
                  {plan.doctor}
                </AppText>
              </View>
            ) : null}
            {plan.branch ? (
              <View style={styles.sourceItem}>
                <Building2 size={icon.sm} color={colors.textMuted} />
                <AppText variant="caption" tone="muted" numberOfLines={1} style={styles.flex}>
                  {plan.branch} branch
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function ItemList({ items }: { items: { name: string; detail?: string | null }[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item.name}-${index}`} style={[styles.item, index > 0 && styles.itemBorder]}>
          <View style={styles.bullet} />
          <View style={styles.flex}>
            <AppText weight="semibold">{item.name}</AppText>
            {item.detail ? (
              <AppText variant="label" tone="muted">
                {item.detail}
              </AppText>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function SectionBody({ plan, section }: { plan: TreatmentPlan; section: Section }) {
  if (section === 'plan') return <RichTextView html={plan.plan} />;
  if (section === 'medicines')
    return <ItemList items={plan.medicines.map((m) => ({ name: m.name, detail: m.dose }))} />;
  return <ItemList items={plan.bloodWork.map((b) => ({ name: b.name, detail: b.groupName }))} />;
}

function firstSection(plan: TreatmentPlan | undefined, plans: TreatmentPlan[]): Section {
  const order: Section[] = ['plan', 'medicines', 'blood_work'];
  if (plan) return order.find((s) => inSection(plan, s)) ?? 'plan';
  return order.find((s) => plans.some((p) => inSection(p, s))) ?? 'plan';
}

function Plans({ plans, planId }: { plans: TreatmentPlan[]; planId: string | undefined }) {
  const target = plans.find((p) => p.id === planId);
  const [section, setSection] = useState<Section>(() => firstSection(target, plans));
  const counts = useMemo(
    () => ({
      plan: plans.filter((p) => inSection(p, 'plan')).length,
      medicines: plans.filter((p) => inSection(p, 'medicines')).length,
      blood_work: plans.filter((p) => inSection(p, 'blood_work')).length,
    }),
    [plans],
  );
  const shown = plans.filter((p) => inSection(p, section));
  const meta = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0]!;

  return (
    <>
      <Tabs value={section} counts={counts} onChange={setSection} />
      {shown.length ? (
        <View>
          {shown.map((plan, index) => (
            <Entry
              key={plan.id}
              plan={plan}
              last={index === shown.length - 1}
              highlighted={plan.id === planId}
            >
              <SectionBody plan={plan} section={section} />
            </Entry>
          ))}
        </View>
      ) : (
        <EmptyState icon={meta.icon} title={`No ${meta.label.toLowerCase()} yet`} message={meta.empty} />
      )}
    </>
  );
}

export default function TreatmentPlanScreen() {
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const plans = useGetTreatmentPlansQuery(undefined, { refetchOnMountOrArgChange: true });
  const { refreshing, onRefresh } = useRefresh(plans.refetch);

  if (plans.isLoading)
    return (
      <Screen>
        <CardSkeleton count={3} />
      </Screen>
    );
  if (!plans.data)
    return (
      <Screen>
        <ErrorState error={plans.error} onRetry={plans.refetch} retrying={plans.isFetching} />
      </Screen>
    );

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {plans.data.length ? (
        <>
          <Notice>
            The plan your doctor made for you, newest first. Take medicines only as your doctor advised.
          </Notice>
          <Plans key={planId ?? 'all'} plans={plans.data} planId={planId} />
        </>
      ) : (
        <EmptyState
          icon={NotebookPen}
          title="No plan yet"
          message="When your doctor writes a plan of treatment, medicines or blood tests for you, they show here."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  tabs: {
    flexDirection: 'row',
    padding: space.xs,
    gap: space.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxs,
    paddingHorizontal: space.xxs,
    minHeight: 40,
    borderRadius: radius.sm,
  },
  tabOn: { backgroundColor: colors.surface, ...shadow },
  count: {
    minWidth: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  countOn: { backgroundColor: colors.primarySoft },
  entry: { flexDirection: 'row', gap: space.md },
  rail: { width: 14, alignItems: 'center' },
  dot: {
    width: 12,
    height: 12,
    marginTop: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primarySoft,
  },
  dotOn: { width: 14, height: 14, borderColor: colors.primary },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: space.xxs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.xs },
  card: {
    gap: space.sm,
    padding: space.md,
    marginBottom: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  cardOn: { borderWidth: 2, borderColor: colors.primary },
  source: {
    gap: space.xxs,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sourceItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, paddingVertical: space.xs },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  bullet: { width: 6, height: 6, marginTop: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
});
