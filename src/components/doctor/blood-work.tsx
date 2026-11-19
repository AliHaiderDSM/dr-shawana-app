import { ChevronsLeft, FlaskConical } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { colors, icon, radius, shadow, space } from '@/theme/tokens';
import type { BloodTest, BloodWork } from '@/redux/features/doctor';

const TESTS: { test: BloodTest; label: string; unit: string }[] = [
  { test: 'fsh', label: 'FSH', unit: 'mIU/mL' },
  { test: 'estradiol', label: 'Estradiol', unit: 'pg/mL' },
  { test: 'testosterone_free', label: 'Testosterone (Free)', unit: 'pg/mL' },
  { test: 'testosterone_total', label: 'Testosterone (Total)', unit: 'ng/dL' },
  { test: 'dhea_s', label: 'DHEA-Sulphate', unit: 'µg/dL' },
  { test: 'vit_d3', label: 'Vit D3', unit: 'µg/dL' },
  { test: 'tsh', label: 'TSH', unit: 'µIU/mL' },
  { test: 'ferritin', label: 'Ferritin', unit: 'ng/mL' },
  { test: 'b12', label: 'B12', unit: 'pg/mL' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NAME_WIDTH = 132;
const MIN_CELL = 84;

const shortDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''} ${y?.slice(2) ?? ''}`;
};

const num = (value: number) => String(Number(value.toFixed(2)));

export function BloodWorkView({ data }: { data: BloodWork }) {
  const [width, setWidth] = useState(0);
  const tableScroll = useRef<ScrollView>(null);
  const dates = data.dates;

  if (data.tests.length === 0 || dates.length === 0)
    return (
      <EmptyState
        icon={FlaskConical}
        title="No blood work yet"
        message="Results the clinic adds or reads from lab reports show here as a table."
      />
    );

  const fit = width > 0 ? (width - NAME_WIDTH) / Math.max(dates.length, 1) : MIN_CELL;
  const cell = Math.max(MIN_CELL, Math.floor(fit));
  const scrolls = width > 0 && cell * dates.length > width - NAME_WIDTH + 1;
  const units = new Map(data.tests.map((t) => [t.test, t.unit]));

  return (
    <View style={styles.card}>
      <View style={styles.tableHead}>
        <AppText weight="semibold">All results</AppText>
        <AppText variant="caption" tone="muted">
          {dates.length} test date{dates.length === 1 ? '' : 's'} · newest on the right
        </AppText>
      </View>
      {scrolls ? (
        <View style={styles.swipe}>
          <ChevronsLeft size={icon.sm} color={colors.textMuted} />
          <AppText variant="caption" tone="muted">
            Swipe right to see older results
          </AppText>
        </View>
      ) : null}
      <View style={styles.table} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.nameColumn}>
          <View style={[styles.cell, styles.headCell, styles.nameCell]}>
            <AppText variant="caption" weight="semibold" tone="muted">
              Blood test
            </AppText>
          </View>
          {TESTS.map((t) => {
            const has = units.has(t.test);
            return (
              <View key={t.test} style={[styles.cell, styles.nameCell]}>
                <AppText
                  variant="caption"
                  weight="semibold"
                  numberOfLines={1}
                  tone={has ? undefined : 'muted'}
                >
                  {t.label}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {units.get(t.test) ?? t.unit}
                </AppText>
              </View>
            );
          })}
        </View>
        <ScrollView
          ref={tableScroll}
          horizontal
          showsHorizontalScrollIndicator={scrolls}
          onContentSizeChange={() => tableScroll.current?.scrollToEnd({ animated: false })}
          style={styles.flex}
        >
          <View>
            <View style={styles.row}>
              {dates.map((date) => (
                <View key={date} style={[styles.cell, styles.headCell, styles.valueCell, { width: cell }]}>
                  <AppText variant="caption" weight="semibold" tone="muted" numberOfLines={1}>
                    {shortDate(date)}
                  </AppText>
                </View>
              ))}
            </View>
            {TESTS.map((t) => {
              const row = data.tests.find((s) => s.test === t.test);
              return (
                <View key={t.test} style={styles.row}>
                  {dates.map((date) => {
                    const point = row?.points.find((p) => p.date === date);
                    return (
                      <View key={date} style={[styles.cell, styles.valueCell, { width: cell }]}>
                        <AppText
                          variant="label"
                          weight={point ? 'semibold' : undefined}
                          tone={point ? undefined : 'muted'}
                        >
                          {point ? num(point.value) : '—'}
                        </AppText>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    padding: space.md,
  },
  swipe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },
  table: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  nameColumn: { width: NAME_WIDTH, backgroundColor: colors.surface },
  row: { flexDirection: 'row' },
  cell: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headCell: { height: 36, backgroundColor: colors.surfaceMuted },
  nameCell: {
    paddingLeft: space.md,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  valueCell: { alignItems: 'center' },
});
