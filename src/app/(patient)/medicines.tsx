import { router } from 'expo-router';
import { ChevronRight, Pill } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { ListScreen } from '@/components/ui/list-screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRefresh } from '@/hooks/use-refresh';
import { formatDay } from '@/lib/format';
import { type MedicineItem, type MedicineVisit, useGetMedicinesQuery } from '@/redux/features/intake';
import { colors, icon, space } from '@/theme/tokens';

const SECTIONS = [
  { category: 'medicine', title: 'Medicines' },
  { category: 'supplement', title: 'Supplements' },
] as const;

function groupItems(items: MedicineItem[]) {
  return SECTIONS.map((s) => [s.title, items.filter((i) => i.category === s.category)] as const).filter(
    ([, list]) => list.length > 0,
  );
}

function VisitCard({ visit }: { visit: MedicineVisit }) {
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Prescription of ${formatDay(visit.date)}`}
        onPress={() => router.push(`/prescriptions/${visit.prescriptionId}`)}
        style={styles.head}
      >
        <View style={styles.flex}>
          <AppText weight="semibold">{formatDay(visit.date)}</AppText>
          <AppText variant="label" tone="muted">
            Prescription #{visit.prescriptionNo}
            {visit.doctor ? ` · ${visit.doctor}` : ''}
          </AppText>
        </View>
        <ChevronRight size={icon.md} color={colors.textMuted} />
      </Pressable>
      {groupItems(visit.items).map(([group, items]) => (
        <View key={group} style={styles.group}>
          <AppText variant="subheading" weight="bold" tone="primary" accessibilityRole="header">
            {group}
          </AppText>
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemHead}>
                <AppText weight="semibold" style={styles.flex}>
                  {item.name}
                </AppText>
                {item.optional ? <StatusBadge label="Optional" tone="neutral" /> : null}
              </View>
              {item.dose ? <AppText variant="label">{item.dose}</AppText> : null}
              {item.instructions ? (
                <AppText variant="label" tone="muted">
                  {item.instructions}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </Card>
  );
}

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
      renderItem={({ item }) => <VisitCard visit={item} />}
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

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  group: {
    gap: space.xs,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: { gap: space.xxs, paddingVertical: space.xs },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
