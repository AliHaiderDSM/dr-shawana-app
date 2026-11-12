import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDay } from '@/lib/format';
import type { MedicineItem, MedicineVisit } from '@/redux/features/intake';
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

function VisitHead({ visit }: { visit: MedicineVisit }) {
  return (
    <View style={styles.flex}>
      <AppText weight="semibold">{formatDay(visit.date)}</AppText>
      <AppText variant="label" tone="muted">
        Prescription #{visit.prescriptionNo}
        {visit.doctor ? ` · ${visit.doctor}` : ''}
      </AppText>
    </View>
  );
}

export function MedicineVisitCard({ visit, onOpen }: { visit: MedicineVisit; onOpen?: () => void }) {
  return (
    <Card>
      {onOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Prescription of ${formatDay(visit.date)}`}
          onPress={onOpen}
          style={styles.head}
        >
          <VisitHead visit={visit} />
          <ChevronRight size={icon.md} color={colors.textMuted} />
        </Pressable>
      ) : (
        <View style={styles.head}>
          <VisitHead visit={visit} />
        </View>
      )}
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
