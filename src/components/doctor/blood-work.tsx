import { FlaskConical, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { EmptyState } from '@/components/feedback/states';
import { AppText } from '@/components/ui/app-text';
import { colors, fontSize, icon, radius, shadow, space } from '@/theme/tokens';
import type { BloodTest, BloodWork } from '@/redux/features/doctor';

const LABELS: Record<BloodTest, string> = {
  fsh: 'FSH',
  estradiol: 'Estradiol',
  testosterone_free: 'Testosterone (Free)',
  testosterone_total: 'Testosterone (Total)',
  dhea_s: 'DHEA-Sulphate',
  vit_d3: 'Vit D3',
  tsh: 'TSH',
  ferritin: 'Ferritin',
  b12: 'B12',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_HEIGHT = 200;
const PAD = { top: 24, right: 16, bottom: 28, left: 44 };
const NAME_WIDTH = 128;
const CELL_WIDTH = 88;

const shortDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''} ${y?.slice(2) ?? ''}`;
};

const num = (value: number) => String(Number(value.toFixed(2)));

type Series = BloodWork['tests'][number];

function Chart({ series }: { series: Series }) {
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const points = series.points;
  const values = points.map((p) => p.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low || Math.max(Math.abs(high), 1);
  const min = Math.max(0, low - span * 0.15);
  const max = high + span * 0.15;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (plotW * i) / (points.length - 1));
  const y = (v: number) => PAD.top + plotH - ((v - min) / (max - min || 1)) * plotH;
  const ticks = [min, (min + max) / 2, max];
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const labelEvery = Math.max(1, Math.ceil(points.length / 4));
  const active = picked ?? points.length - 1;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`${LABELS[series.test]} over time: ${points
        .map((p) => `${shortDate(p.date)} ${num(p.value)} ${series.unit}`)
        .join(', ')}`}
    >
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
          {points.length > 1 ? (
            <Path d={path} stroke={colors.primary} strokeWidth={2} fill="none" strokeLinejoin="round" />
          ) : null}
          {points.map((p, i) => (
            <Circle
              key={`d${p.date}`}
              cx={x(i)}
              cy={y(p.value)}
              r={i === active ? 6 : 4}
              fill={colors.primary}
              stroke={colors.surface}
              strokeWidth={2}
            />
          ))}
          {points.map((p, i) =>
            i % labelEvery === 0 || i === points.length - 1 || i === active ? (
              <SvgText
                key={`x${p.date}`}
                x={x(i)}
                y={CHART_HEIGHT - 8}
                fontSize={fontSize.xs - 1}
                fill={i === active ? colors.text : colors.textMuted}
                fontWeight={i === active ? '600' : '400'}
                textAnchor={
                  points.length === 1
                    ? 'middle'
                    : i === 0
                      ? 'start'
                      : i === points.length - 1
                        ? 'end'
                        : 'middle'
                }
              >
                {shortDate(p.date)}
              </SvgText>
            ) : null,
          )}
          {points[active] ? (
            <SvgText
              x={Math.min(Math.max(x(active), PAD.left + 20), width - PAD.right - 20)}
              y={y(points[active].value) - 12}
              fontSize={fontSize.xs}
              fontWeight="700"
              fill={colors.text}
              textAnchor="middle"
            >
              {num(points[active].value)}
            </SvgText>
          ) : null}
          {points.map((p, i) => (
            <Circle
              key={`h${p.date}`}
              cx={x(i)}
              cy={y(p.value)}
              r={18}
              fill="transparent"
              onPress={() => setPicked(i)}
            />
          ))}
        </Svg>
      ) : (
        <View style={{ height: CHART_HEIGHT }} />
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

export function BloodWorkView({ data }: { data: BloodWork }) {
  const [test, setTest] = useState<BloodTest | null>(data.tests[0]?.test ?? null);
  const series = data.tests.find((t) => t.test === test) ?? data.tests[0];

  if (!series || data.dates.length === 0)
    return (
      <EmptyState
        icon={FlaskConical}
        title="No blood work yet"
        message="Results the clinic adds or reads from lab reports show here as a chart and a table."
      />
    );

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {data.tests.map((t) => {
          const on = t.test === series.test;
          return (
            <Pressable
              key={t.test}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setTest(t.test)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <AppText variant="caption" weight="semibold" style={on ? styles.chipTextOn : styles.chipText}>
                {LABELS[t.test]}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.card}>
        <View style={styles.between}>
          <AppText weight="semibold">{LABELS[series.test]} over time</AppText>
          <AppText variant="caption" tone="muted">
            {series.unit}
          </AppText>
        </View>
        <Headline series={series} />
        {series.points.length > 1 ? (
          <>
            <Chart key={series.test} series={series} />
            <AppText variant="caption" tone="muted">
              Tap a point to see its value.
            </AppText>
          </>
        ) : (
          <AppText variant="caption" tone="muted" style={styles.note}>
            Only one result so far. The trend line appears once a second date is added.
          </AppText>
        )}
      </View>

      <View style={[styles.card, styles.tableCard]}>
        <View style={styles.tableHead}>
          <AppText weight="semibold">All results</AppText>
          <AppText variant="caption" tone="muted">
            {data.dates.length} test date{data.dates.length === 1 ? '' : 's'}
          </AppText>
        </View>
        <View style={styles.table}>
          <View style={{ width: NAME_WIDTH }}>
            <View style={[styles.cell, styles.headCell, styles.nameCell]}>
              <AppText variant="caption" weight="semibold" tone="muted">
                Test
              </AppText>
            </View>
            {data.tests.map((t) => (
              <Pressable
                key={t.test}
                accessibilityRole="button"
                accessibilityLabel={`Show ${LABELS[t.test]} on the chart`}
                onPress={() => setTest(t.test)}
                style={[styles.cell, styles.nameCell, t.test === series.test && styles.rowOn]}
              >
                <AppText
                  variant="caption"
                  weight="semibold"
                  numberOfLines={1}
                  tone={t.test === series.test ? 'primary' : undefined}
                >
                  {LABELS[t.test]}
                </AppText>
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {t.unit}
                </AppText>
              </Pressable>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.row}>
                {[...data.dates].reverse().map((date) => (
                  <View key={date} style={[styles.cell, styles.headCell, styles.valueCell]}>
                    <AppText variant="caption" weight="semibold" tone="muted">
                      {shortDate(date)}
                    </AppText>
                  </View>
                ))}
              </View>
              {data.tests.map((t) => (
                <View key={t.test} style={[styles.row, t.test === series.test && styles.rowOn]}>
                  {[...data.dates].reverse().map((date) => {
                    const point = t.points.find((p) => p.date === date);
                    return (
                      <View key={date} style={[styles.cell, styles.valueCell]}>
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
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  flex: { flex: 1, minWidth: 0 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  chips: { gap: space.sm },
  chip: {
    paddingHorizontal: space.md,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextOn: { color: colors.textInverse },
  card: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
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
  tableCard: { padding: 0, overflow: 'hidden' },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingTop: space.md,
  },
  table: { flexDirection: 'row' },
  row: { flexDirection: 'row' },
  rowOn: { backgroundColor: colors.primarySoft },
  cell: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headCell: { height: 36 },
  nameCell: {
    paddingLeft: space.md,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  valueCell: { width: CELL_WIDTH, alignItems: 'center' },
});
