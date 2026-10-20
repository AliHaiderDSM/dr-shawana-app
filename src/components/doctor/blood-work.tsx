import { ChevronsLeft, FlaskConical, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
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
const CHART_HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
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
  return { color: chart[index % chart.length] ?? colors.primary, dashed: index >= chart.length };
};

function Swatch({ test }: { test: BloodTest }) {
  const s = styleOf(test);
  return (
    <View style={styles.swatch}>
      {s.dashed ? (
        <>
          <View style={[styles.swatchDash, { backgroundColor: s.color }]} />
          <View style={[styles.swatchDash, { backgroundColor: s.color }]} />
        </>
      ) : (
        <View style={[styles.swatchLine, { backgroundColor: s.color }]} />
      )}
    </View>
  );
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
  const values = series.flatMap((s) => s.points.map((p) => p.value));
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low || Math.max(Math.abs(high), 1);
  const min = Math.max(0, low - span * 0.1);
  const max = high + span * 0.1;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (dates.length === 1 ? plotW / 2 : (plotW * i) / (dates.length - 1));
  const y = (v: number) => PAD.top + plotH - ((v - min) / (max - min || 1)) * plotH;
  const ticks = [min, min + (max - min) / 3, min + ((max - min) * 2) / 3, max];
  const labelEvery = Math.max(1, Math.ceil(dates.length / 4));
  const slot = dates.length > 1 ? plotW / (dates.length - 1) : plotW;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={CHART_HEIGHT}>
          {ticks.map((t, i) => (
            <Line
              key={`g${i}`}
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          ))}
          {ticks.map((t, i) => (
            <SvgText
              key={`t${i}`}
              x={PAD.left - 8}
              y={y(t) + 4}
              fontSize={fontSize.xs - 1}
              fill={colors.textMuted}
              textAnchor="end"
            >
              {num(t)}
            </SvgText>
          ))}
          <Line
            x1={x(picked)}
            x2={x(picked)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            stroke={colors.textMuted}
            strokeWidth={1}
          />
          {series.map((s) => {
            const st = styleOf(s.test);
            const pts = dates
              .map((date, i) => ({ i, point: s.points.find((p) => p.date === date) }))
              .filter((p): p is { i: number; point: Series['points'][number] } => Boolean(p.point));
            const d = pts
              .map((p, n) => `${n ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.point.value).toFixed(1)}`)
              .join(' ');
            return (
              <Path
                key={`l${s.test}`}
                d={d}
                stroke={st.color}
                strokeWidth={2}
                strokeDasharray={st.dashed ? '6 4' : undefined}
                fill="none"
                strokeLinejoin="round"
              />
            );
          })}
          {series.map((s) =>
            s.points.map((p) => {
              const i = dates.indexOf(p.date);
              if (i < 0) return null;
              return (
                <Circle
                  key={`d${s.test}${p.date}`}
                  cx={x(i)}
                  cy={y(p.value)}
                  r={i === picked ? 5 : 4}
                  fill={styleOf(s.test).color}
                  stroke={colors.surface}
                  strokeWidth={2}
                />
              );
            }),
          )}
          {dates.map((date, i) =>
            i % labelEvery === 0 || i === dates.length - 1 || i === picked ? (
              <SvgText
                key={`x${date}`}
                x={x(i)}
                y={CHART_HEIGHT - 8}
                fontSize={fontSize.xs - 1}
                fill={i === picked ? colors.text : colors.textMuted}
                fontWeight={i === picked ? '600' : '400'}
                textAnchor={
                  dates.length === 1
                    ? 'middle'
                    : i === 0
                      ? 'start'
                      : i === dates.length - 1
                        ? 'end'
                        : 'middle'
                }
              >
                {shortDate(date)}
              </SvgText>
            ) : null,
          )}
          {dates.map((date, i) => (
            <Rect
              key={`h${date}`}
              x={x(i) - slot / 2}
              y={0}
              width={Math.max(slot, 44)}
              height={CHART_HEIGHT}
              fill="transparent"
              onPress={() => onPick(i)}
            />
          ))}
        </Svg>
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
        {dates.length > 1 ? (
          <>
            <Chart key={String(choice)} dates={dates} series={shown} picked={at} onPick={setPicked} />
            <AppText variant="caption" tone="muted">
              Tap a date on the chart to see its values.
            </AppText>
          </>
        ) : (
          <AppText variant="caption" tone="muted" style={styles.note}>
            Only one test date so far ({shortDate(dates[0] ?? data.dates[0] ?? '')}). The trend lines appear
            once a second date is added.
          </AppText>
        )}
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
  swatch: { width: 16, height: 10, flexDirection: 'row', alignItems: 'center', gap: 3 },
  swatchLine: { flex: 1, height: 3, borderRadius: radius.pill },
  swatchDash: { width: 6, height: 3, borderRadius: radius.pill },
  card: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  chartSpace: { height: CHART_HEIGHT },
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
  note: { paddingVertical: space.sm },
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
