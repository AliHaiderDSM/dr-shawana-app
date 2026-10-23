import { ChevronsLeft, FlaskConical, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { chart, colors, fontSize, icon, radius, shadow, space } from '@/theme/tokens';
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

const LABELS = Object.fromEntries(TESTS.map((t) => [t.test, t.label])) as Record<BloodTest, string>;

const ALL = 'all';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_HEIGHT = 240;
const DATE_HEIGHT = 28;
const VALUE_HEIGHT = 18;
const AXIS_WIDTH = 40;
const BAR_GAP = 2;
const GROUP_GAP = space.lg;
const NAME_WIDTH = 132;
const MIN_CELL = 84;

const shortDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''} ${y?.slice(2) ?? ''}`;
};

const num = (value: number) => String(Number(value.toFixed(2)));

type Series = BloodWork['tests'][number];

const styleOf = (test: BloodTest) => {
  const index = Math.max(
    0,
    TESTS.findIndex((t) => t.test === test),
  );
  return { color: chart[index % chart.length] ?? colors.primary, outlined: index >= chart.length };
};

const barFill = (test: BloodTest) => {
  const st = styleOf(test);
  return st.outlined
    ? { backgroundColor: colors.surface, borderWidth: 2, borderColor: st.color }
    : { backgroundColor: st.color };
};

const stepFor = (high: number) => {
  const raw = high / 4 || 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((step) => step >= raw) ?? 10 * power;
};

function Swatch({ test }: { test: BloodTest }) {
  return <View style={[styles.swatch, barFill(test)]} />;
}

function Chart({
  dates,
  series,
  picked,
  onPick,
}: {
  dates: string[];
  series: Series[];
  picked: number;
  onPick: (index: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const high = Math.max(0, ...series.flatMap((s) => s.points.map((p) => p.value)));
  const step = stepFor(high);
  const top = Math.max(step, Math.ceil(high / step) * step);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const plotH = CHART_HEIGHT - DATE_HEIGHT - VALUE_HEIGHT;
  const barW = series.length === 1 ? 28 : series.length <= 3 ? 14 : 8;
  const groupW = series.length * barW + (series.length - 1) * BAR_GAP;
  const slotW = Math.max(groupW + GROUP_GAP, (width - AXIS_WIDTH) / Math.max(dates.length, 1));
  const y = (v: number) => VALUE_HEIGHT + plotH - (v / top) * plotH;
  const labelled = series.length === 1;

  return (
    <View style={styles.chartRow} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.axis}>
        {ticks.map((t) => (
          <AppText key={t} variant="caption" tone="muted" style={[styles.tick, { top: y(t) - 8 }]}>
            {num(t)}
          </AppText>
        ))}
      </View>
      {width > 0 ? (
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
          style={styles.flex}
        >
          <View style={{ width: slotW * dates.length, height: CHART_HEIGHT }}>
            {ticks.map((t) => (
              <View key={t} style={[styles.grid, t === 0 && styles.baseline, { top: y(t) }]} />
            ))}
            <View style={styles.groups}>
              {dates.map((date, i) => {
                const on = i === picked;
                return (
                  <Pressable
                    key={date}
                    accessibilityRole="button"
                    accessibilityLabel={`Show the values of ${shortDate(date)}`}
                    accessibilityState={{ selected: on }}
                    onPress={() => onPick(i)}
                    style={[styles.group, { width: slotW }, on && styles.groupOn]}
                  >
                    <View style={[styles.bars, { height: VALUE_HEIGHT + plotH }]}>
                      {series.map((s) => {
                        const point = s.points.find((p) => p.date === date);
                        const h = point ? Math.max(2, (point.value / top) * plotH) : 0;
                        return (
                          <View key={s.test} style={[styles.barSlot, { width: barW }]}>
                            {point && labelled ? (
                              <AppText
                                variant="caption"
                                weight="semibold"
                                numberOfLines={1}
                                style={styles.barValue}
                              >
                                {num(point.value)}
                              </AppText>
                            ) : null}
                            {point ? <View style={[styles.bar, barFill(s.test), { height: h }]} /> : null}
                          </View>
                        );
                      })}
                    </View>
                    <AppText
                      variant="caption"
                      tone={on ? undefined : 'muted'}
                      weight={on ? 'semibold' : undefined}
                      numberOfLines={1}
                      style={styles.dateLabel}
                    >
                      {shortDate(date)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.chartSpace} />
      )}
    </View>
  );
}

function Headline({ series }: { series: Series }) {
  const points = series.points;
  const latest = points[points.length - 1];
  const before = points[points.length - 2];
  if (!latest) return null;
  const change = before ? latest.value - before.value : null;
  const Trend = change !== null && change < 0 ? TrendingDown : TrendingUp;
  return (
    <View style={styles.headline}>
      <View style={styles.flex}>
        <AppText variant="caption" tone="muted">
          Latest · {shortDate(latest.date)}
        </AppText>
        <View style={styles.valueRow}>
          <AppText variant="title">{num(latest.value)}</AppText>
          <AppText variant="label" tone="muted">
            {series.unit}
          </AppText>
        </View>
      </View>
      {change !== null && before ? (
        <View style={styles.change}>
          {change !== 0 ? <Trend size={icon.sm} color={colors.textMuted} /> : null}
          <AppText variant="caption" weight="semibold" tone="muted">
            {change === 0 ? 'No change' : `${change > 0 ? '+' : ''}${num(change)}`} since{' '}
            {shortDate(before.date)}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function ValuesOn({ date, series }: { date: string; series: Series[] }) {
  return (
    <View style={styles.values}>
      <AppText variant="caption" weight="semibold" tone="muted">
        {shortDate(date)}
      </AppText>
      <View style={styles.valuesGrid}>
        {series.map((s) => {
          const point = s.points.find((p) => p.date === date);
          return (
            <View key={s.test} style={styles.valueItem}>
              <Swatch test={s.test} />
              <AppText variant="caption" numberOfLines={1} style={styles.flex}>
                {LABELS[s.test]}
              </AppText>
              <AppText variant="caption" weight="semibold" tone={point ? undefined : 'muted'}>
                {point ? `${num(point.value)} ${s.unit}` : '—'}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Table({
  data,
  active,
  onPick,
}: {
  data: BloodWork;
  active: BloodTest | null;
  onPick: (t: BloodTest) => void;
}) {
  const [width, setWidth] = useState(0);
  const dates = [...data.dates].reverse();
  const fit = width > 0 ? (width - NAME_WIDTH) / Math.max(dates.length, 1) : MIN_CELL;
  const cell = Math.max(MIN_CELL, Math.floor(fit));
  const scrolls = width > 0 && cell * dates.length > width - NAME_WIDTH + 1;
  const units = new Map(data.tests.map((t) => [t.test, t.unit]));

  return (
    <View style={[styles.card, styles.tableCard]}>
      <View style={styles.tableHead}>
        <AppText weight="semibold">All results</AppText>
        <AppText variant="caption" tone="muted">
          {data.dates.length} test date{data.dates.length === 1 ? '' : 's'} · newest first
        </AppText>
      </View>
      {scrolls ? (
        <View style={styles.swipe}>
          <ChevronsLeft size={icon.sm} color={colors.textMuted} />
          <AppText variant="caption" tone="muted">
            Swipe the dates left to see older results
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
            const on = t.test === active;
            return (
              <Pressable
                key={t.test}
                accessibilityRole="button"
                accessibilityLabel={has ? `Show ${t.label} on the chart` : `${t.label}, no results`}
                disabled={!has}
                onPress={() => onPick(t.test)}
                style={[styles.cell, styles.nameCell, on && styles.rowOn]}
              >
                <AppText
                  variant="caption"
                  weight="semibold"
                  numberOfLines={1}
                  tone={on ? 'primary' : has ? undefined : 'muted'}
                >
                  {t.label}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {units.get(t.test) ?? t.unit}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={scrolls} style={styles.flex}>
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
                <View key={t.test} style={[styles.row, t.test === active && styles.rowOn]}>
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

export function BloodWorkView({ data }: { data: BloodWork }) {
  const [choice, setChoice] = useState<BloodTest | typeof ALL>(ALL);
  const [picked, setPicked] = useState<number | null>(null);
  const one = choice === ALL ? null : (data.tests.find((t) => t.test === choice) ?? null);
  const shown = one ? [one] : data.tests;
  const dates = one ? data.dates.filter((d) => one.points.some((p) => p.date === d)) : data.dates;
  const at = Math.min(picked ?? dates.length - 1, dates.length - 1);

  if (data.tests.length === 0 || data.dates.length === 0)
    return (
      <EmptyState
        icon={FlaskConical}
        title="No blood work yet"
        message="Results the clinic adds or reads from lab reports show here as a chart and a table."
      />
    );

  const choose = (next: BloodTest | typeof ALL) => {
    setChoice(next);
    setPicked(null);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[
          { key: ALL, label: 'All tests' } as const,
          ...data.tests.map((t) => ({ key: t.test, label: LABELS[t.test] })),
        ].map((c) => {
          const on = c.key === choice;
          return (
            <Pressable
              key={c.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => choose(c.key)}
              style={[styles.chip, on && styles.chipOn]}
            >
              {c.key !== ALL ? <Swatch test={c.key} /> : null}
              <AppText variant="caption" weight="semibold" style={on ? styles.chipTextOn : styles.chipText}>
                {c.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.card}>
        <View style={styles.between}>
          <AppText weight="semibold">
            {one ? `${LABELS[one.test]} over time` : 'All results over time'}
          </AppText>
          {one ? (
            <AppText variant="caption" tone="muted">
              {one.unit}
            </AppText>
          ) : null}
        </View>
        {one ? <Headline series={one} /> : null}
        <Chart key={String(choice)} dates={dates} series={shown} picked={at} onPick={setPicked} />
        <AppText variant="caption" tone="muted">
          {dates.length > 1 ? 'Tap a date on the chart to see its values.' : 'Only one test date so far.'}
        </AppText>
        {dates[at] ? <ValuesOn date={dates[at]} series={shown} /> : null}
      </View>

      <Table data={data} active={one?.test ?? null} onPick={choose} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  flex: { flex: 1, minWidth: 0 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  chips: { gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { color: colors.text },
  chipTextOn: { color: colors.primarySoftText },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  card: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  chartSpace: { flex: 1, height: CHART_HEIGHT },
  chartRow: { flexDirection: 'row' },
  axis: { width: AXIS_WIDTH, height: CHART_HEIGHT },
  tick: { position: 'absolute', right: space.sm, fontSize: fontSize.xs - 1 },
  grid: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  baseline: { height: 1, backgroundColor: colors.textMuted },
  groups: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row' },
  group: { alignItems: 'center', borderRadius: radius.sm },
  groupOn: { backgroundColor: colors.primarySoft },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: BAR_GAP },
  barSlot: { alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barValue: { fontSize: fontSize.xs - 1, marginBottom: space.xxs, width: 48, textAlign: 'center' },
  bar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  dateLabel: { height: DATE_HEIGHT, paddingTop: space.xs, fontSize: fontSize.xs - 1 },
  headline: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  values: {
    gap: space.xs,
    padding: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  valuesGrid: { gap: space.xs },
  valueItem: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  tableCard: { padding: 0, gap: 0, overflow: 'hidden' },
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
  rowOn: { backgroundColor: colors.primarySoft },
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
